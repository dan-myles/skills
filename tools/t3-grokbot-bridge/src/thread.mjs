import { createHash } from "node:crypto";
import { excerpt, oneLine } from "./redact.mjs";
import { MESSAGE_EXCERPT } from "./shell.mjs";

// Classifies thread-detail stream items. Streaming deltas are not updates of
// their own: an item is reported once it settles, keyed by its T3 id, so the
// growing copies the server sends while it streams collapse into one entry.
// Tool output, request answers, secret-card details and reasoning are never
// captured.

const DONE = new Set(["completed", "failed", "cancelled", "interrupted"]);
const OPEN = new Set(["pending", "waiting", "running", "idle"]);
const REQUEST_KINDS_WITHOUT_ITEMS = new Set(["mcp-elicitation", "auth_refresh", "dynamic_tool_call"]);

function hash(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

function fragment(id, item, body, extra = {}) {
  return { fragment: true, id, at: item.updatedAt ?? item.completedAt ?? item.startedAt, runId: item.runId ?? null, fragmentBody: body, ...extra };
}

function needsInput(id, item, summary, update) {
  return [
    { enrich: id, patch: update },
    { kind: "thread.needs_input", status: "needs_input", id, summary, at: item.updatedAt, runId: item.runId ?? null, update },
  ];
}

export function classifyItem(item, { userMessageText = false } = {}) {
  const title = item.title ? oneLine(item.title, 200) : null;
  switch (item.type) {
    case "assistant_message":
      if (item.streaming || item.status !== "completed") return [];
      return [fragment(`message:${item.messageId}`, item, { type: "assistant_message", text: excerpt(item.text, MESSAGE_EXCERPT) }, { revise: true })];
    case "reasoning":
      return [];
    case "user_message":
      return [
        fragment(`user-message:${item.messageId}`, item, {
          type: "user_message",
          created_by: item.createdBy ?? null,
          creation_source: item.creationSource ?? null,
          ...(item.senderThreadId ? { sender_thread_id: item.senderThreadId } : {}),
          ...(item.scheduledTaskId ? { scheduled_task_id: item.scheduledTaskId } : {}),
          ...(userMessageText ? { text: excerpt(item.text, 500) } : {}),
        }),
      ];
    case "todo_list": {
      const steps = (item.steps ?? []).map((step) => ({ text: oneLine(step.text, 160), status: step.status }));
      return [fragment(`todo:${item.id}:${hash(JSON.stringify(steps))}`, item, { type: "todo_list", steps })];
    }
    case "user_input_request": {
      if (!OPEN.has(item.status)) return [];
      const questions = (item.questions ?? []).map((q) => ({
        header: oneLine(q.header, 80),
        question: excerpt(q.question, 500),
        options: (q.options ?? []).map((o) => oneLine(o.label, 80)),
        multi_select: q.multiSelect ?? false,
      }));
      return needsInput(`request:${item.requestId}`, item, `Needs input: ${questions[0]?.header ?? "question"}`, {
        request: { id: item.requestId, kind: "user_input" },
        questions,
      });
    }
    case "approval_request": {
      if (!OPEN.has(item.status)) return [];
      return needsInput(`request:${item.requestId}`, item, `Needs approval: ${item.requestKind}`, {
        request: { id: item.requestId, kind: item.requestKind },
        prompt: item.prompt ? excerpt(item.prompt, 500) : null,
        reason: item.reason ? excerpt(item.reason, 300) : null,
        app: item.appName ? oneLine(item.appName, 80) : null,
      });
    }
    case "secret_request": {
      const label = oneLine(item.label, 120);
      if (item.secretStatus === "pending") {
        return needsInput(`item:${item.id}:secret`, item, `Needs a secret: ${label}`, { request: { id: item.id, kind: "secret" }, label });
      }
      return [fragment(`item:${item.id}:secret:${item.secretStatus}`, item, { type: "secret_request", label, status: item.secretStatus })];
    }
    case "link_request": {
      if (item.linkStatus === "pending") {
        return needsInput(`item:${item.id}:link`, item, "Needs an environment link", { request: { id: item.id, kind: "link" }, reason: excerpt(item.reason, 300) });
      }
      return [fragment(`item:${item.id}:link:${item.linkStatus}`, item, { type: "link_request", status: item.linkStatus })];
    }
    case "command_execution":
      if (!DONE.has(item.status)) return [];
      return [
        fragment(`item:${item.id}`, item, {
          type: "command",
          title,
          command: oneLine(item.input, 200),
          exit_code: item.exitCode ?? null,
          failed: item.status === "failed" || item.outputIndicatesFailure === true || (item.exitCode ?? 0) !== 0,
        }),
      ];
    case "file_change":
      if (!DONE.has(item.status)) return [];
      return [fragment(`item:${item.id}`, item, { type: "file_change", file: oneLine(item.fileName, 300), additions: item.additions ?? null, deletions: item.deletions ?? null, status: item.status })];
    case "dynamic_tool":
      if (!DONE.has(item.status)) return [];
      return [fragment(`item:${item.id}`, item, { type: "tool", tool: item.toolName ? oneLine(item.toolName, 120) : null, title, status: item.status })];
    case "error":
      return [
        {
          kind: "thread.error",
          status: "error",
          id: `item:${item.id}:error`,
          summary: `Error: ${oneLine(item.failure?.message, 160)}`,
          at: item.updatedAt,
          runId: item.runId ?? null,
          update: {
            error: { message: excerpt(item.failure?.message, 1_000), class: item.failure?.class ?? null, code: item.failure?.code ?? null, retryable: item.failure?.retryable ?? null },
            retry: item.retry ?? null,
          },
        },
      ];
    case "subagent": {
      const base = { type: "subagent", title, child_thread_id: item.childThreadId ?? null };
      if (DONE.has(item.status)) {
        return [fragment(`subagent:${item.subagentId}:${item.status}`, item, { ...base, status: item.status, result: item.result ? excerpt(item.result, 800) : null })];
      }
      return [fragment(`subagent:${item.subagentId}:started`, item, { ...base, status: "started" })];
    }
    default:
      if (!DONE.has(item.status) && item.status !== "idle") return [];
      return [fragment(`item:${item.id}`, item, { type: item.type, title, status: item.status })];
  }
}

export function classifyEvent(event, options) {
  if (event.type === "turn-item.updated") return classifyItem(event.payload, options);
  if (event.type === "runtime-request.updated") {
    const request = event.payload;
    if (request.status !== "pending" || !REQUEST_KINDS_WITHOUT_ITEMS.has(request.kind)) return [];
    const update = { request: { id: request.id, kind: request.kind } };
    return [
      { enrich: `request:${request.id}`, patch: update },
      { kind: "thread.needs_input", status: "needs_input", id: `request:${request.id}`, summary: `Needs input: ${request.kind}`, at: request.createdAt, runId: event.runId ?? null, update },
    ];
  }
  return [];
}

/**
 * Items of a detail snapshot worth reporting: those of the latest run updated after `since`, which
 * happened after the bridge last looked but before this subscription. Anything older is history,
 * not news, including the earlier part of a run already in progress when the bridge started.
 */
export function classifySnapshot(projection, since, options) {
  const runs = [...(projection.runs ?? [])].sort((a, b) => a.ordinal - b.ordinal);
  const latest = runs.at(-1)?.id ?? null;
  if (latest === null) return [];
  const sinceMs = Date.parse(since);
  return (projection.turnItems ?? [])
    .filter((item) => item.runId === latest && Date.parse(item.updatedAt) > sinceMs)
    .flatMap((item) => classifyItem(item, options));
}
