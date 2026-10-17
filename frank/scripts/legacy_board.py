#!/usr/bin/env python3
"""Convert the T3 edition's Frank board into the Synara edition's board, without touching the original.

usage: legacy_board.py [--legacy ~/.bob-n-frank/frank] [--out /tmp/frank-migrate]

Writes board.tsv, seen.tsv, and summary.json to --out. Reads the legacy files only, and fails if any
of them changed while it ran.
"""
import argparse
import csv
import hashlib
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

HEADER = ["id", "source", "kind", "repo", "state", "work_item", "thread", "pr", "rank", "updated", "note"]
KEEP = {"new", "triaged", "proposed", "done", "dropped"}
T3_BOUND = {"dispatched", "merge-ready"}


def digest(paths):
    return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in paths if p.exists()}


def read_tsv(path):
    with path.open(newline="") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def convert(row, warnings):
    state = (row.get("state") or "").strip()
    t3_thread = (row.get("thread_id") or "").strip()
    note = (row.get("note") or "").strip()
    if t3_thread:
        note = f"t3 thread {t3_thread}; {note}" if note else f"t3 thread {t3_thread}"
    if state in KEEP:
        new_state = state
    elif state == "approved":
        new_state = "proposed"
        note = f"approved in T3 {row.get('updated', '')}; reconfirm before dispatch; {note}"
    elif state in T3_BOUND:
        new_state = "legacy-t3"
        note = f"t3 {state}; {note}"
    else:
        new_state = state
        warnings.append(f"{row.get('id')}: unknown state {state!r} kept as is")
    return {
        "id": row.get("id", ""),
        "source": row.get("source", ""),
        "kind": row.get("kind", ""),
        "repo": row.get("repo", ""),
        "state": new_state,
        "work_item": "",
        "thread": "",
        "pr": row.get("pr", ""),
        "rank": row.get("rank", ""),
        "updated": row.get("updated", ""),
        "note": note,
    }


def write_tsv(path, header, rows):
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=header, delimiter="\t", lineterminator="\n", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--legacy", default=str(Path.home() / ".bob-n-frank" / "frank"))
    parser.add_argument("--out", default="/tmp/frank-migrate")
    args = parser.parse_args()

    legacy, out = Path(args.legacy).expanduser(), Path(args.out).expanduser()
    if out.resolve().is_relative_to(legacy.parent.resolve()) and not out.resolve().is_relative_to((legacy.parent / "synara").resolve()):
        sys.exit("--out must not be inside the T3 edition's ~/.bob-n-frank")
    inputs = [legacy / "board.tsv", legacy / "seen.tsv", legacy / "decisions.tsv"]
    before = digest(inputs)
    if "board.tsv" not in before:
        sys.exit(f"no board at {legacy / 'board.tsv'}")

    warnings = []
    board = read_tsv(legacy / "board.tsv")
    rows = [convert(r, warnings) for r in board]
    seen = read_tsv(legacy / "seen.tsv") if (legacy / "seen.tsv").exists() else []

    out.mkdir(parents=True, exist_ok=True)
    write_tsv(out / "board.tsv", HEADER, rows)
    if seen:
        write_tsv(out / "seen.tsv", list(seen[0].keys()), seen)

    after = digest(inputs)
    if after != before:
        sys.exit("legacy files changed during the run; a T3 Frank may still be writing them. Nothing was imported.")

    summary = {
        "legacy": str(legacy),
        "converted_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sha256": before,
        "rows": len(rows),
        "seen": len(seen),
        "states_before": dict(Counter(r.get("state", "") for r in board)),
        "states_after": dict(Counter(r["state"] for r in rows)),
        "legacy_t3_prs": sorted({r["pr"] for r in rows if r["state"] == "legacy-t3" and r["pr"]}),
        "sweep_lock": (legacy / ".sweep.lock").exists(),
        "warnings": warnings,
    }
    (out / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
