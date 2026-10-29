#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Bridge } from "../src/bridge.mjs";
import { loadConfig, resolveRoute } from "../src/config.mjs";
import { classifyStatus, loadTarget, postReport } from "../src/delivery.mjs";
import { fileMode, readEnvFile, writeEnvFile } from "../src/envfile.mjs";
import { createLogger } from "../src/log.mjs";
import { REPORT_SCHEMA } from "../src/report.mjs";
import { RpcConnection, checkDescriptor, fetchDescriptor } from "../src/rpc.mjs";
import { isLive, normalizeProject, normalizeThread } from "../src/shell.mjs";
import { Store } from "../src/store.mjs";

const USAGE = `usage: t3-grokbot-bridge <command> --config <file> [options]

commands:
  run                      stream T3 updates and deliver reports until stopped
  check                    verify config, token and T3 connection; prints routes, sends nothing
  status                   print the last status file and queue counts
  set-credentials          write a target's webhook URL and Authorization value into its env file
                           --target <name> --url-file <file> --auth-file <file>
  test-send                POST one fake setup-test report and print only the HTTP status
                           --target <name>
  requeue-dead             retry reports the receiver rejected
  launchd                  render a launchd plist into the state directory; installs nothing
                           [--label <label>]
`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    config: { type: "string" },
    target: { type: "string" },
    "url-file": { type: "string" },
    "auth-file": { type: "string" },
    label: { type: "string" },
    verbose: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

const command = positionals[0];
if (values.help || !command) {
  process.stdout.write(USAGE);
  process.exit(command ? 0 : 2);
}
if (!values.config) {
  process.stderr.write("--config is required\n");
  process.exit(2);
}
const configPath = resolve(values.config);
const config = loadConfig(configPath);
const log = createLogger({ level: values.verbose ? "debug" : (process.env.T3_BRIDGE_LOG_LEVEL ?? "info") });

function readToken() {
  if ((fileMode(config.environment.tokenFile) & 0o077) !== 0) throw new Error("token file must be mode 600");
  return readFileSync(config.environment.tokenFile, "utf8").trim();
}

function target(name) {
  const resolved = config.targets.get(name ?? config.defaults.target);
  if (!resolved) throw new Error(`unknown target ${name}`);
  return resolved;
}

async function run() {
  readToken();
  const store = new Store(config.stateDir);
  const bridge = new Bridge({ config, store, log });
  const stop = () => {
    log.info("stopping");
    bridge.stop();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  log.info("bridge starting", { environment: config.environment.key, stateDir: config.stateDir });
  await bridge.run();
  bridge.writeStatus();
  store.close();
}

async function check() {
  const descriptor = await fetchDescriptor(config.environment.httpBaseUrl);
  checkDescriptor(descriptor);
  const out = {
    environment: { id: descriptor.environmentId, label: descriptor.label, serverVersion: descriptor.serverVersion, protocol: descriptor.orchestrationProtocolVersion },
  };
  const connection = new RpcConnection({ httpBaseUrl: config.environment.httpBaseUrl, token: readToken() });
  await connection.open();
  const snapshot = await new Promise((resolvePromise, reject) => {
    let latest = null;
    const timer = setTimeout(() => reject(new Error("no synchronized shell within 30s")), 30_000);
    connection.stream("orchestration.subscribeShell", { requestCompletionMarker: true }, {
      onItems: (items) => {
        for (const item of items) {
          if (item.kind === "snapshot" && item.resolvedRepositoryIdentityRoots === undefined) latest = item.snapshot;
          if (item.kind === "synchronized") {
            clearTimeout(timer);
            resolvePromise(latest);
          }
        }
      },
      onExit: () => reject(new Error("shell stream ended before synchronizing")),
    });
  });
  connection.shutdown("check finished");
  const threads = snapshot.threads.map(normalizeThread);
  out.shell = { sequence: snapshot.snapshotSequence, projects: snapshot.projects.length, threads: threads.length, live: threads.filter(isLive).length };
  out.routes = snapshot.projects.map(normalizeProject).map((project) => {
    const route = resolveRoute(config, project);
    const rows = threads.filter((t) => t.projectId === project.id);
    return {
      project: project.title,
      projectId: project.id,
      route: route ? { key: route.key, target: route.target, detail: route.detail, subagents: route.subagents, configured: config.projects.includes(route) } : "ignored",
      threads: rows.length,
      live: rows.filter(isLive).length,
    };
  });
  out.targets = [...config.targets.values()].map((t) => {
    const loaded = loadTarget(t);
    return { target: t.name, envFile: t.envFile, ready: loaded.ok, ...(loaded.ok ? {} : { reason: loaded.reason }) };
  });
  out.state = { dir: config.stateDir, exists: existsSync(join(config.stateDir, "bridge.sqlite")) };
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
}

function status() {
  const statusPath = join(config.stateDir, "status.json");
  const out = { status: existsSync(statusPath) ? JSON.parse(readFileSync(statusPath, "utf8")) : null };
  if (existsSync(join(config.stateDir, "bridge.sqlite"))) {
    const store = new Store(config.stateDir);
    out.store = store.stats();
    store.close();
  }
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
}

function readSecretFile(path) {
  if (!path) throw new Error("--url-file and --auth-file are required");
  const stat = statSync(path);
  if ((stat.mode & 0o077) !== 0) throw new Error(`${path} is readable by other users`);
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length !== 1) throw new Error(`${path} must hold exactly one non-empty line (found ${lines.length})`);
  return lines[0].trim();
}

