import { existsSync } from "node:fs";
import { fileMode, readEnvFile } from "./envfile.mjs";

// Posts queued reports one at a time per target, oldest first. Delivery is
// at-least-once: a report is marked delivered only after a 2xx, so a crash or
// timeout after the receiver accepted it sends it again with the same event id.

const MAX_BACKOFF_MS = 15 * 60_000;
const CONFIG_RETRY_MS = 10 * 60_000;

export function loadTarget(target) {
  if (!existsSync(target.envFile)) return { ok: false, reason: "credentials file missing" };
  if ((fileMode(target.envFile) & 0o077) !== 0) return { ok: false, reason: "credentials file must be mode 600" };
  let values;
  try {
    values = readEnvFile(target.envFile);
  } catch {
    return { ok: false, reason: "credentials file could not be parsed" };
  }
  const url = values.get(target.urlVar);
  const auth = values.get(target.authVar);
  if (!url || !auth) return { ok: false, reason: "credentials file lacks the webhook URL or authorization" };
  if (/[\r\n\0]/.test(url + auth)) return { ok: false, reason: "credentials contain a line break" };
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "webhook URL is not a valid URL" };
  }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname))) {
    return { ok: false, reason: "webhook URL must use https" };
  }
  return { ok: true, url, auth };
}

export function backoffMs(attempts, random = Math.random) {
  const base = Math.min(MAX_BACKOFF_MS, 2_000 * 2 ** Math.min(attempts, 20));
  return Math.round(base / 2 + random() * (base / 2));
}

function retryAfterMs(header) {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.min(3_600_000, Math.max(0, seconds * 1_000));
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.min(3_600_000, Math.max(0, date - Date.now()));
}

/** What to do after a response status: deliver, retry later, or stop retrying. */
export function classifyStatus(status) {
  if (status >= 200 && status < 300) return "delivered";
  if (status === 408 || status === 425 || status === 429 || status >= 500) return "retry";
  if (status === 401 || status === 403 || status === 404 || status === 410) return "config";
  return "dead";
}

export async function postReport(credentials, body, { timeoutMs, fetchImpl = fetch }) {
  try {
    const response = await fetchImpl(credentials.url, {
      method: "POST",
      headers: {
        authorization: credentials.auth,
        "content-type": "application/json",
        "idempotency-key": body.event_id,
        "user-agent": "t3-grokbot-bridge/0.1",
      },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.body?.cancel().catch(() => {});
    return { status: response.status, retryAfter: retryAfterMs(response.headers.get("retry-after")) };
  } catch (error) {
    // Errors can embed the request URL; keep only a class name.
    const reason = error?.name === "TimeoutError" ? "timeout" : (error?.cause?.code ?? error?.name ?? "network_error");
    return { status: null, error: String(reason).slice(0, 60) };
  }
}

export class Deliverer {
  constructor({ store, config, log, fetchImpl = fetch, now = () => Date.now() }) {
    this.store = store;
    this.config = config;
    this.log = log;
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.blockedReason = new Map();
  }

  /** Attempts every due report; returns the delay until the next attempt is worth making. */
  async drain() {
    let nextDelay = 30_000;
    for (const targetName of this.store.pendingTargets()) {
      const target = this.config.targets.get(targetName);
      if (!target) {
        this.note(targetName, "no such target in config");
        continue;
      }
      nextDelay = Math.min(nextDelay, await this.drainTarget(target));
    }
    return nextDelay;
  }

  async drainTarget(target) {
    for (;;) {
      const now = this.now();
      const report = this.store.nextOutbox(target.name);
      if (!report) return 30_000;
      if (report.next_attempt_at > now) return report.next_attempt_at - now;
      const credentials = loadTarget(target);
      if (!credentials.ok) {
        this.note(target.name, credentials.reason);
        return 30_000;
      }
      const result = await postReport(credentials, report.body, { timeoutMs: this.config.delivery.timeoutMs, fetchImpl: this.fetchImpl });
      const outcome = result.status === null ? "retry" : classifyStatus(result.status);
      const label = result.status === null ? result.error : `http ${result.status}`;
      const at = this.now();
      if (outcome === "delivered") {
        this.store.recordAttempt(report.report_id, { state: "delivered", nextAttemptAt: at, result: label, now: at });
        this.note(target.name, null);
        this.log.debug("delivered", { target: target.name, report: report.report_id, kind: report.body.kind });
        continue;
      }
      if (outcome === "dead") {
        this.store.recordAttempt(report.report_id, { state: "dead", nextAttemptAt: at, result: label, now: at });
        this.log.warn("report rejected; kept as dead letter", { target: target.name, report: report.report_id, result: label });
        continue;
      }
      const delay = outcome === "config" ? CONFIG_RETRY_MS : (result.retryAfter ?? backoffMs(report.attempts));
      this.store.recordAttempt(report.report_id, { state: "pending", nextAttemptAt: at + delay, result: label, now: at });
      this.note(target.name, outcome === "config" ? `receiver refused credentials or path (${label})` : `delivery failing (${label})`);
      return delay;
    }
  }

  note(targetName, reason) {
    if (this.blockedReason.get(targetName) === reason) return;
    this.blockedReason.set(targetName, reason);
    if (reason === null) this.log.info("delivery healthy", { target: targetName });
    else this.log.warn("delivery blocked", { target: targetName, reason });
  }
}
