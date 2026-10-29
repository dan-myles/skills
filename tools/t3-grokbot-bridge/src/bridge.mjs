import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { resolveRoute } from "./config.mjs";
import { Deliverer } from "./delivery.mjs";
import { flushThread, threadContext, environmentContext, toCapture, threadLink } from "./report.mjs";
import { AuthError, IncompatibleServerError, RpcConnection, checkDescriptor, describeExit, fetchDescriptor } from "./rpc.mjs";
import { diffThread, filterForSubagent, isLive, needsAttention, normalizeProject, normalizeThread } from "./shell.mjs";
import { classifyEvent, classifySnapshot } from "./thread.mjs";

const REQUEST_HOLD_MS = 3_000;
const NEW_THREAD_WINDOW_MS = 15 * 60_000;
const SNAPSHOT_LIST_LIMIT = 200;
const DETAIL_RETRY_MS = 60_000;

/** A wait that `wake()` can cut short. */
class Alarm {
  wait(ms) {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.timer = setTimeout(resolve, ms);
    });
  }
  wake() {
    clearTimeout(this.timer);
    this.resolve?.();
  }
}

export class Bridge {
  constructor({ config, store, log, fetchImpl = fetch, WebSocketImpl = globalThis.WebSocket, now = () => Date.now(), random = Math.random }) {
    this.config = config;
    this.store = store;
    this.log = log;
    this.fetchImpl = fetchImpl;
    this.WebSocketImpl = WebSocketImpl;
    this.now = now;
    this.random = random;
    this.deliverer = new Deliverer({ store, config, log, fetchImpl, now });
    this.threads = store.getThreads();
    this.projects = store.getProjects();
    this.detail = new Map();
    this.detailRetryAt = new Map();
    this.catchUp = new Set();
    this.stopped = false;
    this.reconnectAlarm = new Alarm();
    this.deliveryAlarm = new Alarm();
    this.status = { connection: "starting", lastError: null, connectedAt: null };
  }

  async run() {
    this.ticker = setInterval(() => this.tick(), 1_000);
    this.statusTimer = setInterval(() => this.writeStatus(), 15_000);
    await Promise.all([this.connectionLoop(), this.deliveryLoop()]);
  }

  stop() {
    this.stopped = true;
    clearInterval(this.ticker);
    clearInterval(this.statusTimer);
    this.connection?.shutdown("stopping");
    this.reconnectAlarm.wake();
    this.deliveryAlarm.wake();
  }

  async connectionLoop() {
    let failures = 0;
    while (!this.stopped) {
      const startedAt = this.now();
      let delay;
      try {
        const reason = await this.session();
        this.log.warn("disconnected from T3", { reason });
        this.status = { ...this.status, connection: "disconnected", lastError: reason };
      } catch (error) {
        this.status = { ...this.status, connection: "error", lastError: error.message };
        if (error instanceof AuthError) delay = 10 * 60_000;
        if (error instanceof IncompatibleServerError) delay = 30 * 60_000;
        this.log.error("T3 session failed", { error: error.message });
      }
      if (this.now() - startedAt > 60_000) failures = 0;
      const base = Math.min(300_000, 1_000 * 2 ** failures);
      failures += 1;
      delay ??= Math.round(base / 2 + this.random() * (base / 2));
      this.writeStatus();
      if (!this.stopped) await this.reconnectAlarm.wait(delay);
    }
  }

