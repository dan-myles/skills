#!/usr/bin/env python3
"""Poll a Paper file's comment threads and print one line per event.

Usage: watch.py <fileId> [--interval 1] [--reset]

Events (one per stdout line, meant for a Claude Code Monitor):
  NEW_THREAD <threadId> <author>: <preview>
  NEW_REPLY <threadId> <messageCount> messages
  WATCHER_ERROR <reason>      (once per outage; Paper closed, file not open, MCP down)
  WATCHER_OK                  (after an outage clears)

State lives in ~/.cache/paper-comment-watch/<fileId>.json, so a re-armed
watcher only reports what changed since the last run. --reset forgets it.
"""
import json, os, sys, time, urllib.request

URL = os.environ.get("PAPER_MCP_URL", "http://127.0.0.1:29979/mcp")
HEADERS = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}

args = sys.argv[1:]
if not args or args[0].startswith("-"):
    sys.exit("usage: watch.py <fileId> [--interval 1] [--reset]")
file_id = args[0]
interval = float(args[args.index("--interval") + 1]) if "--interval" in args else 1.0
state_dir = os.path.expanduser("~/.cache/paper-comment-watch")
os.makedirs(state_dir, exist_ok=True)
state_path = os.path.join(state_dir, f"{file_id}.json")
if "--reset" in args and os.path.exists(state_path):
    os.remove(state_path)
seen = json.load(open(state_path)) if os.path.exists(state_path) else {}


def emit(line):
    print(line, flush=True)


def post(body, sid=None):
    headers = dict(HEADERS)
    if sid:
        headers["mcp-session-id"] = sid
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.headers.get("mcp-session-id"), resp.read().decode()


def connect():
    sid, _ = post({"jsonrpc": "2.0", "id": 1, "method": "initialize",
                   "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                              "clientInfo": {"name": "paper-comment-watch", "version": "1"}}})
    post({"jsonrpc": "2.0", "method": "notifications/initialized"}, sid)
    return sid


def open_threads(sid):
    _, raw = post({"jsonrpc": "2.0", "id": 2, "method": "tools/call",
                   "params": {"name": "list_comment_threads",
                              "arguments": {"fileId": file_id, "status": "open",
                                            "previewLength": 200, "limit": 100}}}, sid)
    msg = json.loads(raw.split("data: ", 1)[-1])
    if "error" in msg:
        raise RuntimeError(msg["error"].get("message", "mcp error"))
    texts = [c.get("text", "") for c in msg.get("result", {}).get("content", [])]
    if msg.get("result", {}).get("isError"):
        raise RuntimeError(" ".join(texts)[:200])
    for text in texts:
        if '"commentThreads"' in text:
            return json.loads(text)["commentThreads"]
    raise RuntimeError("no commentThreads in response")


sid, failures, down = None, 0, False
while True:
    try:
        sid = sid or connect()
        threads = open_threads(sid)
        if down:
            emit("WATCHER_OK")
        failures, down = 0, False
        changed = False
        for t in threads:
            tid, count = t["commentThreadId"], t.get("messageCount", 1)
            if tid not in seen:
                preview = (t.get("firstMessagePreview") or {}).get("text", "").replace("\n", " ")
                emit(f"NEW_THREAD {tid} {t.get('authorDisplayName', '?')}: {preview}")
            elif count > seen[tid]:
                emit(f"NEW_REPLY {tid} {count} messages")
            if seen.get(tid) != count:
                seen[tid], changed = count, True
        if changed:
            json.dump(seen, open(state_path, "w"))
    except Exception as exc:  # noqa: BLE001 - any failure means reconnect and retry
        sid, failures = None, failures + 1
        if failures >= 5 and not down:
            down = True
            emit(f"WATCHER_ERROR {type(exc).__name__}: {str(exc)[:160]}")
    time.sleep(interval)
