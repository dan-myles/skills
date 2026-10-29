import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { normalizeConfig, resolveRoute } from "../src/config.mjs";
import { parseEnvFile, readEnvFile, writeEnvFile } from "../src/envfile.mjs";
import { redact } from "../src/redact.mjs";
import { diffThread, filterForSubagent, normalizeThread } from "../src/shell.mjs";
import { classifyEvent, classifyItem, classifySnapshot } from "../src/thread.mjs";
import { OTHER_PROJECT, PROJECT, completed, running, shellThread, testConfig, turnItem } from "./fixtures.mjs";

const kinds = (updates) => updates.map((u) => u.kind ?? (u.fragment ? `fragment:${u.fragmentBody.type}` : `enrich:${u.enrich}`));

test("redact removes credentials an agent might echo and keeps prose", () => {
  const text = [
    "curl -H 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456' https://user:hunter2@example.com/hook?token=s3cr3tvalue&x=1",
    "export CRABSTOCK_DISPATCH_AUTH=supersecretvalue",
    "key sk-ant-abcdefghijklmnopqrstuvwx and ghp_abcdefghijklmnopqrstuvwxyz0123",
    "The ledger now rounds half-even.",
  ].join("\n");
  const out = redact(text);
  for (const secret of ["abcdefghijklmnopqrstuvwxyz123456", "hunter2", "s3cr3tvalue", "supersecretvalue", "sk-ant-abcdef", "ghp_abcdef"]) {
    assert.ok(!out.includes(secret), `leaked ${secret}`);
  }
  assert.ok(out.includes("The ledger now rounds half-even."));
});

test("env files round-trip through bash exactly as the legacy report script sources them", () => {
  const dir = mkdtempSync(join(tmpdir(), "bridge-env-"));
  const path = join(dir, "report.env");
  const tricky = `Bearer a'b"c $HOME \`x\` \\ end`;
  writeEnvFile(path, new Map([["CRABSTOCK_DISPATCH_WEBHOOK", "https://example.test/hook?a=1&b=2"], ["CRABSTOCK_DISPATCH_AUTH", tricky]]));
  assert.equal(statSync(path).mode & 0o777, 0o600);
  assert.equal(readEnvFile(path).get("CRABSTOCK_DISPATCH_AUTH"), tricky);
  const fromBash = execFileSync("bash", ["-c", 'set -a; . "$1"; printf %s "$CRABSTOCK_DISPATCH_AUTH"', "bash", path], { encoding: "utf8" });
  assert.equal(fromBash, tricky);
  assert.throws(() => parseEnvFile("X=$(whoami)\n"));
  assert.throws(() => parseEnvFile('X="$HOME"\n'));
  assert.throws(() => writeEnvFile(join(dir, "bad.env"), new Map([["X", "a\nb"]])));
});

test("routes match by project id, then workspace root, and unmatched projects get a slug or are ignored", () => {
  const config = normalizeConfig(testConfig({ projects: [{ key: "crabstock", projectId: PROJECT.id }, { key: "side", workspaceRoot: "/repos/side/" }] }));
  assert.equal(resolveRoute(config, PROJECT).key, "crabstock");
  assert.equal(resolveRoute(config, OTHER_PROJECT).key, "side");
  assert.equal(resolveRoute(config, { id: "x", title: "Mac Studio" }).key, "mac-studio");
  const strict = normalizeConfig(testConfig({ unmatchedProjects: "ignore" }));
  assert.equal(resolveRoute(strict, { id: "x", title: "Mac Studio" }), null);
});

test("a run observed from start to finish reports start then completion with the final message", () => {
  const idle = normalizeThread(shellThread());
  const live = normalizeThread(running());
  const done = normalizeThread(completed());
  assert.deepEqual(kinds(diffThread(idle, live)), ["run.started"]);
  const finish = diffThread(live, done, { detailed: true });
  assert.deepEqual(kinds(finish), ["run.completed"]);
  assert.equal(finish[0].update.latest_message.text, "Done. PR #94 is green.");
  assert.equal(finish[0].id, "run:run-1:completed");
  assert.deepEqual(diffThread(done, done), []);
});

test("a run that started and finished between observations still reports both", () => {
  const before = normalizeThread(shellThread());
  assert.deepEqual(kinds(diffThread(before, normalizeThread(completed()), { detailed: true })), ["run.started", "run.completed"]);
});

test("failures, errors, limits, input requests, plans, pull requests and settlement each report once", () => {
  const live = normalizeThread(running());
  const failed = normalizeThread(running({ status: "failed", activityRunStatus: null, lastError: "provider exploded", lastErrorClass: "provider_error" }));
  const failure = diffThread(live, failed);
  assert.deepEqual(kinds(failure), ["run.failed"]);
  assert.equal(failure[0].update.error.class, "provider_error");

  const asking = normalizeThread(running({ status: "waiting", activityRunStatus: "waiting", pendingRuntimeRequest: { id: "req-1", kind: "permission", createdAt: "2026-10-29T10:03:00.000Z", blocking: true } }));
  const ask = diffThread(live, asking, { detailed: true });
  assert.deepEqual(kinds(ask), ["run.waiting", "thread.needs_input"]);
  assert.equal(ask[1].hold, true, "detailed threads hold the shell request so the detail stream can add the question");
  assert.deepEqual(kinds(diffThread(asking, live)), ["thread.input_resolved"]);

  const limited = normalizeThread(running({ usageLimitResetAt: "2026-10-29T15:00:00.000Z", lastError: "limit", lastErrorClass: "usage_limit" }));
  assert.deepEqual(kinds(diffThread(live, limited)), ["thread.error", "thread.blocked"]);

  const planned = normalizeThread(running({ hasActionableProposedPlan: true, pullRequests: [{ url: "https://github.com/x/y/pull/9", number: 9 }] }));
  assert.deepEqual(kinds(diffThread(live, planned)), ["thread.plan_ready", "thread.pull_request"]);

  const done = normalizeThread(completed());
  const settled = normalizeThread(completed({ settledAt: "2026-10-29T10:06:00.000Z", settledOverride: "settled" }));
  assert.deepEqual(kinds(diffThread(done, settled)), ["thread.settled"]);
});

