# Work items

Shared procedures for delivered work. Read the sections named by the active playbook. These procedures do not start Wayfinder.

## Triage

For each item not in `seen.tsv`:

1. **Read all of it:** the thread or issue, its replies, screenshots, logs, and links.
2. **Trace the cause enough to route it.** A bounded pass of `../../bob-how/SKILL.md` over the likely code path, and `../../bob-why/SKILL.md` when it looks like a regression, both on their "without subagents" path in this thread. A visible symptom alone isn't enough to pick a repo or area when the trace points elsewhere. If the code can't be read, or the trace needs more than a bounded read, say so, route conservatively, and propose a Bob Investigation thread.
3. **Classify:** bug, perf, feature, question, or noise. When bug versus feature is unclear, it's a question for the user, not a ticket.
4. **Dedupe** against the board, `seen.tsv`, and the tracker, by error signature, area, and source link. Prefer no ticket over a guessed or duplicate one.
5. **File** a clear, new bug in the tracker, linked back to its source. Don't set priority or assign anyone.
6. **Record** the row on the board and the item in `seen.tsv`.

## Decide

**Auto-dispatch** a bug when all of these hold, up to `auto_dispatch.per_run` per run and within `in_flight_cap`:

- it's confirmed: clear reproduction steps or an exact error signature
- it's in a repo in `config.yaml`
- the trace points to one area, a few files
- it doesn't touch auth, money, stored data, migrations, a public API, or `never_paths`
- **a second model confirmed it.** Launch a read-only validator Bob thread with `t3_thread_launch`: `modelSelection` from `dispatch.validator` in `~/.bob-n-frank/models.yaml`, the repo's project root with no worktree, title `bob: validate <the bug>`. Never use `delegate_task` or a subagent for this. Its brief gives the source, your triage, and the repo path. RULES: read-only, change no files, open no PR, ask no one. It checks the claim against the code, reproduces it when that's cheap, and writes CONFIRMED or REJECTED with one sentence and its evidence to `<state_dir>/reports/<id>-validate.md`. REPORT-BACK is this thread with `/dispatch report <id>-validate`. Record the validator's exact thread id in the row's note and leave the row `triaged` until it reports. Only CONFIRMED dispatches; REJECTED becomes a proposal with the validator's reason.

When an item's goal, right behavior, or scope is unclear, it isn't auto-dispatched.

**Grill before dispatching.** When the user picks a complex item that leaves several decisions only they can make, run `../../bob-grill/SKILL.md` with them in this thread before writing its brief, so the Bob thread starts from settled decisions. Paste the saved grill into the brief's CONTEXT.

Wayfinder is never selected by triage or task size. Only the user can invoke `/dispatch wayfinder`. An unresolved Wayfinder item cannot pass through auto-dispatch or ordinary approval as implementation work.

**Propose** everything else, ranked by impact against effort, each with a one-line reason. Ask once per brief per **How to ask** in `../../bob/SKILL.md`: a multi-select of the proposals, "Send it" for Dispatch's picks.

## Dispatch

- Write the brief per `../../bob/references/brief.md`, with REPORT at `<state_dir>/reports/<id>.md`. An auto-dispatched bug gets the headless RULES; an item the user approved gets the attended RULES, so its Bob thread asks the user at its own checkpoints.
- Launch a Bob thread with `t3_thread_launch`: `modelSelection` from `threads.bob` in `~/.bob-n-frank/models.yaml`, a new worktree off the repo's default branch, title `bob: <what it does>`, message `/bob <brief>`. A program too big for one thread gets an Orchestrate thread instead, on `threads.orchestrate`: `/bob orchestrate <program brief>`, titled the same way.
- Thread titles start with `bob: ` and then say what the work does in a few plain words, like `bob: add retry to market data fetch`. No ticket or issue IDs (`ENG-2919`, `#123`) in the title; they go in the brief's CONTEXT.
- Fill REPORT-BACK with this thread's id from its instance entry, or legacy `thread_id`, and the message `/dispatch report <id>`.
- Save the brief, set the row to `dispatched` with the exact worker thread id, and link the worker in the saved brief as `[thread title](t3-thread://v1/<exact-threadId>)`. Keep the id and actual title available for report processing and review handoffs.

## Track

For each `dispatched` row and each pending validator in the current scope: read its thread and its PR when it has one without disturbing the thread. Never message a Bob thread to check on it.

- A Wayfinder report follows `../playbooks/report.md` before any PR logic. Research completion is evidence, not a product decision or permission to build.
- A merge-ready PR moves the row to `merge-ready` and goes on the user's review list with its owning worker link and PR link, per **Review handoffs**. Preserve the report's worker identity when processing `/dispatch report`; recover missing identity from the board and live thread metadata.
- A thread waiting on the user goes under Fires.
- No new commit or PR change for `stalled_after_hours` gets flagged as stalled, with what it last did. For planning workers without a PR, use their last task, thread, or report update instead.
- A `done` worker row whose thread is still active gets settled once it passes the checks in `../../bob/references/settling.md`; a merge-ready PR waiting on the user keeps it active until the PR merges or closes.
- A report file with no report-back (its row still `dispatched`) is a defect: process the report now, and note in the brief which thread didn't report back.
