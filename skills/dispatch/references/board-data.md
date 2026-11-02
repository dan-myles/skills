# Board data

Use the renderer shipped in this skill, not a per-project rewrite. It reads the Beads graph and this pass's live T3 evidence, uses Python's standard library, and embeds its sibling assets in one HTML file. Fictional fixtures: [example-beads.json](../assets/example-beads.json) and [example-live.json](../assets/example-live.json).

```sh
dir=$(mktemp -d)
bd list --all --include-gates --limit 0 --json > "$dir/issues.json"
# write "$dir/live.json" from this pass's T3 and PR reads
python3 <installed-dispatch>/scripts/render-board.py --beads "$dir/issues.json" \
  --root <root ID> --live "$dir/live.json" \
  --output "$dir/board.html" --project '<project>'
```

Read the JSON result for warnings. Fix missing board fields on the issues before presenting. Missing fields remain visible gaps; HTML generation does not verify runtime or PR state. Write the export, live file and HTML outside the repository. When Beads is unreachable, pass `--live` alone: the board shows live Coopers from the thread list and worker entries, and says the graph is unavailable. A legacy `board.md` can still be rendered read-only by passing its path instead of `--beads`.

## Placement

Cards are the root's descendants. Gates, events, messages and molecules never get cards; neither do `dropped` work or closed decisions. Close anything that did not land (superseded, dismissed, abandoned) with `dropped`, or it shows under What landed. A blocker missing from the export shows as a gate to fix, usually a forgotten `--include-gates`. An open decision that blocks an item appears as that item's gate, marked "(needs Dan)" when labelled `human`; one that blocks nothing gets its own card.

| Section | Issues |
| --- | --- |
| Now | an open Cooper: a worker link without `t3.settled` or live `"settled": true`, or an uncertain launch, whatever the issue status, labels or runtime |
| What landed | otherwise closed within `--landed-days` (default 14), newest first |
| Watch and links | otherwise open and labelled `watch` or `external` |
| Backlog | everything else still open, including merge-ready PRs and idle owners |

Other sections sort by priority. A worker reused across issues, keyed by `t3.thread` (else `t3.link`), gets one card: its open issue, else its most recently updated one. Its other issues place by status and say `moved to <id>`.

## Issue fields shown

| Card field | Source |
| --- | --- |
| Summary | `board.summary` metadata, else the description's first sentence |
| Visual | `board.visual`: two to four evidence-based cause/effect or before/after steps separated by ` \| ` |
| Illustration | `board.illustration`, one JSON object (below) |
| State | status, labels, and `uncertain launch` when `t3.request` is set without `t3.thread` |
| Owner | assignee |
| Gate | open `blocks` prerequisites |
| Worker | `t3.title` and `t3.link`; a settled or moved worker shows as a thread link only |
| Worker state | `open, <runtime>`, `settled`, or `moved to <id>` |
| PR, Head, Merge | `pr.url`, `pr.head`, `merge.sha` |
| Source, External, Acceptance, Closed | `source.url`, external ref, acceptance, close reason |

Line breaks in graph text are flattened so issue content cannot add headings or sections. Do not put secrets or restricted customer data in any field.

## Live evidence

Write the live file fresh on every pass from T3 and PR reads; never from saved state. Without `verified` the board has no timestamp and warns:

```json
{"verified": "<UTC time of this pass>",
 "workers": {"<issue ID>": {"runtime": "<exact T3 runtime>", "verified": "<UTC>",
             "run": "<latest run ID and status, active run if any>", "pendingInput": 0, "settled": false,
             "evidence": "<message cursor, PR head, checks and reviews with source times>"}},
 "listing": {"project": "<projectId>", "coordinator": "<this Dispatch thread ID>",
             "snapshots": [{"at": "<UTC>", "statuses": ["running", "starting", "preparing", "queued", "waiting"],
                            "pages": [{"cursor": 0, "nextCursor": null, "total": 3,
                                       "threads": [{"threadId": "...", "title": "...", "status": "running", "link": "..."}]}]},
                           {"at": "<UTC, just before rendering>", "statuses": ["..."], "pages": ["..."]}]}}
```

`snapshots` holds the entry list then the final one, each page copied as `t3_thread_list` returned it; record `"error"` on a snapshot whose call failed. Without Beads, worker entries are keyed by thread and carry `thread`, `title` and `link`.

The final snapshot wins on runtime. It is complete only when its last page has no `nextCursor`, nothing failed, it read every one of `total` threads, and its statuses include every running state. The coordinator is dropped, and a thread repeated across pages counts once.
- A listed worker takes the list's status, so a resumed worker lands in Now as running. When that differs from its worker entry, the card says to reread its run, pending input and activity; update the entry and render again.
- A worker missing from a complete list is not running at that time.
- A listed Cooper with no issue gets an untracked Now card; one owned by an issue under another root goes to Watch and links as external. Other active threads are counted in a footnote, not as workers.
- An incomplete, failed or missing list makes running now a lower bound with the total unknown (`activeIsLowerBound` in the JSON result).

Include every open worker, closed issues without `t3.settled` too, and set `settled` from the thread's T3 state. An open worker with no live entry still goes in Now, marked unreconciled, and the running total becomes unknown, never zero by inference. The summary counts open Coopers (distinct worker threads in Now, plus uncertain launches) separately from those running now (`running`, `starting` or `preparing`; `queued` and `waiting` are open but not running); several cards for one worker count once. `external` cards are excluded from local worker counts.

## Illustrations

Supported forms:

```json
{"type":"buttons","before":"Unclear action","after":"Save changes"}
{"type":"screens","screens":[{"title":"Before","body":"Missing context"},{"title":"After","body":"Clear context","button":"Continue"}]}
{"type":"gesture","from":"Current tab","gesture":"Swipe left","to":"Next tab","note":"Proposed interaction"}
```

Use two or three screens. An optional `label` describes the sketch. These are explicitly labelled schematics, never screenshots. Illustrate only supported behavior or an explicitly proposed outcome. Do not fabricate measurements or product state.