test("worktree and branch changes are not reported", () => {
  const a = normalizeThread(running());
  const b = normalizeThread(running({ branch: "cooper/fix", worktreePath: "/tmp/wt", updatedAt: "2026-10-29T10:01:30.000Z" }));
  assert.deepEqual(diffThread(a, b, { detailed: true }), []);
});

test("shell messages become progress fragments only for threads without a detail stream", () => {
  const a = normalizeThread(running());
  const b = normalizeThread(running({ latestVisibleMessage: { id: "m1", role: "assistant", text: "Reading the ledger module", updatedAt: "2026-10-29T10:02:00.000Z" } }));
  assert.deepEqual(kinds(diffThread(a, b)), ["fragment:assistant_message"]);
  assert.deepEqual(diffThread(a, b, { detailed: true }), []);
});

test("subagent rows report only what needs attention by default", () => {
  const child = (o) => normalizeThread(running({ lineage: { parentThreadId: "p", relationshipToParent: "subagent", rootThreadId: "p" }, ...o }));
  const updates = diffThread(child({ status: "idle", latestRunId: null }), child({ status: "failed", lastError: "boom" }));
  assert.deepEqual(kinds(filterForSubagent(updates, child({}), "attention")), ["run.failed"]);
  assert.deepEqual(filterForSubagent(updates, child({}), "off"), []);
  assert.equal(filterForSubagent(updates, child({}), "all").length, updates.length);
});

test("detail items settle once; streaming copies, reasoning and tool output never leave", () => {
  assert.deepEqual(classifyItem(turnItem({ type: "assistant_message", messageId: "m1", text: "partial", streaming: true, status: "running" })), []);
  const [message] = classifyItem(turnItem({ type: "assistant_message", messageId: "m1", text: "Final answer", streaming: false }));
  assert.equal(message.id, "message:m1");
  assert.equal(message.fragmentBody.text, "Final answer");
  assert.deepEqual(classifyItem(turnItem({ type: "reasoning", text: "private chain", streaming: false })), []);

  const [command] = classifyItem(turnItem({ type: "command_execution", input: "export API_TOKEN=abc123456789 && make test", output: "SECRET OUTPUT", exitCode: 2 }));
  const serialized = JSON.stringify(command);
  assert.ok(!serialized.includes("SECRET OUTPUT"));
  assert.ok(!serialized.includes("abc123456789"));
  assert.equal(command.fragmentBody.failed, true);
});

test("input requests carry the question but never answers or secret-card details", () => {
  const ask = classifyItem(
    turnItem({
      type: "user_input_request",
      status: "pending",
      requestId: "req-9",
      questions: [{ id: "q", header: "Deploy", question: "Ship to prod?", options: [{ label: "Yes", description: "d" }] }],
      questionAnswer: { answers: { q: "my private answer" } },
    }),
  );
  assert.deepEqual(kinds(ask), ["enrich:request:req-9", "thread.needs_input"]);
  assert.equal(ask[1].update.questions[0].question, "Ship to prod?");
  assert.ok(!JSON.stringify(ask).includes("my private answer"));

  const secret = classifyItem(turnItem({ type: "secret_request", secretStatus: "pending", label: "Webhook URL", reason: "private reason", placeholder: "https://hooks/…" }));
  assert.equal(secret[1].kind, "thread.needs_input");
  assert.ok(!JSON.stringify(secret).includes("private reason"));
  assert.ok(!JSON.stringify(secret).includes("hooks"));
});

test("runtime requests without a turn item still report needs-input", () => {
  const event = { type: "runtime-request.updated", runId: "run-1", payload: { id: "r2", kind: "mcp-elicitation", status: "pending", createdAt: "2026-10-29T10:03:00.000Z" } };
  assert.deepEqual(kinds(classifyEvent(event)), ["enrich:request:r2", "thread.needs_input"]);
  assert.deepEqual(classifyEvent({ ...event, payload: { ...event.payload, kind: "permission" } }), []);
});

test("a detail snapshot reports only the latest run's items newer than the bridge's last look", () => {
  const items = [
    turnItem({ id: "old", runId: "run-0", type: "command_execution", input: "ls", exitCode: 0 }),
    turnItem({ id: "before", runId: "run-1", type: "command_execution", input: "make", exitCode: 0, updatedAt: "2026-10-29T10:01:30.000Z" }),
    turnItem({ id: "after", runId: "run-1", type: "command_execution", input: "make", exitCode: 0, updatedAt: "2026-10-29T10:02:30.000Z" }),
  ];
  const out = classifySnapshot({ runs: [{ id: "run-0", ordinal: 1 }, { id: "run-1", ordinal: 2 }], turnItems: items }, "2026-10-29T10:02:00.000Z");
  assert.deepEqual(out.map((u) => u.id), ["item:after"]);
});
