# Project state

Dispatch keeps project state in the repository's Beads graph on the shared Dolt server. Beads holds the work, its dependencies, ownership, briefs, reports, decisions and history. T3 runs workers and carries notifications. GitHub holds PR truth. Nothing else is a second source of truth: no saved board, journal or report files.

Read `bd prime` and `bd <command> --help` for command syntax; this file is the policy. Where `bd prime`'s workflow text conflicts with these rules (TodoWrite bans, `bd remember`, git push protocol), these rules win. Always pass explicit issue IDs and use `--json` when parsing. Never use `bd edit`.

## Workspace

A repository is onboarded when its committed `.beads/config.yaml` and `.beads/metadata.json` point at the shared server database for that repository. Credentials never enter the repository; each machine keeps its own in the Beads credentials file. T3 worktrees resolve the root checkout's `.beads/` through Git, so workers need no setup. Never run `bd init` outside an explicit [setup](../../dispatch-setup/SKILL.md), and report a stray `.beads/` inside a worktree instead of using it.

At the start of every run, check `bd where` and `bd context` resolve the committed server database, not an embedded or newly created one. An unreachable server, wrong database or missing credentials is an access gate: inspect nothing further, launch nothing, and never create a local graph to work around it.

A schema-version refusal is a coordination stop. Never set `BD_IGNORE_SCHEMA_SKEW`, pass `--ignore-schema-skew`, grant `BD_ALLOW_REMOTE_MIGRATE`, or run `bd migrate`, `bd doctor --fix`, `bd bootstrap` or a forced init to get past it. Report it with `bd version` and the refusal; the user upgrades clients and migrates once, per the loadout's Beads notes. Leave `node_id` unset; every machine on the shared server is one replica.

## Actors

Every write names its actor with `--actor`, because shell environment does not persist between tool calls and closing checks the assignee.

| Actor | Who |
| --- | --- |
| `dispatch:<exact owner thread ID>` | The current Dispatch owner |
| `cooper:<issue ID>-a<attempt>` | A Dispatch-launched worker, known before launch |
| `cooper:<exact thread ID>` | A standalone Cooper |
| `dan` | Writes the user makes or dictates |

## The Dispatch root

Each Dispatch owns one root issue: type `epic`, status `pinned`, label `dispatch`, assigned to its owner actor. Its title names the repository and purpose. Metadata records:

- `dispatch.initial_thread`: the exact ID of the thread that created it, kept forever
- `dispatch.owner_thread`, `dispatch.owner_link`, `dispatch.owner_user`: the current owner
- `dispatch.repository`: credential-free canonical repo identity, checked against the checkout
- `dispatch.owner_source`: the user message or handoff that granted ownership, with UTC time

The root's description holds the working rules as labelled lines: in-flight cap (default 4), stalled-after hours (default 24), contained-bug auto-dispatch (default enabled, at most 3 per pass), never paths, evidence sources (delivered items only; email/calendar disabled), external tracker mirror (for example Linear, or none), validator selection, and standing orders with their sources. Beads is the tracker; an external mirror is linked with `--external-ref` and follows its own repo rules. Missing validator access disables contained-bug auto-dispatch. Models live in the launching skills, not here.

Resolve this thread's root as the unique pinned `epic` labelled `dispatch` and assigned to `dispatch:<this thread>` (`--type epic --status pinned`), or an explicitly named one. Several matches need a choice. A root owned by another thread is read-only until explicit takeover. Several independent Dispatches can share one repository database; each coordinates only its root's descendants and flags overlapping work rather than touching it.

## Items

Every coordinated item is a descendant of the root: a direct child, or a child of a Wayfinder map or program epic under it. `bd create --parent` copies the parent's labels unless told not to, which would leak `dispatch` and `approved`; always pass `--no-inherit-labels`. Use the type that fits: `bug`, `feature`, `task`, `chore`, `spike` for investigations and validators, `epic` for maps and programs, `decision` for questions and binding user decisions.

| Field | Holds | Written by |
| --- | --- | --- |
| Title | Specific, action-oriented outcome | Dispatch |
| Description | Why, sourced context, scope, forbidden actions; the brief's body | Dispatch |
| Design | Approach and the DECIDED decision IDs it must keep | Dispatch |
| Acceptance | Checkable outcomes that hold whatever the solution | Dispatch |
| Notes | Current state only, overwritten: `COMPLETED:`, `IN PROGRESS:`, `NEXT:`, `KEY DECISION:` | Owning worker |
| Comments | Append-only log: launch records, reports, handoffs, gate answers | Anyone, with actor |
| Priority | Proposed rank, 0 to 4 | Dispatch |

Labels carry coordination state:

- `triage`: delivered or discovered, not yet decided. `approved`: authorized to launch, added only by Dispatch with a comment naming the authorization source. Proposals carry neither and wait for the user.
- `human`: needs the user. `merge:auto` or `merge:human`: the brief's merge policy. `merge-ready`: the PR is waiting only on a merge.
- `external` for cross-project coordination, `watch` for risks and provenance, `dropped` on anything closed without landing (abandoned, superseded, dismissed), `wayfinder` on maps and their tickets, `plan-ready` on a finished map.

Metadata keys, all optional: `source.url`, `source.id` (dedupe key), `source.sender`, `source.milestone`; `attempt`; `t3.request`, `t3.thread`, `t3.link`, `t3.title`, `t3.environment`, `t3.project`, `t3.cursor`; `model`; `branch`; `pr.url` (comma-separated for a stack, bottom first), `pr.head`; `merge.sha` (comma-separated for a stack); `board.summary`, `board.visual`, `board.illustration` for [the board](board-data.md).

