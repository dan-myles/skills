import assert from "node:assert/strict";
import { chmodSync, mkdtempSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { normalizeConfig } from "../src/config.mjs";
import { Deliverer, backoffMs, classifyStatus, loadTarget, postReport } from "../src/delivery.mjs";
import { writeEnvFile } from "../src/envfile.mjs";
import { createLogger } from "../src/log.mjs";
import { Store } from "../src/store.mjs";
import { testConfig } from "./fixtures.mjs";

async function receiver(handler) {
  const seen = [];
  const server = createServer((req, res) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      seen.push({ headers: req.headers, body: JSON.parse(data || "null"), url: req.url });
      handler(req, res, seen.length);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { seen, url: `http://127.0.0.1:${server.address().port}/hook`, close: () => new Promise((resolve) => server.close(resolve)) };
}

function setup(url) {
  const dir = mkdtempSync(join(tmpdir(), "bridge-delivery-"));
  const envFile = join(dir, "report.env");
  writeEnvFile(envFile, new Map([["CRABSTOCK_DISPATCH_WEBHOOK", url], ["CRABSTOCK_DISPATCH_AUTH", "Token abc def"]]));
  const config = normalizeConfig(testConfig({ stateDir: join(dir, "state"), targets: { grokbot: { envFile, urlVar: "CRABSTOCK_DISPATCH_WEBHOOK", authVar: "CRABSTOCK_DISPATCH_AUTH" } } }));
  const logs = [];
  const store = new Store(config.stateDir);
  let clock = 1_000_000;
  const deliverer = new Deliverer({ store, config, log: createLogger({ level: "debug", write: (l) => logs.push(l) }), now: () => clock });
  const enqueue = (id) => store.enqueue({ id, target: "grokbot", routeKey: "crabstock", body: { event_id: id, kind: "run.started" } }, clock);
  return { dir, envFile, config, store, deliverer, enqueue, logs, advance: (ms) => (clock += ms), now: () => clock };
}

test("status classes: success delivers, overload retries, credential and path errors wait, bad payloads dead-letter", () => {
  assert.equal(classifyStatus(204), "delivered");
  for (const s of [408, 425, 429, 500, 503]) assert.equal(classifyStatus(s), "retry");
  for (const s of [401, 403, 404, 410]) assert.equal(classifyStatus(s), "config");
  for (const s of [400, 413, 422]) assert.equal(classifyStatus(s), "dead");
  assert.ok(backoffMs(0, () => 1) <= 2_000 && backoffMs(30, () => 1) === 15 * 60_000);
});

test("posts the authorization value verbatim with an idempotency key, retries, then dead-letters a rejected payload", async () => {
  const hook = await receiver((req, res, n) => {
    if (n === 1) res.writeHead(503, { "retry-after": "7" }).end();
    else if (n === 2) res.writeHead(200).end("ok");
    else res.writeHead(422).end("bad");
  });
  const env = setup(hook.url);
  try {
    env.enqueue("e1");
    env.enqueue("e2");
    const wait = await env.deliverer.drain();
    assert.equal(wait, 7_000, "Retry-After is honored");
    assert.equal(hook.seen.length, 1);
    assert.equal(hook.seen[0].headers.authorization, "Token abc def");
    assert.equal(hook.seen[0].headers["idempotency-key"], "e1");
    assert.equal(hook.seen[0].headers["content-type"], "application/json");

    await env.deliverer.drain();
    assert.equal(hook.seen.length, 1, "nothing is sent before the retry time");
    env.advance(7_000);
    await env.deliverer.drain();
    assert.deepEqual(hook.seen.map((s) => s.body.event_id), ["e1", "e1", "e2"], "order is kept and the retry reuses the event id");
    const stats = env.store.stats();
    assert.equal(stats.outbox.delivered, 1);
    assert.equal(stats.outbox.dead, 1);
    assert.equal(env.store.requeueDead(), 1);
    assert.ok(!env.logs.join("\n").includes("127.0.0.1") && !env.logs.join("\n").includes("abc def"));
  } finally {
    env.store.close();
    await hook.close();
  }
});

test("redirects are not followed and network errors do not echo the URL", async () => {
  const hook = await receiver((req, res) => res.writeHead(302, { location: "http://127.0.0.1:1/elsewhere" }).end());
  try {
    const redirected = await postReport({ url: hook.url, auth: "x" }, { event_id: "e" }, { timeoutMs: 2_000 });
    assert.equal(redirected.status, null);
    const refused = await postReport({ url: "http://127.0.0.1:1/secret-path?token=abc", auth: "x" }, { event_id: "e" }, { timeoutMs: 2_000 });
    assert.equal(refused.status, null);
    assert.ok(!refused.error.includes("secret-path") && !refused.error.includes("abc"));
  } finally {
    await hook.close();
  }
});

test("missing, loose or non-https credentials hold the queue without sending", () => {
  const env = setup("http://example.com/hook");
  try {
    assert.equal(loadTarget(env.config.targets.get("grokbot")).reason, "webhook URL must use https");
    chmodSync(env.envFile, 0o644);
    assert.equal(loadTarget(env.config.targets.get("grokbot")).reason, "credentials file must be mode 600");
    assert.equal(loadTarget({ ...env.config.targets.get("grokbot"), envFile: join(env.dir, "absent") }).reason, "credentials file missing");
  } finally {
    env.store.close();
  }
});

test("each project's target delivers on its own; one without credentials does not hold the others", async () => {
  const hook = await receiver((req, res) => res.writeHead(200).end());
  const env = setup(hook.url);
  try {
    const config = normalizeConfig(
      testConfig({
        stateDir: join(env.dir, "state2"),
        targets: {
          crabstock: { envFile: env.envFile, urlVar: "CRABSTOCK_DISPATCH_WEBHOOK", authVar: "CRABSTOCK_DISPATCH_AUTH" },
          gamestock: { envFile: env.envFile, urlVar: "GAMESTOCK_DISPATCH_WEBHOOK", authVar: "GAMESTOCK_DISPATCH_AUTH" },
        },
      }),
    );
    const store = new Store(config.stateDir);
    const deliverer = new Deliverer({ store, config, log: createLogger({ write: () => {} }), now: env.now });
    store.enqueue({ id: "g1", target: "gamestock", routeKey: "gamestock", body: { event_id: "g1" } }, env.now());
    store.enqueue({ id: "c1", target: "crabstock", routeKey: "crabstock", body: { event_id: "c1" } }, env.now());
    await deliverer.drain();
    assert.deepEqual(hook.seen.map((s) => s.body.event_id), ["c1"]);
    assert.equal(deliverer.blockedReason.get("gamestock"), "credentials file lacks the webhook URL or authorization");
    assert.equal(store.nextOutbox("gamestock").report_id, "g1", "the unconfigured project's report waits");
    store.close();
  } finally {
    env.store.close();
    await hook.close();
  }
});
