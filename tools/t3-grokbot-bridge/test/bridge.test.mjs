import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Bridge } from "../src/bridge.mjs";
import { normalizeConfig } from "../src/config.mjs";
import { writeEnvFile } from "../src/envfile.mjs";
import { createLogger } from "../src/log.mjs";
import { Store } from "../src/store.mjs";
import { FakeT3 } from "./fake-t3.mjs";
import { ENV_ID, PROJECT, completed, itemEvent, running, shellSnapshot, shellThread, testConfig, threadSnapshot, turnItem } from "./fixtures.mjs";

const SHELL = "orchestration.subscribeShell";
const THREAD = "orchestration.subscribeThread";

async function start(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), "bridge-e2e-"));
  const tokenFile = join(dir, "t3-token");
  writeFileSync(tokenFile, "test-token\n", { mode: 0o600 });
  const envFile = join(dir, "report.env");
  writeEnvFile(envFile, new Map([["CRABSTOCK_DISPATCH_WEBHOOK", "https://hook.test/in"], ["CRABSTOCK_DISPATCH_AUTH", "Bearer grok-secret"]]));
  const config = normalizeConfig(
    testConfig({
      environment: { key: "studio", httpBaseUrl: "http://t3.test", tokenFile },
      stateDir: join(dir, "state"),
      targets: { grokbot: { envFile, urlVar: "CRABSTOCK_DISPATCH_WEBHOOK", authVar: "CRABSTOCK_DISPATCH_AUTH" } },
      detail: { idleGraceMs: 50, maxThreads: 5 },
      ...overrides,
    }),
  );
  const logs = [];
  const t3 = new FakeT3();
  const open = () => {
    const store = new Store(config.stateDir);
    const bridge = new Bridge({ config, store, log: createLogger({ level: "debug", write: (line) => logs.push(line) }), fetchImpl: t3.fetch, WebSocketImpl: t3.WebSocket, random: () => 0 });
    const running = bridge.run();
    return {
      store,
      bridge,
      async close() {
        bridge.stop();
        await running;
        store.close();
      },
    };
  };
  return { t3, config, logs, open, ...open() };
}

