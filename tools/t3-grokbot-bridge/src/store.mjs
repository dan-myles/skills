import { mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

// One SQLite file per environment. Captured updates, the delivery queue and the
// stream cursors change in the same transaction, so a crash can repeat work
// (at-least-once) but cannot advance a cursor past an update it never stored.

const SCHEMA = `
create table if not exists meta(key text primary key, value text not null);
create table if not exists cursors(stream text primary key, sequence integer not null, updated_at text not null);
create table if not exists projects(project_id text primary key, row text not null);
create table if not exists threads(thread_id text primary key, project_id text not null, row text not null);
create table if not exists captured(
  seq integer primary key autoincrement,
  update_id text not null unique,
  thread_id text not null,
  project_id text,
  route_key text not null,
  target text not null,
  kind text not null,
  standalone integer not null,
  due_at integer not null,
  captured_at integer not null,
  body text not null,
  report_id text
);
create index if not exists captured_pending on captured(thread_id, seq) where report_id is null;
create table if not exists outbox(
  report_id text primary key,
  target text not null,
  route_key text not null,
  body text not null,
  created_at integer not null,
  attempts integer not null default 0,
  next_attempt_at integer not null,
  state text not null default 'pending',
  last_result text,
  delivered_at integer
);
create index if not exists outbox_due on outbox(state, target, created_at);
`;

export class Store {
  constructor(stateDir) {
    mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    chmodSync(stateDir, 0o700);
    this.path = join(stateDir, "bridge.sqlite");
    this.db = new DatabaseSync(this.path);
    this.db.exec("pragma journal_mode = wal; pragma synchronous = full; pragma busy_timeout = 5000;");
    this.db.exec(SCHEMA);
    chmodSync(this.path, 0o600);
    this.statements = new Map();
  }

  close() {
    this.db.close();
  }

  sql(text) {
    let statement = this.statements.get(text);
    if (!statement) {
      statement = this.db.prepare(text);
      this.statements.set(text, statement);
    }
    return statement;
  }

  transaction(fn) {
    this.db.exec("begin immediate");
    try {
      const result = fn();
      this.db.exec("commit");
      return result;
    } catch (error) {
      this.db.exec("rollback");
      throw error;
    }
  }

  getMeta(key) {
    return this.sql("select value from meta where key = ?").get(key)?.value ?? null;
  }

  setMeta(key, value) {
    this.sql("insert into meta(key, value) values(?, ?) on conflict(key) do update set value = excluded.value").run(key, value);
  }

  getCursorTime(stream) {
    return this.sql("select updated_at from cursors where stream = ?").get(stream)?.updated_at ?? null;
  }

  getCursor(stream) {
    return this.sql("select sequence from cursors where stream = ?").get(stream)?.sequence ?? null;
  }

  setCursor(stream, sequence) {
    this.sql(
      "insert into cursors(stream, sequence, updated_at) values(?, ?, ?) on conflict(stream) do update set sequence = excluded.sequence, updated_at = excluded.updated_at",
    ).run(stream, sequence, new Date().toISOString());
  }

  deleteCursor(stream) {
    this.sql("delete from cursors where stream = ?").run(stream);
  }

  hasBaseline() {
    return this.getMeta("baseline_sequence") !== null;
  }

  getProjects() {
    return new Map(this.sql("select project_id, row from projects").all().map((r) => [r.project_id, JSON.parse(r.row)]));
  }

  putProject(project) {
    this.sql("insert into projects(project_id, row) values(?, ?) on conflict(project_id) do update set row = excluded.row").run(
      project.id,
      JSON.stringify(project),
    );
  }

  deleteProject(projectId) {
    this.sql("delete from projects where project_id = ?").run(projectId);
  }

  getThreads() {
    return new Map(this.sql("select thread_id, row from threads").all().map((r) => [r.thread_id, JSON.parse(r.row)]));
  }

  putThread(row) {
    this.sql(
      "insert into threads(thread_id, project_id, row) values(?, ?, ?) on conflict(thread_id) do update set project_id = excluded.project_id, row = excluded.row",
    ).run(row.id, row.projectId, JSON.stringify(row));
  }

  deleteThread(threadId) {
    this.sql("delete from threads where thread_id = ?").run(threadId);
  }

  /**
   * Stores an update unless its id was already captured. A `revise` update replaces the body of a
   * still-pending capture; once reported, a changed body is captured again under a revision id.
   */
  capture(update, now) {
    const existing = this.sql("select seq, body, report_id from captured where update_id = ?").get(update.id);
    const body = JSON.stringify(update.body);
    if (existing) {
      if (!update.revise || existing.body === body) return false;
      if (existing.report_id === null) {
        this.sql("update captured set body = ? where seq = ?").run(body, existing.seq);
        return true;
      }
      return this.capture({ ...update, id: `${update.id}@${update.body.at ?? now}`, revise: false }, now);
    }
    this.sql(
      "insert into captured(update_id, thread_id, project_id, route_key, target, kind, standalone, due_at, captured_at, body) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      update.id,
      update.threadId,
      update.projectId ?? null,
      update.routeKey,
      update.target,
      update.kind,
      update.standalone ? 1 : 0,
      now + (update.holdMs ?? 0),
      now,
      body,
    );
    return true;
  }

  /** Merges detail into a pending standalone capture and releases its hold. */
  enrichPending(updateId, patch, now) {
    const row = this.sql("select seq, body from captured where update_id = ? and report_id is null").get(updateId);
    if (!row) return false;
    const body = JSON.parse(row.body);
    body.update = { ...body.update, ...patch };
    this.sql("update captured set body = ?, due_at = min(due_at, ?) where seq = ?").run(JSON.stringify(body), now, row.seq);
    return true;
  }

  hasCapture(updateId) {
    return this.sql("select 1 from captured where update_id = ?").get(updateId) !== undefined;
  }

  pendingThreads() {
    return this.sql("select distinct thread_id from captured where report_id is null").all().map((r) => r.thread_id);
  }

  pendingFor(threadId) {
    return this.sql("select * from captured where thread_id = ? and report_id is null order by seq").all(threadId).map((r) => ({
      ...r,
      body: JSON.parse(r.body),
    }));
  }

  markReported(seqs, reportId) {
    const statement = this.sql("update captured set report_id = ? where seq = ?");
    for (const seq of seqs) statement.run(reportId, seq);
  }

  enqueue(report, now) {
    const result = this.sql(
      "insert into outbox(report_id, target, route_key, body, created_at, next_attempt_at) values(?, ?, ?, ?, ?, ?) on conflict(report_id) do nothing",
    ).run(report.id, report.target, report.routeKey, JSON.stringify(report.body), now, now);
    return result.changes > 0;
  }

  nextOutbox(target) {
    const row = this.sql("select * from outbox where state = 'pending' and target = ? order by created_at, rowid limit 1").get(target);
    return row ? { ...row, body: JSON.parse(row.body) } : null;
  }

  pendingTargets() {
    return this.sql("select distinct target from outbox where state = 'pending'").all().map((r) => r.target);
  }

  recordAttempt(reportId, { state, nextAttemptAt, result, now }) {
    this.sql(
      "update outbox set attempts = attempts + 1, state = ?, next_attempt_at = ?, last_result = ?, delivered_at = case when ? = 'delivered' then ? else delivered_at end where report_id = ?",
    ).run(state, nextAttemptAt, result, state, now, reportId);
  }

  requeueDead() {
    return this.sql("update outbox set state = 'pending', next_attempt_at = ? where state = 'dead'").run(Date.now()).changes;
  }

  stats() {
    const outbox = Object.fromEntries(this.sql("select state, count(*) as n from outbox group by state").all().map((r) => [r.state, r.n]));
    const oldest = this.sql("select min(created_at) as t from outbox where state = 'pending'").get()?.t ?? null;
    const lastResult = this.sql("select last_result from outbox where last_result is not null order by rowid desc limit 1").get()?.last_result ?? null;
    return {
      outbox,
      oldestPendingAt: oldest === null ? null : new Date(oldest).toISOString(),
      lastResult,
      pendingCaptures: this.sql("select count(*) as n from captured where report_id is null").get().n,
      captured: this.sql("select count(*) as n from captured").get().n,
      threads: this.sql("select count(*) as n from threads").get().n,
      shellCursor: this.getCursor("shell"),
      threadCursors: this.sql("select count(*) as n from cursors where stream like 'thread:%'").get().n,
    };
  }

  prune(retentionDays, now) {
    const cutoff = now - retentionDays * 86_400_000;
    this.transaction(() => {
      this.sql("delete from outbox where state = 'delivered' and delivered_at < ?").run(cutoff);
      this.sql("delete from captured where report_id is not null and captured_at < ? and report_id not in (select report_id from outbox)").run(cutoff);
    });
  }
}