  async session() {
    const descriptor = await fetchDescriptor(this.config.environment.httpBaseUrl, { fetchImpl: this.fetchImpl });
    checkDescriptor(descriptor);
    const known = this.store.getMeta("environment_id");
    if (known !== null && known !== descriptor.environmentId) {
      throw new IncompatibleServerError("state directory belongs to a different T3 environment");
    }
    this.store.setMeta("environment_id", descriptor.environmentId);
    this.environment = { id: descriptor.environmentId, label: this.config.environment.label ?? descriptor.label ?? null, key: this.config.environment.key };
    const token = readFileSync(this.config.environment.tokenFile, "utf8").trim();
    const connection = new RpcConnection({ httpBaseUrl: this.config.environment.httpBaseUrl, token, fetchImpl: this.fetchImpl, WebSocketImpl: this.WebSocketImpl });
    const closed = new Promise((resolve) => connection.onClose((reason, error) => resolve(error ? `${reason}` : reason)));
    await connection.open();
    this.connection = connection;
    this.detail.clear();
    this.catchUp = new Set(this.store.sql("select substr(stream, 8) as id from cursors where stream like 'thread:%'").all().map((r) => r.id));
    this.shellSynchronized = false;
    this.status = { connection: "connected", lastError: null, connectedAt: new Date(this.now()).toISOString(), serverVersion: descriptor.serverVersion ?? null };
    this.log.info("connected to T3", { environment: this.environment.id, serverVersion: descriptor.serverVersion ?? null });
    const after = this.store.hasBaseline() ? this.store.getCursor("shell") : null;
    connection.stream(
      "orchestration.subscribeShell",
      { ...(after !== null ? { afterSequence: after } : {}), requestCompletionMarker: true },
      { onItems: (items) => this.onShellItems(items), onExit: (exit) => connection.shutdown(`shell stream ended: ${describeExit(exit)}`) },
    );
    const reason = await closed;
    this.connection = null;
    this.detail.clear();
    return reason;
  }

  routeFor(projectId) {
    const project = this.projects.get(projectId) ?? { id: projectId, title: null, workspaceRoot: null };
    return resolveRoute(this.config, project);
  }

  capture(update, row, route) {
    const now = this.now();
    if (update.enrich) {
      this.store.enrichPending(update.enrich, update.patch, now);
      return;
    }
    const project = this.projects.get(row.projectId);
    const context = threadContext({ environment: this.environment, project, route, row });
    const hold = update.hold ? REQUEST_HOLD_MS : 0;
    this.store.capture(toCapture({ update: { ...update, holdMs: hold }, context, row, route, threadId: row.id, projectId: row.projectId }), now);
  }

  // Shell stream

  onShellItems(items) {
    this.store.transaction(() => {
      let cursor = null;
      for (const item of items) {
        if (item.kind === "synchronized") {
          this.shellSynchronized = true;
        } else if (item.kind === "snapshot") {
          // Same rule as T3's client: only a snapshot without resolved roots replaces state;
          // the others refresh project metadata and carry no thread rows.
          if (item.resolvedRepositoryIdentityRoots !== undefined) {
            for (const project of item.snapshot.projects) this.putProject(project);
          } else {
            this.applySnapshot(item.snapshot);
            cursor = item.snapshot.snapshotSequence;
          }
        } else if (item.kind === "project.updated") {
          this.putProject(item.project);
          cursor = item.sequence;
        } else if (item.kind === "project.removed") {
          this.projects.delete(item.projectId);
          this.store.deleteProject(item.projectId);
          cursor = item.sequence;
        } else if (item.kind === "thread.updated") {
          this.applyThread(item.thread, item.location);
          cursor = item.sequence;
        } else if (item.kind === "thread.removed") {
          this.removeThread(item.threadId, "thread.removed", "Thread deleted or archived");
          cursor = item.sequence;
        }
      }
      if (cursor !== null) this.store.setCursor("shell", Math.max(cursor, this.store.getCursor("shell") ?? 0));
      this.flushDue();
    });
    this.reconcileDetail();
    this.deliveryAlarm.wake();
  }

  putProject(project) {
    const row = normalizeProject(project);
    this.projects.set(row.id, row);
    this.store.putProject(row);
  }

