# Run

Drive one task to a finish line without stopping. The finish line is yours to define and yours to hold.

Use it when the user asks to keep going until something is true: "run until the tests pass", "loop until it's fixed", "keep at it until all callers are migrated". A whole program of many units is Orchestrate instead.

1. **Set the finish line.** Write it as something a command can check: tests green, the repro passes, zero old callers, a metric past its target. A duration isn't a finish line. Work in this task's own worktree. **Checkpoint:** show the finish line, the check that proves it, and how you'll attack it, per `references/visuals.md`, and ask per **How to ask**. After "Send it", don't ask again.
2. **Set up waking.** When an event will move things (CI finishing, a PR changing, a subagent returning), wait on it: `watch_pull_request` or a `delegate_task` completion. Otherwise, or as a fallback, schedule a heartbeat with `schedule_task` bound to this thread, `/bob run continue <slug>` as its prompt, sized to how often a result is worth checking. Open the log at `~/.bob/runs/<slug>/decisions.tsv` with the header `time, step, change, why, evidence, result`.
3. **Iterate.** Each round makes the smallest change the evidence supports, checks it against the finish line, commits it if it moved things forward, and reverts it if it didn't. A change that "might help" gets reverted, not kept. Check each change before the next, per `sequence-verifiable-units`. Log one row per round.
4. **Handle what you find.** Broken tooling, a flaky check, a related bug that blocks you: fix it, in its own commit or PR, and go back to the finish line. Anything that doesn't block goes to follow-ups. Bring the user only an irreversible action, a product call no experiment settles, or a real dead end.
5. **Don't stop early, don't cheat.** A plateau means change approach: reread the source, try a different kind of fix. Never loosen the finish line to call it done. When you're truly stuck, stop and say what you tried.
6. **Finish.** When the check passes, run it once more on a clean checkout, delete the heartbeat with `delete_scheduled_task`, then run **Opening the PR**.

`/bob run continue <slug>` resumes from the log: read its last rows, check the branch and PR, and carry on with the next round.

**Reply:** the finish line and its final state, rounds run, what was kept and what was reverted, follow-ups, the log path, and the PR link. **Show:** the finish-line check across rounds, kept and reverted marked, and the file map of what changed.
