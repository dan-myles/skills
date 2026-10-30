# Saved board data

Use the renderer shipped in this skill, not a per-project rewrite. The complete fictional fixture is [example-board.md](../assets/example-board.md). The renderer uses Python's standard library and embeds its sibling assets in one HTML file.

```sh
python3 <installed-dispatch>/scripts/render-board.py <state_dir>/board.md \
  --output /tmp/dispatch-board.html --project '<project>'
```

Read the JSON result for warnings. Correct missing evidence in owned Markdown before presenting. Missing fields remain visible gaps; HTML generation does not verify runtime or PR state. Keep derived output outside the store for read-only views. Never overwrite Markdown with HTML.

The file starts with `# <title>` and `Updated: <UTC timestamp>`. Use exactly these level-two headings, in order: `Now`, `Backlog`, `What landed`, `Watch and links`. Each card has a unique `### <stable ID>: <title>` heading. Use single-line bullet fields:

| Field | Meaning |
| --- | --- |
| `Summary` | One sentence describing the issue's user-visible outcome. |
| `Visual` | Two to four evidence-based cause/effect or before/after steps, separated by ` | `. Escape a literal pipe as `\|`. |
| `State` | Current execution and lifecycle; `execution: working` is supported within existing state strings. |
| `Gate` or `Gates` | Actual blocker, decision or acceptance condition. |
| `Worker` or legacy `Owner` | Exact owning T3 thread link. One owner per card; split separately owned work into separate cards. |
| `Runtime` | Exact live T3 runtime status, without translating idle/completed into finished work. |
| `Verified` | UTC timestamp of this pass's verification. |
| `Run` | Latest run ID/status and active run ID if present. |
| `Pending input` | Current request count and unresolved input, with restricted content omitted. |
| `Evidence` | Bounded activity/message cursor, current PR head/checks/reviews and source timestamps. |
| `Coordination` | `external` for cross-project coordination, excluded from local worker counts. |

Other bullet fields remain in collapsible evidence. Markdown links, bare HTTPS URLs and `<t3-thread://...>` links become prominent card links. Relative artifact links resolve against board.md's directory. Do not put secrets or restricted customer data in any field.

Optional `Illustration` is a single JSON object on one line. Supported forms:

```json
{"type":"buttons","before":"Unclear action","after":"Save changes"}
{"type":"screens","screens":[{"title":"Before","body":"Missing context"},{"title":"After","body":"Clear context","button":"Continue"}]}
{"type":"gesture","from":"Current tab","gesture":"Swipe left","to":"Next tab","note":"Proposed interaction"}
```

Use two or three screens. An optional `label` describes the sketch. These are explicitly labelled schematics, never screenshots. Illustrate only supported behavior or an explicitly proposed outcome. Do not fabricate measurements or product state.

Section totals count issue cards. The distribution chart shows those counts, not completion. Active workers count distinct local owner links with verified `running`, `starting` or `preparing` runtime. Queued and waiting are separate runtime states. Multiple cards for one worker count once. External coordination is separate. Missing runtime evidence makes the total active count unknown, never zero by inference. `Verified` is recorded evidence, not a freshness guarantee; agents must reconcile it on each status/chase.