  applySnapshot(snapshot) {
    for (const project of snapshot.projects) this.putProject(project);
    const listed = new Set(snapshot.projects.map((p) => p.id));
    for (const id of [...this.projects.keys()]) {
      if (!listed.has(id)) {
        this.projects.delete(id);
        this.store.deleteProject(id);
      }
    }
    const rows = snapshot.threads.map(normalizeThread);
    if (!this.store.hasBaseline()) {
      for (const row of rows) this.putThread(row);
      this.captureProjectSnapshots(snapshot.snapshotSequence, "startup");
      this.store.setMeta("baseline_sequence", String(snapshot.snapshotSequence));
      this.store.setMeta("baseline_at", new Date(this.now()).toISOString());
      this.log.info("baseline captured", { threads: rows.length, projects: snapshot.projects.length, sequence: snapshot.snapshotSequence });
      return;
    }
    // A full snapshot after a gap: report what changed since the last observation, flagged as such.
    const previousCursor = this.store.getCursor("shell");
    const seen = new Set();
    for (const row of rows) {
      seen.add(row.id);
      this.observeThread(row, "resnapshot", false);
    }
    for (const id of [...this.threads.keys()]) {
      if (!seen.has(id)) this.removeThread(id, "thread.gone", "Thread archived or deleted while the bridge was disconnected", "resnapshot");
    }
    this.captureProjectSnapshots(snapshot.snapshotSequence, "resnapshot", previousCursor);
    this.log.warn("resynchronized from a full snapshot", { from: previousCursor, to: snapshot.snapshotSequence });
  }

  applyThread(thread, location) {
    const row = normalizeThread(thread);
    this.observeThread(row, this.shellSynchronized ? "live" : "resume", location === "archive");
  }

  observeThread(row, observation, archived) {
    const prev = this.threads.get(row.id) ?? null;
    const route = this.routeFor(row.projectId);
    if (route && !this.config.ignoreThreadIds.has(row.id)) {
      const isNew = prev === null && this.now() - Date.parse(row.createdAt) < NEW_THREAD_WINDOW_MS;
      let updates = diffThread(prev, row, { detailed: this.detail.get(row.id)?.synchronized === true, observation });
      if (prev === null && !isNew) {
        updates = updates.map((u) => (u.kind === "thread.created" ? { ...u, kind: "thread.appeared", status: "appeared", id: `appeared:${row.updatedAt}`, summary: `Thread appeared: ${row.title}` } : u));
      }
      for (const update of filterForSubagent(updates, row, route.subagents)) this.capture(update, row, route);
    }
    if (archived) {
      this.threads.delete(row.id);
      this.store.deleteThread(row.id);
    } else {
      this.putThread(row);
    }
  }

  putThread(row) {
    this.threads.set(row.id, row);
    this.store.putThread(row);
  }

  removeThread(threadId, kind, summary, observation = "live") {
    const row = this.threads.get(threadId);
    if (!row) return;
    const route = this.routeFor(row.projectId);
    if (route && !this.config.ignoreThreadIds.has(threadId) && filterForSubagent([{ kind }], row, route.subagents).length > 0) {
      this.capture({ kind, status: "removed", id: `${kind}:${row.updatedAt}`, summary, at: new Date(this.now()).toISOString(), runId: row.latestRunId, observation, update: {} }, row, route);
    }
    this.threads.delete(threadId);
    this.store.deleteThread(threadId);
  }