test("lifecycle: startup snapshot, run start, batched progress, completion and settlement reach the webhook in order", async () => {
  const env = await start();
  const { t3 } = env;
  try {
    const shell = await t3.waitFor(() => t3.request(SHELL), "shell subscription");
    assert.equal(shell.payload.afterSequence, undefined);
    assert.equal(shell.payload.requestCompletionMarker, true);
    assert.equal(t3.sockets[0].url.searchParams.get("orchestrationProtocol"), "2");
    t3.push(shell, shellSnapshot(100, [shellThread()]), { kind: "synchronized" });
    await t3.waitFor(() => t3.posts.length >= 2, "startup snapshots");
    assert.deepEqual(t3.kinds(), ["project.snapshot", "project.snapshot"], "one current-state report per project, no invented history");
    assert.deepEqual(t3.posts.map((p) => p.body.item).sort(), ["crabstock", "side-project"]);

    t3.push(shell, { kind: "thread.updated", sequence: 101, location: "active", thread: running() });
    const detail = await t3.waitFor(() => t3.request(THREAD), "thread subscription");
    assert.equal(detail.payload.threadId, "thread-1");
    assert.equal(detail.payload.afterSequence, undefined);
    t3.push(detail, threadSnapshot(101), { kind: "synchronized" });
    t3.push(
      detail,
      itemEvent(102, turnItem({ id: "c1", type: "command_execution", input: "make test", output: "token=abc", exitCode: 0 })),
      itemEvent(103, turnItem({ id: "a1", type: "assistant_message", messageId: "m1", text: "partial", streaming: true, status: "running" })),
      itemEvent(104, turnItem({ id: "a1", type: "assistant_message", messageId: "m1", text: "Tests pass; opening the PR.", streaming: false })),
    );
    t3.push(shell, { kind: "thread.updated", sequence: 105, location: "active", thread: completed() });
    await t3.waitFor(() => t3.kinds().includes("run.completed"), "completion");
    t3.push(shell, { kind: "thread.updated", sequence: 106, location: "active", thread: completed({ settledAt: "2026-10-29T10:06:00.000Z", settledOverride: "settled" }) });
    await t3.waitFor(() => t3.kinds().includes("thread.settled"), "settlement");

    assert.deepEqual(t3.kinds().slice(2), ["run.started", "thread.progress", "run.completed", "thread.settled"]);
    const [started, progress, done, settled] = t3.posts.slice(2).map((p) => p.body);
    assert.equal(progress.update.count, 2);
    assert.deepEqual(progress.update.fragments.map((f) => f.type), ["command", "assistant_message"]);
    assert.equal(progress.update.fragments[1].text, "Tests pass; opening the PR.");
    assert.ok(!JSON.stringify(progress).includes("token=abc"), "command output is never forwarded");
    assert.equal(done.update.latest_message.text, "Done. PR #94 is green.");
    for (const body of [started, progress, done, settled]) {
      assert.equal(body.schema, "t3-grokbot-bridge.report.v1");
      assert.equal(body.environment.id, ENV_ID);
      assert.equal(body.project.id, PROJECT.id);
      assert.equal(body.project.key, "crabstock");
      assert.equal(body.thread, "thread-1");
      assert.equal(body.thread_link, `t3-thread://v2/${ENV_ID}/thread-1`);
      assert.equal(body.run_id, "run-1");
      assert.ok(body.event_id.startsWith(`${ENV_ID}/thread-1/`));
    }
    const post = t3.posts.at(-1);
    assert.equal(post.headers.authorization, "Bearer grok-secret");
    assert.equal(post.headers["idempotency-key"], post.body.event_id);
    assert.equal(post.headers["content-type"], "application/json");
    assert.ok(!env.logs.join("\n").includes("grok-secret") && !env.logs.join("\n").includes("hook.test"), "logs hold no credentials");

    await t3.waitFor(() => t3.interrupts.includes(detail.id), "idle detail stream released");
    assert.equal(env.store.getCursor("thread:thread-1"), null, "a deliberately closed stream keeps no stale cursor");
  } finally {
    await env.close();
  }
});

test("reconnect resumes both streams from stored cursors and replayed items do not report twice", async () => {
  const env = await start();
  const { t3 } = env;
  try {
    const shell = await t3.waitFor(() => t3.request(SHELL), "shell");
    t3.push(shell, shellSnapshot(100, [shellThread()]), { kind: "synchronized" });
    t3.push(shell, { kind: "thread.updated", sequence: 101, location: "active", thread: running() });
    const detail = await t3.waitFor(() => t3.request(THREAD), "detail");
    t3.push(detail, threadSnapshot(101), { kind: "synchronized" }, itemEvent(102, turnItem({ id: "c1", type: "command_execution", input: "make", exitCode: 0 })));
    await t3.waitFor(() => env.store.getCursor("thread:thread-1") === 102, "thread cursor");
    const before = t3.posts.length;

    t3.drop();
    const shell2 = await t3.waitFor(() => t3.requests.filter((r) => r.tag === SHELL).length === 2 && t3.request(SHELL), "shell resubscribe");
    assert.equal(shell2.payload.afterSequence, 101);
    t3.push(shell2, { kind: "thread.updated", sequence: 101, location: "active", thread: running() }, { kind: "synchronized" });
    const detail2 = await t3.waitFor(() => t3.requests.filter((r) => r.tag === THREAD).length === 2 && t3.request(THREAD), "thread resubscribe");
    assert.equal(detail2.payload.afterSequence, 102);

    t3.push(detail2, itemEvent(102, turnItem({ id: "c1", type: "command_execution", input: "make", exitCode: 0 })), { kind: "synchronized" });
    t3.push(shell2, { kind: "thread.updated", sequence: 107, location: "active", thread: completed() });
    await t3.waitFor(() => t3.kinds().includes("run.completed"), "completion after reconnect");
    const after = t3.posts.slice(before);
    assert.deepEqual(after.map((p) => p.body.kind), ["thread.progress", "run.completed"]);
    assert.equal(after[0].body.update.count, 1, "the replayed command item was captured once");
    assert.equal(t3.posts.filter((p) => p.body.kind === "run.started").length, 1);
  } finally {
    await env.close();
  }
});

