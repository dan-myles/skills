import { createHash } from "node:crypto";
import { oneLine } from "./redact.mjs";
import { stateOf } from "./shell.mjs";

export const REPORT_SCHEMA = "t3-grokbot-bridge.report.v1";
export const ENVIRONMENT_THREAD = "_environment";

export function threadLink(environmentId, threadId) {
  return `t3-thread://v2/${environmentId}/${threadId}`;
}

/** Fields every report about a thread carries, captured with the update. */
export function threadContext({ environment, project, route, row }) {
  return {
    schema: REPORT_SCHEMA,
    environment: { id: environment.id, label: environment.label, key: environment.key },
    project: { id: project?.id ?? row.projectId, title: project?.title ?? null, key: route.key },
    item: route.key,
    thread: row.id,
    thread_title: row.title,
    thread_link: threadLink(environment.id, row.id),
    parent_thread_id: row.parentThreadId,
    relationship: row.relationship,
    origin: { created_by: row.createdBy, creation_source: row.creationSource },
  };
}

export function environmentContext(environment, route) {
  return {
    schema: REPORT_SCHEMA,
    environment: { id: environment.id, label: environment.label, key: environment.key },
    project: route ? { id: route.projectId ?? null, title: route.title ?? null, key: route.key } : null,
    item: route?.key ?? ENVIRONMENT_THREAD,
    thread: null,
    thread_title: null,
    thread_link: null,
  };
}

/** A captured update, ready for `Store.capture`. */
export function toCapture({ update, context, row, route, threadId, projectId }) {
  const state = row ? stateOf(row) : null;
  if (update.fragment) {
    return {
      id: update.id,
      threadId,
      projectId,
      routeKey: route.key,
      target: route.target,
      kind: "fragment",
      standalone: false,
      revise: update.revise ?? false,
      body: { context, state, at: update.at, run_id: update.runId ?? null, observation: update.observation ?? "live", fragment: update.fragmentBody },
    };
  }
  return {
    id: update.id,
    threadId,
    projectId,
    routeKey: route.key,
    target: route.target,
    kind: update.kind,
    standalone: true,
    holdMs: update.holdMs ?? 0,
    body: {
      ...context,
      kind: update.kind,
      status: update.status,
      summary: oneLine(update.summary, 300),
      at: update.at,
      run_id: update.runId ?? null,
      observation: update.observation ?? "live",
      state,
      update: update.update ?? {},
    },
  };
}

function reportId(environmentId, threadId, suffix) {
  return `${environmentId}/${threadId}/${suffix}`;
}

function progressSummary(fragments) {
  const counts = new Map();
  let failed = 0;
  let lastMessage = null;
  for (const f of fragments) {
    counts.set(f.type, (counts.get(f.type) ?? 0) + 1);
    if (f.failed) failed += 1;
    if (f.type === "assistant_message") lastMessage = f.text;
  }
  const parts = [...counts].map(([type, n]) => `${n} ${type.replaceAll("_", " ")}${n === 1 ? "" : "s"}`);
  if (failed) parts.push(`${failed} failed`);
  const head = parts.join(", ");
  return lastMessage ? `${head}: ${oneLine(lastMessage, 200)}` : head;
}

function progressReport(environmentId, threadId, rows) {
  const last = rows.at(-1).body;
  const ids = rows.map((r) => r.update_id);
  const fragments = rows.map((r) => ({ update_id: r.update_id, at: r.body.at, run_id: r.body.run_id, observation: r.body.observation, ...r.body.fragment }));
  const runIds = [...new Set(rows.map((r) => r.body.run_id).filter(Boolean))];
  const id = reportId(environmentId, threadId, `progress/${createHash("sha256").update(ids.join("\n")).digest("hex").slice(0, 20)}`);
  return {
    id,
    target: rows[0].target,
    routeKey: rows[0].route_key,
    body: {
      ...last.context,
      event_id: id,
      observed_at: new Date(rows.at(-1).captured_at).toISOString(),
      kind: "thread.progress",
      status: "progress",
      summary: progressSummary(fragments),
      at: last.at,
      run_id: runIds.at(-1) ?? null,
      run_ids: runIds,
      observation: rows.some((r) => r.body.observation !== "live") ? "mixed" : "live",
      state: last.state,
      update: { count: fragments.length, first_at: rows[0].body.at, last_at: last.at, fragments },
    },
  };
}

/**
 * Moves due captures of one thread into the outbox in event-time order. Fragments wait to batch
 * unless they are old enough, numerous enough, or followed by a due standalone update; a held
 * standalone update also holds everything captured after it, so order is preserved.
 */
export function flushThread(store, environmentId, threadId, { now, flushAfterMs, maxFragments, force = false }) {
  // T3 time, not arrival time: the shell and detail streams of one thread arrive independently.
  const time = (row) => Date.parse(row.body.at ?? "") || row.captured_at;
  const rows = store.pendingFor(threadId).sort((a, b) => time(a) - time(b) || a.seq - b.seq);
  let fragments = [];
  let enqueued = 0;
  const emitFragments = () => {
    for (let i = 0; i < fragments.length; i += maxFragments) {
      const chunk = fragments.slice(i, i + maxFragments);
      const report = progressReport(environmentId, threadId, chunk);
      store.enqueue(report, now);
      store.markReported(chunk.map((r) => r.seq), report.id);
      enqueued += 1;
    }
    fragments = [];
  };
  for (const row of rows) {
    if (row.standalone) {
      if (row.due_at > now && !force) break;
      emitFragments();
      const id = reportId(environmentId, threadId, row.update_id);
      store.enqueue({ id, target: row.target, routeKey: row.route_key, body: { ...row.body, event_id: id, observed_at: new Date(row.captured_at).toISOString() } }, now);
      store.markReported([row.seq], id);
      enqueued += 1;
    } else {
      fragments.push(row);
    }
  }
  if (fragments.length > 0 && (force || fragments.length >= maxFragments || now - fragments[0].captured_at >= flushAfterMs)) {
    emitFragments();
  }
  return enqueued;
}
