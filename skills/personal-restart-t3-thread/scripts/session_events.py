#!/usr/bin/env python3
"""Read T3 provider-session events for one thread. Never writes.

mark:  print the newest event sequence and the thread's latest session event.
wait:  poll until the thread has a matching event after a sequence, or time out.
"""
import argparse
import json
import sqlite3
import sys
import time
from pathlib import Path

DEFAULT_DB = Path.home() / ".t3/userdata/statev2.sqlite"
SESSION_TYPES = ("provider-session.attached", "provider-session.detached", "thread.settled", "thread.unsettled")


def connect(db):
    if not Path(db).is_file():
        sys.exit(f"no T3 state database at {db}")
    return sqlite3.connect(f"file:{db}?mode=ro", uri=True, timeout=10)


def row(conn, sql, args):
    cur = conn.execute(sql, args)
    found = cur.fetchone()
    if not found:
        return None
    event = dict(zip([d[0] for d in cur.description], found))
    payload = json.loads(event.pop("payload_json") or "{}")
    event["reason"] = payload.get("reason")
    event["providerSessionId"] = payload.get("providerSessionId") or payload.get("id")
    return event


def latest(conn, thread):
    marks = ",".join("?" * len(SESSION_TYPES))
    return row(conn, f"select sequence, event_type, occurred_at, payload_json from orchestration_events "
                     f"where stream_id = ? and event_type in ({marks}) order by sequence desc limit 1",
               (thread, *SESSION_TYPES))


def mark(args):
    with connect(args.db) as conn:
        sequence = conn.execute("select coalesce(max(sequence), 0) from orchestration_events").fetchone()[0]
        print(json.dumps({"thread": args.thread, "sequence": sequence, "latest": latest(conn, args.thread)}))


def wait(args):
    deadline = time.monotonic() + args.timeout
    sql = ("select sequence, event_type, occurred_at, payload_json from orchestration_events "
           "where stream_id = ? and event_type = ? and sequence > ?")
    params = [args.thread, args.event, args.after]
    if args.reason:
        sql += " and json_extract(payload_json, '$.reason') = ?"
        params.append(args.reason)
    sql += " order by sequence limit 1"
    while True:
        with connect(args.db) as conn:
            found = row(conn, sql, params)
            if found:
                print(json.dumps({"thread": args.thread, "found": True, "event": found}))
                return 0
            if time.monotonic() >= deadline:
                print(json.dumps({"thread": args.thread, "found": False, "waitedSeconds": args.timeout,
                                  "latest": latest(conn, args.thread)}))
                return 2
        time.sleep(args.interval)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--db", default=str(DEFAULT_DB))
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("mark")
    p.add_argument("--thread", required=True)
    p = sub.add_parser("wait")
    p.add_argument("--thread", required=True)
    p.add_argument("--after", type=int, required=True, help="only events with a larger sequence")
    p.add_argument("--event", required=True, choices=SESSION_TYPES)
    p.add_argument("--reason", help='e.g. "Thread settled."; omit to accept any')
    p.add_argument("--timeout", type=float, default=600)
    p.add_argument("--interval", type=float, default=3)
    args = parser.parse_args()
    return mark(args) if args.command == "mark" else wait(args)


if __name__ == "__main__":
    sys.exit(main() or 0)
