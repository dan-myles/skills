// Minimal client for T3's WebSocket RPC (Effect RPC, JSON serialization), the
// same transport the T3 apps use. It is an internal client contract, not a
// public SDK; `checkDescriptor` refuses servers with another protocol version.

export const ORCHESTRATION_PROTOCOL_VERSION = 2;
const PING_INTERVAL_MS = 5_000;
const SILENCE_LIMIT_MS = 15_000;

export class AuthError extends Error {}
export class IncompatibleServerError extends Error {}

export async function fetchDescriptor(httpBaseUrl, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`${httpBaseUrl}/.well-known/t3/environment`, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`environment descriptor returned http ${response.status}`);
  return response.json();
}

export function checkDescriptor(descriptor) {
  const version = descriptor.orchestrationProtocolVersion ?? 1;
  if (version !== ORCHESTRATION_PROTOCOL_VERSION) {
    throw new IncompatibleServerError(`server speaks orchestration protocol ${version}; this bridge supports ${ORCHESTRATION_PROTOCOL_VERSION}`);
  }
}

async function issueTicket(httpBaseUrl, token, fetchImpl) {
  const response = await fetchImpl(`${httpBaseUrl}/api/auth/websocket-ticket/rpc`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 401 || response.status === 403) throw new AuthError(`T3 refused the bridge token (http ${response.status})`);
  if (!response.ok) throw new Error(`websocket ticket returned http ${response.status}`);
  const { ticket } = await response.json();
  return ticket;
}

export function socketUrl(httpBaseUrl, ticket) {
  const url = new URL(httpBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  url.searchParams.set("wsTicket", ticket);
  url.searchParams.set("orchestrationProtocol", String(ORCHESTRATION_PROTOCOL_VERSION));
  url.searchParams.set("clientSurface", "headless");
  return url.toString();
}

/** Describes an RPC failure without echoing payloads. */
export function describeExit(exit) {
  if (exit?._tag === "Success") return "completed";
  const causes = Array.isArray(exit?.cause) ? exit.cause : [exit?.cause];
  return causes
    .map((cause) => cause?.error?._tag ?? cause?._tag ?? "unknown")
    .join(", ")
    .slice(0, 200);
}

export class RpcConnection {
  constructor({ httpBaseUrl, token, fetchImpl = fetch, WebSocketImpl = globalThis.WebSocket }) {
    this.httpBaseUrl = httpBaseUrl;
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.WebSocketImpl = WebSocketImpl;
    this.requests = new Map();
    this.nextId = 1;
    this.closed = false;
    this.closeListeners = [];
  }

  async open() {
    const ticket = await issueTicket(this.httpBaseUrl, this.token, this.fetchImpl);
    const ws = new this.WebSocketImpl(socketUrl(this.httpBaseUrl, ticket));
    this.ws = ws;
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = () => reject(new Error("websocket failed to open"));
      ws.onclose = (event) => reject(new Error(`websocket closed while opening (${event.code})`));
    });
    this.lastFrameAt = Date.now();
    ws.onmessage = (event) => this.receive(event.data);
    ws.onerror = () => {};
    ws.onclose = (event) => this.shutdown(`socket closed (${event.code})`);
    this.pingTimer = setInterval(() => {
      if (Date.now() - this.lastFrameAt > SILENCE_LIMIT_MS) {
        this.shutdown("no frame from server for 15s");
        return;
      }
      this.send({ _tag: "Ping" });
    }, PING_INTERVAL_MS);
  }

  onClose(listener) {
    this.closeListeners.push(listener);
  }

  send(message) {
    if (!this.closed && this.ws?.readyState === 1) this.ws.send(JSON.stringify(message));
  }

  /**
   * Starts a streaming RPC. `onItems` runs for each chunk and must finish (including durable
   * writes) before the chunk is acknowledged; a throw closes the connection unacknowledged.
   */
  stream(tag, payload, { onItems, onExit }) {
    const id = String(this.nextId++);
    this.requests.set(id, { onItems, onExit, queue: Promise.resolve() });
    this.send({ _tag: "Request", id, tag, payload, headers: [] });
    return {
      id,
      cancel: () => {
        if (this.requests.delete(id)) this.send({ _tag: "Interrupt", requestId: id });
      },
    };
  }

  receive(data) {
    this.lastFrameAt = Date.now();
    let messages;
    try {
      messages = [].concat(JSON.parse(typeof data === "string" ? data : Buffer.from(data).toString("utf8")));
    } catch {
      this.shutdown("undecodable frame");
      return;
    }
    for (const message of messages) {
      if (message._tag === "Chunk") {
        const request = this.requests.get(message.requestId);
        if (!request) continue;
        request.queue = request.queue
          .then(() => request.onItems(message.values))
          .then(() => this.send({ _tag: "Ack", requestId: message.requestId }))
          .catch((error) => this.shutdown(`processing failed: ${error?.message ?? error}`, error));
      } else if (message._tag === "Exit") {
        const request = this.requests.get(message.requestId);
        if (!request) continue;
        this.requests.delete(message.requestId);
        request.queue.then(() => request.onExit?.(message.exit));
      } else if (message._tag === "Defect" || message._tag === "ClientProtocolError") {
        this.shutdown(`server reported ${message._tag}`);
      }
    }
  }

  shutdown(reason, error) {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.pingTimer);
    try {
      this.ws?.close();
    } catch {}
    for (const listener of this.closeListeners) listener(reason, error);
  }
}
