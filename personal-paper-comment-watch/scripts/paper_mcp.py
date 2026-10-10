#!/usr/bin/env python3
"""Call one Paper MCP tool over the local HTTP endpoint.

Usage: paper_mcp.py <tool> '<json-args>' [--html-file path] [--full]

--html-file  read a large HTML payload from disk into args.html (write_html)
--full       print the whole tool result; otherwise print OK/ERR and the first node IDs

Use it for writes too big to paste into a tool call, and to avoid flooding
context with huge results such as duplicate_nodes ID maps.
"""
import json, os, re, sys, urllib.request

URL = os.environ.get("PAPER_MCP_URL", "http://127.0.0.1:29979/mcp")
HEADERS = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


def post(body, sid=None):
    headers = dict(HEADERS)
    if sid:
        headers["mcp-session-id"] = sid
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.headers.get("mcp-session-id"), resp.read().decode()


sid, _ = post({"jsonrpc": "2.0", "id": 1, "method": "initialize",
               "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                          "clientInfo": {"name": "paper_mcp", "version": "1"}}})
post({"jsonrpc": "2.0", "method": "notifications/initialized"}, sid)
tool, args = sys.argv[1], json.loads(sys.argv[2])
if "--html-file" in sys.argv:
    args["html"] = open(sys.argv[sys.argv.index("--html-file") + 1]).read()
_, raw = post({"jsonrpc": "2.0", "id": 2, "method": "tools/call",
               "params": {"name": tool, "arguments": args}}, sid)
msg = json.loads(raw.split("data: ", 1)[-1])
text = "\n".join(c.get("text", "") for c in msg.get("result", {}).get("content", []))
failed = "error" in msg or msg.get("result", {}).get("isError")
if "--full" in sys.argv or failed:
    print(text or json.dumps(msg.get("error")))
    sys.exit(1 if failed else 0)
ids = re.findall(r'"(?:newId|id)": "([A-Z0-9]+-[0-9]+)"', text)
print("OK", " ".join(ids[:6]), f"... total {len(ids)}" if len(ids) > 6 else "")