  /** Current state per project: a startup or resync fact, not a replay of history. */
  captureProjectSnapshots(sequence, observation, previousCursor = null) {
    const byProject = new Map();
    for (const row of this.threads.values()) {
      if (!byProject.has(row.projectId)) byProject.set(row.projectId, []);
      byProject.get(row.projectId).push(row);
    }
    for (const project of this.projects.values()) {
      const route = resolveRoute(this.config, project);
      if (!route) continue;
      const rows = (byProject.get(project.id) ?? []).filter((r) => !this.config.ignoreThreadIds.has(r.id));
      const topLevel = rows.filter((r) => r.relationship !== "subagent");
      const listed = rows.filter((r) => isLive(r) || needsAttention(r) || (r.relationship !== "subagent" && r.settledAt === null));
      const counts = {
        threads: rows.length,
        top_level: topLevel.length,
        live: rows.filter(isLive).length,
        needs_attention: rows.filter(needsAttention).length,
        unsettled_top_level: topLevel.filter((r) => r.settledAt === null).length,
      };
      const threadId = `_project:${project.id}`;
      const gap = observation === "resnapshot";
      this.store.capture(
        {
          id: `${observation}:${project.id}:${sequence}`,
          threadId,
          projectId: project.id,
          routeKey: route.key,
          target: route.target,
          kind: "project.snapshot",
          standalone: true,
          body: {
            ...environmentContext(this.environment, { ...route, projectId: project.id, title: project.title }),
            kind: gap ? "project.resynced" : "project.snapshot",
            status: gap ? "resynced" : "snapshot",
            summary: `${counts.live} live, ${counts.needs_attention} need attention, ${counts.unsettled_top_level} unsettled of ${counts.top_level} top-level threads`,
            at: new Date(this.now()).toISOString(),
            run_id: null,
            observation,
            state: null,
            update: {
              sequence,
              ...(gap
                ? { previous_sequence: previousCursor, note: "Changes since the previous observation were reported from current state. Intermediate updates in the gap were not replayed." }
                : {}),
              counts,
              threads: listed.slice(0, SNAPSHOT_LIST_LIMIT).map((r) => ({
                id: r.id,
                title: r.title,
                link: threadLink(this.environment.id, r.id),
                status: r.status,
                activity: r.activity,
                run_id: r.latestRunId,
                pending_request: r.pendingRequest,
                plan_ready: r.planReady,
                last_error: r.lastError,
                settled_at: r.settledAt,
                relationship: r.relationship,
                parent_thread_id: r.parentThreadId,
                updated_at: r.updatedAt,
              })),
              truncated: listed.length > SNAPSHOT_LIST_LIMIT,
            },
          },
        },
        this.now(),
      );
    }
  }

  // Thread detail streams

  detailEligible(row) {
    const route = this.routeFor(row.projectId);
    if (!route || !route.detail || this.config.ignoreThreadIds.has(row.id)) return false;
    return row.relationship !== "subagent" || route.subagents === "all";
  }

  /** Live threads, plus threads whose stream was cut by a disconnect and has not caught up. */
  wantsDetail(row) {
    return this.detailEligible(row) && (isLive(row) || this.catchUp.has(row.id));
  }

  reconcileDetail() {
    if (!this.connection || !this.shellSynchronized) return;
    const now = this.now();
    for (const [id, entry] of this.detail) {
      const row = this.threads.get(id);
      if (row && this.wantsDetail(row)) {
        entry.idleSince = null;
        continue;
      }
      entry.idleSince ??= now;
      if (entry.synchronized && now - entry.idleSince >= this.config.detail.idleGraceMs) {
        entry.handle.cancel();
        this.detail.delete(id);
        this.store.deleteCursor(`thread:${id}`);
      }
    }
    for (const id of this.catchUp) {
      const row = this.threads.get(id);
      if (!row || !this.detailEligible(row)) {
        this.catchUp.delete(id);
        this.store.deleteCursor(`thread:${id}`);
      }
    }
    const candidates = [...this.threads.values()].filter(
      (row) => !this.detail.has(row.id) && (this.detailRetryAt.get(row.id) ?? 0) <= now && this.wantsDetail(row),
    );
    for (const row of candidates) {
      if (this.detail.size >= this.config.detail.maxThreads) {
        this.log.warn("detail subscription limit reached; remaining live threads report shell state only", { limit: this.config.detail.maxThreads, waiting: candidates.length });
        break;
      }
      this.subscribeThread(row.id);
    }
  }

  subscribeThread(threadId) {
    const after = this.store.getCursor(`thread:${threadId}`);
    const since = (after !== null ? this.store.getCursorTime(`thread:${threadId}`) : null) ?? this.store.getMeta("baseline_at");
    const entry = { synchronized: false, idleSince: null, after, since };
    entry.handle = this.connection.stream(
      "orchestration.subscribeThread",
      { threadId, ...(after !== null ? { afterSequence: after } : {}), requestCompletionMarker: true, acceptBoundedSnapshot: true },
      {
        onItems: (items) => this.onThreadItems(threadId, entry, items),
        onExit: (exit) => {
          if (this.detail.get(threadId) === entry) this.detail.delete(threadId);
          this.detailRetryAt.set(threadId, this.now() + DETAIL_RETRY_MS);
          this.log.warn("thread stream ended", { thread: threadId, exit: describeExit(exit) });
        },
      },
    );
    this.detail.set(threadId, entry);
  }

