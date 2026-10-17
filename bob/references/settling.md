# Settling worker threads

The coordinator (Frank or Orchestrate) settles a worker thread after it processes the worker's final report. Workers report back and never settle themselves. The coordinator's own thread stays active. In Synara, settling a standalone worker means archiving it; a Hub worker's slot is the Hub's to release.

## When a worker can be settled

Settle only when every check passes. Otherwise leave the thread active and write the reason on its board or unit row.

1. **You own it.** You started this thread for this item or unit, and its brief is in your store. Never settle a thread you only read, the user's own thread, or a reused thread that owns other work just because this one request finished.
2. **The scope is done.** The report says it's final and meets the brief's ACCEPTANCE. A read-only investigation whose scope the user limited is done once the work they deferred is recorded as its own item.
3. **It's recorded.** The report is saved in your store, the row is updated, and every follow-up is its own row.
4. **Nothing is still running or waiting.** `synara_read_thread` shows no running turn, and its status isn't `waiting-for-approval` (for Hub work, `needsYou` is false). Its own children are finished: `synara_list_threads` with `parentThreadId` set to the worker lists none still working. A finished model turn isn't completion while children still work.
5. **No PR is waiting on anything.** An open PR it owns that's still being built, reviewed, checked, babysat, or waiting on the user's merge decision keeps the thread active. A merge-ready PR waiting on the user is not a reason to settle. A merged or closed PR is.
6. **Its work is safe.** Its worktree has no uncommitted or unpushed changes (`git -C <worktree> status --porcelain`, `git -C <worktree> log @{u}..`), and any artifact the report points at is in your store or the Library. If anything is uncommitted, leave it active and flag it.

## How

- **Standalone worker:** `synara_set_thread_archived` with `threadId: <worker>` and `archived: true`. Always pass `threadId`; leaving it out archives your own thread.
- **Hub worker:** don't archive it. The Hub releases the slot once the work item has its result; record `settled <time>` when `synara_project_get_overview` shows the worker's `settledAt`. If the Hub keeps a worker that passes every check open for a day, say so in the brief instead of forcing it.
- A child thread a worker started (`bob child: …`) belongs to that worker, which archives it; archive leftovers only after the worker is settled.
- Archiving doesn't remove worktrees or branches. Pruning them is `../playbooks/cleanup.md`, after its audit.

## Repeats and misses

- Process reports idempotently. A repeat report for a settled row changes nothing unless it reports new work; then unarchive the thread (`archived: false`) and handle the work.
- A report file with no report-back is still a defect for the sweep or heartbeat to catch. Settle that thread only after the same checks.