function setCredentials() {
  const t = target(values.target);
  const url = readSecretFile(values["url-file"]);
  // The value only; a pasted "Authorization: Bearer …" line would send the header name twice.
  const auth = readSecretFile(values["auth-file"]).replace(/^authorization:\s*/i, "");
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error();
  } catch {
    throw new Error("the URL file does not hold an https URL");
  }
  const existing = existsSync(t.envFile) ? readEnvFile(t.envFile) : new Map();
  existing.set(t.urlVar, url);
  existing.set(t.authVar, auth);
  mkdirSync(dirname(t.envFile), { recursive: true, mode: 0o700 });
  writeEnvFile(t.envFile, existing);
  process.stdout.write(`wrote ${t.urlVar} and ${t.authVar} to ${t.envFile} (mode 600)\n`);
}

async function testSend() {
  const t = target(values.target);
  const credentials = loadTarget(t);
  if (!credentials.ok) throw new Error(credentials.reason);
  const id = `setup-test/${randomUUID()}`;
  const body = {
    schema: REPORT_SCHEMA,
    event_id: id,
    kind: "bridge.setup_test",
    item: "setup-test",
    thread: null,
    status: "test",
    summary: "Fake setup test from t3-grokbot-bridge. Not a real T3 update; safe to ignore.",
    at: new Date().toISOString(),
    environment: { id: null, label: null, key: config.environment.key },
    project: null,
    update: { test: true },
  };
  const result = await postReport(credentials, body, { timeoutMs: config.delivery.timeoutMs });
  process.stdout.write(result.status === null ? `no response (${result.error})\n` : `${result.status} (${classifyStatus(result.status)})\n`);
  if (result.status === null || classifyStatus(result.status) !== "delivered") process.exitCode = 1;
}

function requeueDead() {
  const store = new Store(config.stateDir);
  process.stdout.write(`requeued ${store.requeueDead()} reports\n`);
  store.close();
}

function launchd() {
  const label = values.label ?? `com.danmyles.t3-grokbot-bridge.${config.environment.key}`;
  const here = dirname(fileURLToPath(import.meta.url));
  const template = readFileSync(join(here, "..", "launchd", "bridge.plist.template"), "utf8");
  const logDir = join(config.stateDir, "logs");
  const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const plist = template
    .replaceAll("{{LABEL}}", escape(label))
    .replaceAll("{{NODE}}", escape(process.execPath))
    .replaceAll("{{SCRIPT}}", escape(fileURLToPath(import.meta.url)))
    .replaceAll("{{CONFIG}}", escape(configPath))
    .replaceAll("{{WORKDIR}}", escape(config.stateDir))
    .replaceAll("{{STDOUT}}", escape(join(logDir, "bridge.out.log")))
    .replaceAll("{{STDERR}}", escape(join(logDir, "bridge.log")));
  const outDir = join(config.stateDir, "launchd");
  mkdirSync(outDir, { recursive: true, mode: 0o700 });
  mkdirSync(logDir, { recursive: true, mode: 0o700 });
  const outPath = join(outDir, `${label}.plist`);
  writeFileSync(outPath, plist, { mode: 0o600 });
  process.stdout.write(
    [
      `rendered ${outPath}`,
      "nothing was installed. To run it at login, review the file, then:",
      `  cp '${outPath}' ~/Library/LaunchAgents/${label}.plist`,
      `  launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/${label}.plist`,
      "to stop and remove:",
      `  launchctl bootout gui/$(id -u)/${label} && rm ~/Library/LaunchAgents/${label}.plist`,
      "",
    ].join("\n"),
  );
}

const commands = { run, check, status, "set-credentials": setCredentials, "test-send": testSend, "requeue-dead": requeueDead, launchd };
if (!commands[command]) {
  process.stderr.write(USAGE);
  process.exit(2);
}
try {
  await commands[command]();
} catch (error) {
  process.stderr.write(`error: ${error.message}\n`);
  process.exit(1);
}
