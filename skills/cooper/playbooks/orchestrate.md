# Orchestrate

You run the program, never the code. Decide which worker does each piece, then check what each one produces.

This is for work too big for one thread: many units, many PRs, few user turns. If one Cooper could finish it inside the budget, it isn't a program; sort it into the matching playbook instead.

Run it with T3's own tools and keep no store. The program's state is what T3 and GitHub show right now: the worker threads you launched, their replies, and their PRs. Call no scripts, run no polling loops, and never relay status between workers.

## Topology

- **This thread coordinates.** It frames, writes kickoffs, reads results, and decides. It never writes or edits product code; conflict fixes and restacks are units like any other.
- **One worker per unit, in its own worktree.** Start each with `t3_thread_launch`: title `cooper: <what the unit does>` in plain words, `modelSelection` `claude-opus-5-5` with `{effort: high}` on provider family `claudeAgent`, `workspaceStrategy: {type: "worktree", baseRef: <base>, branch: <unit branch>, startFromOrigin: false}`, and the kickoff as `message`. The worker runs Cooper's matching playbook, so it ships its own PR and babysits it to merge-ready. It's the only writer of its branch; only it pushes, rebases, or retargets.
- **One verifier per PR that isn't its author,** on the other model family: a `delegate_task` child using `gpt-6.1-sol` with `{reasoningEffort: high}` on provider family `codex`, per [launch mechanics](../references/delegation.md). It runs the checks and edits nothing. Its completion wakes this thread.
- **Two levels only:** this thread and its workers. Keep at most four workers in flight, since worktree threads run on this machine, and start the next as each finishes instead of waiting on a batch.

## The kickoff

A worker can't see this thread or its siblings, so the kickoff carries everything:

- `/cooper <the goal, one sentence a stranger could act on>`
- the playbook, the paths it may and may not write, its branch and base
- the user's decisions it must keep, word for word, and each upstream report it depends on, pasted in full
- **the evidence that proves it's done:** a command and its expected output, a verify-skill recipe, or an artifact. If you can't name it, the unit isn't scoped yet.
- what it must not do: merge, touch another unit's branch, fix things outside its paths
- how to report: "When your PR is merge-ready, or you're blocked on a decision, send your full report to thread `<this thread's id>` with `t3_thread_send`, `mode: "auto"`. Include the PR link, head SHA, what you ran and its output, and each decision the kickoff didn't make."

## Steps

1. **Frame.** Write the done condition as something countable ("all 40 call sites migrated, every PR verified and merge-ready"), the units, and the order they depend on. A contested split goes through `cooper-architect` first. A call that's the user's is a **Checkpoint**: grill it before anything launches. Show the plan per `references/visuals.md` and keep going.
2. **Start with one unit.** Take it through kickoff, worker, verifier, and a merge-ready PR before fanning out, so a flaw in the kickoff costs one worker instead of twenty.
3. **Fan out** up to the cap, refilling as workers report.
4. **On every report:** check the PR's live state with `gh pr view` and `gh pr checks`, not the report. Start its verifier at the current head. Send back work that drifted from scope or grew past it; park the rest as follow-ups. A decision that departs from what the user decided holds the unit as a **Checkpoint** with your pick.
5. **Land in order.** For stacked work, the lowest unmerged PR comes first. Workers stop at merge-ready; the user merges.
6. **Close.** Every unit you launched ends merge-ready, merged, replaced, or dropped with a reason. Settle each worker whose PR merged or closed with `t3_thread_organize` `settle`, passing its `threadId`; a merge-ready PR waiting on the user keeps its worker open.

## Supervision

- Read the diff or the artifact, not only the report. Green CI feeds a verdict; it isn't one. A verdict covers one head SHA, so a new push needs a new one.
- Judge a stalled or looping worker by its pushes and PR activity, not its status text. Never message a worker to check on it. Retry by cause: a smaller scope after a context limit, the same kickoff after a dropped connection, a fresh worker after a tool error. After two retries, drop the unit and replan around it.
- A worker that comes back late gets checked against the PR's current state; hand any unique findings to a fresh worker.
- After a restart or a summarized conversation, rebuild the picture from `t3_thread_list` (your `cooper:` workers), their latest replies, and `gh pr list`, never from memory.

## What reaches the user

Only real decisions and blockers: a call that's theirs, an irreversible action, a product question no experiment settles, a dead end that survived a replan. Rebase mechanics, retries, CI flakes, review triage, and "should I keep going" never do.

**Reply:** the done condition and the count against it, each PR's live state and verdict with its link and its worker's thread link, what was dropped and why, and the decisions waiting on the user. **Show:** units by state, and the stack bottom to top with verdicts.
