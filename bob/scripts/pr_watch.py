#!/usr/bin/env python3
"""Print one line per change on a GitHub PR, for Babysit's wait in Synara, which has no PR wake.

usage: pr_watch.py <number> [--repo owner/name] [--every 60] [--max-minutes 30] [--until-change]

Stream mode (for Monitor): prints events until the PR merges or closes, or time runs out.
--until-change (for a backgrounded shell): exits after the first poll that found changes, so the exit wakes the agent.
Exit codes: 0 changed, merged, or closed; 2 timed out with no change.
"""
import argparse
import json
import os
import subprocess
import sys
import time

FIELDS = "state,headRefOid,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,comments,reviews"


def gh(args, env):
    try:
        out = subprocess.run(["gh", *args], check=True, capture_output=True, text=True, env=env, timeout=60).stdout
        return json.loads(out) if out.strip() else None
    except (subprocess.SubprocessError, json.JSONDecodeError) as error:
        print(f"WARN gh {' '.join(args[:3])} failed: {error}", file=sys.stderr, flush=True)
        return None


def snapshot(number, repo, env):
    view = gh(["pr", "view", str(number), "--json", FIELDS, *(["--repo", repo] if repo else [])], env)
    if view is None:
        return None
    inline = gh(["api", f"repos/{{owner}}/{{repo}}/pulls/{number}/comments", "--paginate"], env) or []
    checks = {}
    for c in view.get("statusCheckRollup") or []:
        name = c.get("name") or c.get("context") or "?"
        checks[name] = (c.get("conclusion") or c.get("state") or c.get("status") or "PENDING").upper()
    return {
        "state": view.get("state"),
        "head": view.get("headRefOid"),
        "merge": f"{view.get('mergeable')}/{view.get('mergeStateStatus')}",
        "review": view.get("reviewDecision") or "NONE",
        "checks": checks,
        "comments": {str(c.get("id") or c.get("url")): (c.get("author") or {}).get("login", "?") for c in view.get("comments") or []},
        "reviews": {str(r.get("id")): f"{(r.get('author') or {}).get('login', '?')} {r.get('state')}" for r in view.get("reviews") or []},
        "inline": {str(c["id"]): f"{c['user']['login']} {c.get('path')}:{c.get('line')}" for c in inline if isinstance(c, dict) and "id" in c},
    }


def diff(old, new):
    events = []
    for key, label in (("state", "STATE"), ("head", "NEW HEAD"), ("merge", "MERGEABLE"), ("review", "REVIEW DECISION")):
        if old is None or old[key] != new[key]:
            events.append(f"{label} {new[key]}")
    for name, result in sorted(new["checks"].items()):
        if old is None or old["checks"].get(name) != result:
            events.append(f"CHECK {name}: {result}")
    if old is not None:
        for key, label in (("comments", "COMMENT"), ("reviews", "REVIEW"), ("inline", "INLINE COMMENT")):
            for item_id, who in new[key].items():
                if item_id not in old[key]:
                    events.append(f"{label} {who} ({item_id})")
    return events


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("number", type=int)
    parser.add_argument("--repo")
    parser.add_argument("--every", type=int, default=60)
    parser.add_argument("--max-minutes", type=float, default=30)
    parser.add_argument("--until-change", action="store_true")
    args = parser.parse_args()

    env = dict(os.environ, **({"GH_REPO": args.repo} if args.repo else {}))
    deadline = time.monotonic() + args.max_minutes * 60
    last = None
    while time.monotonic() < deadline:
        now = snapshot(args.number, args.repo, env)
        if now is not None:
            events = diff(last, now)
            for event in events:
                print(event, flush=True)
            if now["state"] in ("MERGED", "CLOSED"):
                return 0
            if args.until_change and last is not None and events:
                return 0
            last = now
        time.sleep(args.every)
    print("TIMEOUT", flush=True)
    return 2


if __name__ == "__main__":
    sys.exit(main())