test("a crash before the capture commits leaves the cursor and acknowledgement behind, so nothing is lost", async () => {
  const env = await start();
  const { t3 } = env;
  try {
    const shell = await t3.waitFor(() => t3.request(SHELL), "shell");
    t3.push(shell, shellSnapshot(100, [shellThread()]), { kind: "synchronized" });
    await t3.waitFor(() => env.store.getCursor("shell") === 100, "baseline");
    const acksBefore = t3.acks.length;
    const original = env.store.capture.bind(env.store);
    env.store.capture = () => {
      env.store.capture = original;
      throw new Error("disk full");
    };
    t3.push(shell, { kind: "thread.updated", sequence: 101, location: "active", thread: running() });
    const shell2 = await t3.waitFor(() => t3.requests.filter((r) => r.tag === SHELL).length === 2 && t3.request(SHELL), "reconnect");
    assert.equal(t3.acks.length, acksBefore, "the failed chunk was not acknowledged");
    assert.equal(shell2.payload.afterSequence, 100, "the cursor did not move past the uncaptured update");
    t3.push(shell2, { kind: "thread.updated", sequence: 101, location: "active", thread: running() }, { kind: "synchronized" });
    await t3.waitFor(() => t3.kinds().includes("run.started"), "start reported after recovery");
  } finally {
    await env.close();
  }
});

test("a full snapshot after a gap reports what changed, flagged as observed after the gap", async () => {
  const env = await start();
  const { t3 } = env;
  try {
    const shell = await t3.waitFor(() => t3.request(SHELL), "shell");
    t3.push(shell, shellSnapshot(100, [running()]), { kind: "synchronized" });
    await t3.waitFor(() => t3.posts.length >= 2, "startup");
    t3.drop();
    const shell2 = await t3.waitFor(() => t3.requests.filter((r) => r.tag === SHELL).length === 2 && t3.request(SHELL), "reconnect");
    const recent = new Date(Date.now() - 60_000).toISOString();
    const failed = running({ status: "failed", activityRunStatus: null, lastError: "out of memory", lastErrorClass: "provider_error", updatedAt: recent });
    const fresh = shellThread({ id: "thread-2", title: "New work", createdAt: recent, updatedAt: recent });
    t3.push(shell2, shellSnapshot(5_000, [failed, fresh]), { kind: "synchronized" });
    await t3.waitFor(() => t3.kinds().includes("project.resynced"), "resync report");
    const resynced = t3.posts.filter((p) => ["run.failed", "thread.created"].includes(p.body.kind));
    assert.deepEqual(resynced.map((p) => p.body.kind).sort(), ["run.failed", "thread.created"]);
    assert.ok(resynced.every((p) => p.body.observation === "resnapshot"));
    const note = t3.posts.find((p) => p.body.kind === "project.resynced" && p.body.item === "crabstock").body;
    assert.equal(note.update.previous_sequence, 100);
    assert.match(note.update.note, /not replayed/);
  } finally {
    await env.close();
  }
});

test("reports queue durably while the receiver fails and deliver after a restart", async () => {
  const env = await start();
  const { t3 } = env;
  t3.webhookStatus = () => 503;
  const shell = await t3.waitFor(() => t3.request(SHELL), "shell");
  t3.push(shell, shellSnapshot(100, [shellThread()]), { kind: "synchronized" });
  await t3.waitFor(() => t3.posts.length >= 1, "first failing attempt");
  await env.close();
  const queued = new Store(env.config.stateDir);
  assert.equal(queued.stats().outbox.pending, 2);
  queued.close();

  t3.webhookStatus = () => 200;
  const second = env.open();
  try {
    const store = second.store;
    store.sql("update outbox set next_attempt_at = 0").run();
    await t3.waitFor(() => store.stats().outbox.delivered === 2, "delivery after restart");
    const ids = t3.posts.map((p) => p.body.event_id);
    assert.ok(ids.length >= 3, "the failed report was attempted again");
    assert.equal(new Set(ids).size, 2, "retries reuse the same event id");
  } finally {
    await second.close();
  }
});
