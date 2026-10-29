import { ENV_ID } from "./fixtures.mjs";

// An in-memory T3 server speaking the same Effect RPC frames as the real one,
// plus a webhook receiver. Tests drive it item by item.

export class FakeT3 {
  constructor() {
    this.sockets = [];
    this.requests = [];
    this.acks = [];
    this.interrupts = [];
    this.posts = [];
    this.webhookStatus = () => 200;
    this.fetch = this.fetch.bind(this);
    const t3 = this;
    this.WebSocket = class {
      constructor(url) {
        this.url = new URL(url);
        this.readyState = 0;
        t3.sockets.push(this);
        queueMicrotask(() => {
          this.readyState = 1;
          this.onopen?.();
        });
      }
      send(data) {
        t3.receive(this, JSON.parse(data));
      }
      close() {
        if (this.readyState === 3) return;
        this.readyState = 3;
        queueMicrotask(() => this.onclose?.({ code: 1000 }));
      }
    };
  }

  async fetch(url, init = {}) {
    const u = new URL(url);
    if (u.pathname === "/.well-known/t3/environment") {
      return Response.json({ environmentId: ENV_ID, label: "Test Studio", serverVersion: "0.1.5-test", orchestrationProtocolVersion: 2 });
    }
    if (u.pathname === "/api/auth/websocket-ticket/rpc") {
      if (init.headers?.authorization !== "Bearer test-token") return new Response("", { status: 401 });
      return Response.json({ ticket: "ticket-1", expiresAt: new Date().toISOString() });
    }
    if (u.hostname === "hook.test") {
      const body = JSON.parse(init.body);
      this.posts.push({ headers: init.headers, body });
      return new Response("", { status: this.webhookStatus(body) });
    }
    throw new Error(`unexpected fetch ${u.pathname}`);
  }

  receive(socket, message) {
    if (message._tag === "Request") this.requests.push({ ...message, socket });
    else if (message._tag === "Ack") this.acks.push(message.requestId);
    else if (message._tag === "Interrupt") this.interrupts.push(message.requestId);
    else if (message._tag === "Ping") socket.onmessage?.({ data: JSON.stringify({ _tag: "Pong" }) });
  }

  push(request, ...values) {
    request.socket.onmessage({ data: JSON.stringify({ _tag: "Chunk", requestId: request.id, values }) });
  }

  drop() {
    const socket = this.sockets.at(-1);
    socket.readyState = 3;
    socket.onclose?.({ code: 1006 });
  }

  request(tag, index = -1) {
    return this.requests.filter((r) => r.tag === tag).at(index);
  }

  async waitFor(check, label, timeoutMs = 5_000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const value = check();
      if (value) return value;
      if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  kinds() {
    return this.posts.map((p) => p.body.kind);
  }
}
