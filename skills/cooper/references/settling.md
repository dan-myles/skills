# Settling worker threads

The coordinator (Dispatch or Orchestrate) settles a worker thread after it processes the worker's final report. Workers report back and never settle themselves. A T3 coordinator's own thread stays active; a Grok Bot coordinator has no T3 thread to settle. Grok Bot reads use the saved Executor app/project for that worker.

## When a worker can be settled

Settle only when every check passes. Otherwise leave the thread active and write the reason on its board or unit row.

1. **You own it.** You launched this thread for this item or unit, and its brief is in your store. Never settle a thread you only attached to, the user's own thread, or a reused thread that owns other work just because this one request finished.
2. **The scope is done.** The report says it's final and meets the brief's ACCEPTANCE. A read-only investigation whose scope the user limited is done once the work they deferred is recorded as its own item.
3. **It's recorded.** The complete worker reply has been read, its report is saved in the coordinator's store, the row is updated, and every follow-up is its own row. A Grok Bot copies it onto the box with the source item/position marker. A repeat read must not create another worker.
4. **Nothing is still running or waiting.** Read the thread with `t3_thread_read` (activity view): no running turn and no queued message. Inspect exposed pending-request and queue tools for a question or queued message still waiting. Do not assume an idle run means an empty queue. Make sure none of its child tasks are still working. A finished model turn isn't completion while children still work.
5. **No PR is waiting on anything.** An open PR it owns that's still being built, reviewed, checked, babysat, or waiting on the user's merge decision keeps the thread active. A merge-ready PR waiting on the user is not a reason to settle. A merged or closed PR is.
6. **Its work is safe.** Its worktree has no uncommitted or unpushed changes (`git -C <worktree> status --porcelain`, `git -C <worktree> log @{u}..`), and any artifact the report points at is copied into your store. A Grok Bot cannot run these checks against a remote path as if it were local; obtain fresh worker-side evidence or a verified remote read interface. Inaccessible state or artifacts are not a pass. If anything is uncommitted, leave it active and flag it.
7. **Settle actions are safe.** Read the project's actions with `t3_project_read`. When one runs as a thread settles, such as a teardown that removes a dev stage, make sure it acts only on this worker's own worktree and resources and that nothing still needs them. A `delegate_task` child shares its parent's worktree, and settling it runs settle actions in the parent's worktree (T3 bug #17548). Don't settle a delegated child while its parent is active and the project has a settle action; it goes when the parent's work ends.

## How

- `t3_thread_organize` with `action: "settle"` and `threadId: <worker>`. Always pass the worker's `threadId`; leaving it out settles your own thread.
- A snoozed worker: `unsnooze` it first, since settling leaves it snoozed (T3 bug #16516).
- Note `settled <time>` on the row.
- Settling doesn't remove worktrees or branches. Pruning them is `playbooks/cleanup.md`, after its audit.

## Repeats and misses

- Process reports idempotently. A repeat report for a settled row changes nothing. For a T3 coordinator, genuinely new work retains the existing `unsettle` and handle path. A Grok Bot reconciles a late report against current ownership and scope before further action; separate scope or follow-up after settlement gets a fresh worker rather than restarting the old one.
- For T3 transport, a report file without its required notification is a delivery defect for the coordinator to reconcile. For Grok Bot transport, the T3 reply is the report; no direct T3 notification is expected. A user-triggered or Fleet-routed chase collects it. Neither transport skips the settlement checks.
