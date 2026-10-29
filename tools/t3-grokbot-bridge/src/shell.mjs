import { createHash } from "node:crypto";
import { excerpt, oneLine } from "./redact.mjs";

// Turns successive shell rows into lifecycle updates. The shell carries each
// thread's current state, coalesced by the server, so a diff yields the
// transitions between observations; a run that both started and finished
// between two observations is still reported as started, then finished.

const LIVE = new Set(["queued", "preparing", "starting", "running", "waiting"]);
const TERMINAL = new Set(["completed", "failed", "interrupted", "cancelled", "rolled_back"]);
const ATTENTION_KINDS = new Set(["thread.needs_input", "thread.plan_ready", "thread.error", "run.failed", "thread.blocked"]);

export const MESSAGE_EXCERPT = 2_000;

/** The fields of a shell thread the bridge keeps and reports; everything else is dropped. */
export function normalizeThread(thread) {
  const message = thread.latestVisibleMessage;
  return {
    id: thread.id,
    projectId: thread.projectId,
    title: oneLine(thread.title, 200),
    parentThreadId: thread.lineage?.parentThreadId ?? null,
    relationship: thread.lineage?.relationshipToParent ?? null,
    createdBy: thread.createdBy ?? null,
    creationSource: thread.creationSource ?? null,
    status: thread.status,
    activity: thread.activityRunStatus ?? null,
    activeRunId: thread.activeRunId ?? null,
    latestRunId: thread.latestRunId ?? null,
    latestRunRequestedAt: thread.latestRunRequestedAt ?? null,
    latestRunStartedAt: thread.latestRunStartedAt ?? null,
    latestRunCompletedAt: thread.latestRunCompletedAt ?? null,
    stopRequested: thread.latestRunStopRequested ?? false,
    blockedOnThreadWait: thread.blockedOnThreadWait ?? false,
    lastError: thread.lastError ? excerpt(thread.lastError, 1_000) : null,
    lastErrorClass: thread.lastErrorClass ?? null,
    lastErrorCode: thread.lastErrorCode ?? null,
    usageLimitResetAt: thread.usageLimitResetAt ?? null,
    pendingRequest: thread.pendingRuntimeRequest
      ? {
          id: thread.pendingRuntimeRequest.id,
          kind: thread.pendingRuntimeRequest.kind,
          blocking: thread.pendingRuntimeRequest.blocking ?? true,
          createdAt: thread.pendingRuntimeRequest.createdAt,
        }
      : null,
    planReady: thread.hasActionableProposedPlan === true,
    backgroundTasks: thread.pendingBackgroundTasks?.length ?? 0,
    latestMessage: message
      ? { id: message.id, role: message.role, text: excerpt(message.text, MESSAGE_EXCERPT), updatedAt: message.updatedAt }
      : null,
    pullRequests: (thread.pullRequests ?? []).filter((pr) => typeof pr.url === "string").map((pr) => ({ url: pr.url, number: pr.number ?? null })),
    settledAt: thread.settledAt ?? null,
    settledOverride: thread.settledOverride ?? null,
    unsettledAt: thread.unsettledAt ?? null,
    archivedAt: thread.archivedAt ?? null,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
}

export function normalizeProject(project) {
  return { id: project.id, title: oneLine(project.title, 200), workspaceRoot: project.workspaceRoot ?? null };
}

/** Live work: what the desktop keeps mounted, and what gets a detail subscription. */
export function isLive(row) {
  return LIVE.has(row.status) || row.activity !== null || row.pendingRequest !== null || row.backgroundTasks > 0;
}

export function needsAttention(row) {
  return row.pendingRequest !== null || row.planReady || (row.status === "failed" && row.settledAt === null) || row.usageLimitResetAt !== null;
}

export function stateOf(row) {
  return {
    status: row.status,
    activity: row.activity,
    active_run_id: row.activeRunId,
    latest_run_id: row.latestRunId,
    pending_request: row.pendingRequest,
    plan_ready: row.planReady,
    background_tasks: row.backgroundTasks,
    blocked_on_thread_wait: row.blockedOnThreadWait,
    usage_limit_reset_at: row.usageLimitResetAt,
    last_error: row.lastError ? { message: row.lastError, class: row.lastErrorClass, code: row.lastErrorCode } : null,
    settled_at: row.settledAt,
    archived_at: row.archivedAt,
  };
}

function hash(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

function message(row) {
  return row.latestMessage ? { id: row.latestMessage.id, role: row.latestMessage.role, text: row.latestMessage.text } : null;
}

/**
 * Updates between two observations of one thread. `prev` is null for a thread first seen live.
 * Ids are stable for the same transition, so replays and retries deduplicate.
 */
export function diffThread(prev, next, { detailed = false, observation = "live" } = {}) {
  const out = [];
  const add = (kind, status, id, summary, fields = {}) =>
    out.push({ kind, status, id, summary, at: fields.at ?? next.updatedAt, runId: fields.runId ?? next.latestRunId, update: fields.update ?? {}, observation, hold: fields.hold ?? false });
  const was = prev ?? { status: "idle", activity: null, latestRunId: null, pendingRequest: null, planReady: false, lastError: null, usageLimitResetAt: null, settledAt: null, unsettledAt: null, archivedAt: null, pullRequests: [], blockedOnThreadWait: false, latestMessage: null };

  if (prev === null) add("thread.created", "created", "created", `New thread: ${next.title}`, { at: next.createdAt, update: { origin: { created_by: next.createdBy, creation_source: next.creationSource } } });

  const runId = next.latestRunId;
  const newRun = runId !== null && runId !== was.latestRunId;
  const waiting = next.status === "waiting" || next.activity === "waiting" || next.blockedOnThreadWait;
  const wasWaiting = was.status === "waiting" || was.activity === "waiting" || was.blockedOnThreadWait;
  if (runId !== null) {
    if (newRun && next.status === "queued") {
      add("run.queued", "queued", `run:${runId}:queued`, "Run queued", { at: next.latestRunRequestedAt ?? next.updatedAt });
    } else if (newRun || (was.status === "queued" && next.status !== "queued")) {
      if (next.status !== "idle") {
        add("run.started", "started", `run:${runId}:started`, "Run started", { at: next.latestRunStartedAt ?? next.latestRunRequestedAt ?? next.updatedAt });
      }
    }
    if (waiting && (!wasWaiting || newRun)) {
      const reason = next.blockedOnThreadWait ? "waiting on another thread" : "waiting";
      add("run.waiting", "waiting", `run:${runId}:waiting:${next.updatedAt}`, `Run ${reason}`, { update: { reason, background_tasks: next.backgroundTasks } });
    }
    if (TERMINAL.has(next.status) && (newRun || next.status !== was.status)) {
      // The shell can report the end of a run before the detail stream delivers its last items;
      // holding the report lets those items flush ahead of it.
      const at = next.latestRunCompletedAt ?? next.updatedAt;
      const hold = detailed;
      if (next.status === "completed") {
        add("run.completed", "completed", `run:${runId}:completed`, "Run completed", { at, hold, update: { latest_message: message(next) } });
      } else if (next.status === "failed") {
        add("run.failed", "failed", `run:${runId}:failed`, `Run failed${next.lastError ? `: ${oneLine(next.lastError, 160)}` : ""}`, {
          at,
          hold,
          update: { error: next.lastError ? { message: next.lastError, class: next.lastErrorClass, code: next.lastErrorCode } : null, latest_message: message(next) },
        });
      } else {
        add("run.stopped", next.status, `run:${runId}:${next.status}`, `Run ${next.status.replace("_", " ")}`, { at, hold, update: { latest_message: message(next) } });
      }
    }
  }

  if (next.lastError && next.lastError !== was.lastError && next.status !== "failed") {
    add("thread.error", "error", `error:${runId ?? "none"}:${hash(next.lastError)}`, `Error: ${oneLine(next.lastError, 160)}`, {
      update: { error: { message: next.lastError, class: next.lastErrorClass, code: next.lastErrorCode } },
    });
  }
  if (next.usageLimitResetAt && next.usageLimitResetAt !== was.usageLimitResetAt) {
    add("thread.blocked", "blocked", `usage-limit:${next.usageLimitResetAt}`, `Blocked by a usage limit until ${next.usageLimitResetAt}`, {
      update: { reason: "usage_limit", reset_at: next.usageLimitResetAt },
    });
  }
  if (next.pendingRequest && next.pendingRequest.id !== was.pendingRequest?.id) {
    const blocking = next.pendingRequest.blocking ? "" : " (non-blocking)";
    add("thread.needs_input", "needs_input", `request:${next.pendingRequest.id}`, `Needs input: ${next.pendingRequest.kind}${blocking}`, {
      at: next.pendingRequest.createdAt,
      hold: detailed,
      update: { request: next.pendingRequest, latest_message: message(next) },
    });
  }
  if (was.pendingRequest && was.pendingRequest.id !== next.pendingRequest?.id) {
    add("thread.input_resolved", "resumed", `request:${was.pendingRequest.id}:resolved`, `Input request resolved: ${was.pendingRequest.kind}`, {
      update: { request: was.pendingRequest },
    });
  }
  if (next.planReady && !was.planReady) {
    add("thread.plan_ready", "needs_input", `plan:${runId ?? "none"}:${next.updatedAt}`, "Proposed plan is waiting for approval", { update: { latest_message: message(next) } });
  }
  for (const pr of next.pullRequests) {
    if (!was.pullRequests.some((old) => old.url === pr.url)) {
      add("thread.pull_request", "pull_request", `pr:${pr.url}`, `Pull request linked: ${pr.url}`, { update: { pull_request: pr } });
    }
  }
  if (next.settledAt && next.settledAt !== was.settledAt) {
    add("thread.settled", "settled", `settled:${next.settledAt}`, "Thread settled", { at: next.settledAt, hold: detailed, update: { latest_message: message(next) } });
  }
  if (next.unsettledAt && next.unsettledAt !== was.unsettledAt && next.settledAt === null) {
    add("thread.unsettled", "unsettled", `unsettled:${next.unsettledAt}`, "Thread reopened", { at: next.unsettledAt });
  }
  if (next.archivedAt && next.archivedAt !== was.archivedAt) {
    add("thread.archived", "archived", `archived:${next.archivedAt}`, "Thread archived", { at: next.archivedAt });
  }
  if (!detailed && next.latestMessage?.role === "assistant" && (next.latestMessage.id !== was.latestMessage?.id || next.latestMessage.text !== was.latestMessage?.text)) {
    out.push({
      fragment: true,
      revise: true,
      id: `message:${next.latestMessage.id}`,
      at: next.latestMessage.updatedAt,
      runId,
      observation,
      fragmentBody: { type: "assistant_message", text: next.latestMessage.text, source: "shell" },
    });
  }
  return out;
}

/** Subagent rows report everything, nothing, or only what needs someone's attention. */
export function filterForSubagent(updates, row, mode) {
  if (row.relationship !== "subagent" || mode === "all") return updates;
  if (mode === "off") return [];
  return updates.filter((u) => ATTENTION_KINDS.has(u.kind));
}