  onThreadItems(threadId, entry, items) {
    this.store.transaction(() => {
      const row = this.threads.get(threadId);
      const route = row ? this.routeFor(row.projectId) : null;
      const options = { userMessageText: route?.userMessageText === true };
      let cursor = null;
      for (const item of items) {
        let updates = [];
        if (item.kind === "synchronized") {
          entry.synchronized = true;
          this.catchUp.delete(threadId);
        } else if (item.kind === "snapshot") {
          const observation = entry.after !== null ? "resnapshot" : "subscribe";
          updates = classifySnapshot(item.projection, entry.since, options).map((u) => ({ ...u, observation }));
          if (entry.after !== null) {
            updates.unshift({
              fragment: true,
              id: `detail-gap:${entry.after}-${item.snapshotSequence}`,
              at: new Date(this.now()).toISOString(),
              runId: row?.latestRunId ?? null,
              observation,
              fragmentBody: {
                type: "detail_gap",
                note: "The thread stream could not be replayed from the last cursor. Only the latest run's items in the server's snapshot window were checked; earlier activity in the gap was not captured.",
                from_sequence: entry.after,
                to_sequence: item.snapshotSequence,
              },
            });
          }
          cursor = item.snapshotSequence;
        } else if (item.kind === "event") {
          updates = classifyEvent(item.event, options).map((u) => ({ ...u, observation: entry.synchronized ? "live" : "resume", at: u.at ?? item.event.occurredAt }));
          cursor = item.sequence;
        } else if (item.kind === "unknown-event") {
          cursor = item.sequence;
        }
        if (row && route) {
          for (const update of filterForSubagent(updates, row, route.subagents)) this.capture(update, row, route);
        }
      }
      if (cursor !== null) this.store.setCursor(`thread:${threadId}`, cursor);
      this.flushDue();
    });
    this.deliveryAlarm.wake();
  }

  // Flushing and delivery

  flushDue({ force = false } = {}) {
    if (!this.environment) return 0;
    let enqueued = 0;
    for (const threadId of this.store.pendingThreads()) {
      enqueued += flushThread(this.store, this.environment.id, threadId, { now: this.now(), ...this.config.progress, force });
    }
    return enqueued;
  }

  tick() {
    try {
      const enqueued = this.store.transaction(() => this.flushDue());
      if (enqueued > 0) this.deliveryAlarm.wake();
      this.reconcileDetail();
      const day = Math.floor(this.now() / 86_400_000);
      if (day !== this.prunedDay) {
        this.prunedDay = day;
        this.store.prune(this.config.retentionDays, this.now());
      }
    } catch (error) {
      this.log.error("tick failed", { error: error.message });
    }
  }

  async deliveryLoop() {
    while (!this.stopped) {
      let delay = 30_000;
      try {
        delay = await this.deliverer.drain();
      } catch (error) {
        this.log.error("delivery loop failed", { error: error.message });
      }
      if (!this.stopped) await this.deliveryAlarm.wait(Math.max(250, Math.min(delay, 30_000)));
    }
  }

  writeStatus() {
    try {
      const path = join(this.config.stateDir, "status.json");
      const body = {
        at: new Date(this.now()).toISOString(),
        pid: process.pid,
        environment: this.environment ?? null,
        ...this.status,
        shellSynchronized: this.shellSynchronized ?? false,
        detailSubscriptions: this.detail.size,
        delivery: Object.fromEntries(this.deliverer.blockedReason),
        store: this.store.stats(),
      };
      writeFileSync(`${path}.tmp`, `${JSON.stringify(body, null, 2)}\n`, { mode: 0o600 });
      renameSync(`${path}.tmp`, path);
    } catch (error) {
      this.log.warn("could not write status", { error: error.message });
    }
  }
}