Dependencies: `blocks` only for real prerequisites, since it controls `bd ready`. `discovered-from` records where follow-up work was found. `related` links a decision to the items it affects. `supersedes` replaces an issue. A new item stays blocked until each prerequisite closes with accepted evidence.

## Lifecycle

| Situation | Graph state |
| --- | --- |
| Delivered or discovered | open, `triage` |
| Proposed to the user | open, no `approved` |
| Authorized | open, `approved` |
| Launch pending | assigned to the worker actor, `t3.request` set, no `t3.thread` |
| Worker running | in_progress, claimed by the worker |
| Waiting on the user | blocked by an open `human` decision |
| PR waiting on a `human` merge | in_progress, `merge-ready`, blocked by the worker's `gh:pr` gate, with a `related` `human` decision |
| Done | closed with a reason naming the merge or accepted findings |
| Abandoned or superseded | closed, `dropped`, reason quoting the user or naming the replacement |

Execution status (running, idle, waiting on input) is never stored; it comes from live T3 reads each pass. A model turn ending does not change graph state.

## Who writes what

Dispatch creates and approves items, sets priority, dependencies, assignment, merge policy and board metadata, records decisions, and resolves gates the user answers. It edits only its root's descendants.

A worker writes only its own issue and the issues it creates: it claims it, overwrites its notes, sets `branch`, `pr.url`, `pr.head` and `merge.sha`, posts reports as comments, may upgrade `merge:auto` to `merge:human` but never back, files follow-ups with `discovered-from` and `triage`, opens `human` decision issues that block its own issue (a merge decision is `related` instead, so the merge itself can close the work), creates and resolves a `gh:pr` gate for a PR waiting on a `human` merge, and closes its issue when its PR merges. Workers never add `approved`, edit the root or another item, reassign, `reclaim`, `unclaim`, use `--force`, or run `bd remember`, `bd dolt push`, init, migrate or doctor fixes.

A worker closes its issue when its own PR merges. Everything else Dispatch closes after accepting it: no-PR investigations, validators, Wayfinder tickets, and work whose worker is settled, inaccessible or replaced. Because closing checks the assignee, Dispatch first does a guarded reassign to itself (`--if-assignee <worker actor> --assignee <dispatch actor>`). A guard exit of 13 means another writer moved first: re-read, never retry blindly.

Leases are not liveness. Workers do not heartbeat; nothing runs `bd reclaim` on a timer. Dispatch releases a claim only after live T3 evidence shows the worker is stopped, settled or replaced, with `bd unclaim <id> --if-assignee <worker actor> --actor <dispatch actor>`, which reopens the issue for a new attempt.

## Decisions

A question for the user is a `decision` issue under the root, labelled `human`, with the options and recommendation in its description, blocking the work that waits on it. Record the user's answer with `bd human respond` (or a comment then close), quoting their exact words, source thread or message and UTC time; then link it `related` to every item it affects. Closed decision issues are binding until the user supersedes them with a new decision (`bd supersede`). A worker's recommendation is not a decision. Unknown sources stay unverified and grant no authority.

## Reports and history

A worker's complete report is its T3 reply. It also posts a shareable copy as a comment on its issue. Dispatch reads the reply, checks the comment matches, and posts a sanitized copy with provenance if the worker could not. `t3.cursor` records the last processed source item and position so a repeat notification changes nothing.

Dolt history, comments and `bd history <id>` replace the journal. Comment launch requests and results, follow-ups, accepted or rejected reports, PR head changes, handbacks and the last successful chase. Never rewrite earlier comments; append corrections.

## Takeover

Ownership is the root's assignee, so takeover is one guarded update, not a Git ritual:

1. Read the root, its descendants, open decisions and pending launches. Verify repository and initial thread metadata; never repair malformed identity by inventing one.
2. Get explicit user authorization naming this root, plus evidence the old owner has stopped. Without that assurance, stay read-only or start an independent root.
3. `bd update <root> --if-assignee dispatch:<old> --assignee dispatch:<new>` with the new owner metadata and source, then comment the handoff: old and new owners, reason, source, known access gaps. Exit 13 means the old owner or someone else changed it; stop and reconcile with the user.
4. Pin the new Dispatch thread. Leave the former thread as provenance.
5. Read known workers through the routing this user has. An inaccessible worker stays gated with its last verified evidence; never label it dead, done or freshly verified.
6. For an accessible active worker, reconcile its report first, then send a concrete `t3_thread_send` handoff updating REPORT-BACK to the new owner. Original issue fields stay; append the handoff as a comment.
7. A replacement worker needs explicit authorization and evidence the prior one is stopped or isolated. Give it a new attempt and actor; keep the old attempt's comments. A late report from the old owner or worker is evidence only.

## Shareable content only

The graph is shared with every machine, worker and user on the server. Exclude secrets, credentials, connection URLs with tokens, customer or private data, machine-specific absolute paths and raw environment dumps. Keep sanitized evidence, public or authorized links and exact thread identities. Keep restricted material in its authorized system, reference it, and record the gap.

## Legacy stores

Existing `.dispatch/<id>/` Git stores stay untouched. Read them for context; never write, push or delete them. Migrating one into Beads happens only on an explicit request: create the root and items from its board, keep its IDs as `legacy.id` metadata, paste decisions verbatim with their sources, and leave the Git store in place as provenance.
