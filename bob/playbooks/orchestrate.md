# Orchestrate

You own the program, never the code. You write briefs, drain results, keep the PRs moving, and decide. Workers build.

This is for a whole project handed to one standing T3 thread: many units, many PRs, days of work, with the user checking in a few times a day. If one Bob thread could finish it inside the budget, it isn't a program; sort it into the matching playbook instead.

Three rules carry the rest:

- **The brief is the product.** A worker can't ask you anything, so a vague brief fails quietly.
- **Every spawn carries the standing orders word for word.** Instructions that aren't repeated decay.
- **Completions are queue events.** Handle them in batches at drains, never inline mid-thought.

## Roles

- **Coordinator: this thread.** Frames the program, writes briefs, drains, reports to the user, makes judgment calls. It never writes or edits product code. Conflict fixes, restacks, and code changes are units with briefs like any other.
- **Workers: Bob threads in their own worktrees.** Start each with `t3_thread_launch`, `workspaceStrategy: {type: "worktree", baseRef: <base>, branch: <unit branch>, startFromOrigin: false}`, and the brief as `message`. One writer per worktree and branch, per `separate-before-serializing-shared-state`. A worker runs Bob's matching playbook, babysits its own PR to merge-ready, and stops.
- **Verifiers: `delegate_task` children,** read-only, on `bob.verifier` in `../bob-models/models.yaml` so they run on the other model family from the workers, started per `../bob-models/references/delegation.md`. Their completion wakes this thread on its own.
- **Research or design units** that don't write code can also be `delegate_task` children.

Keep it two levels deep: coordinator and workers. Split a program into tracks (build, landing, verification are common cuts), but don't add sub-coordinators unless one drain can't keep up with the tracks.

## The store

One folder per program, outside every repo: `~/.bob/orchestrate/<program-slug>/`. Every file has one writer: you, except `reports/`, where each worker writes only its own file.

- `standing-orders.md`: numbered lines, one constraint each (merge policy, verification bar, forbidden paths, in-flight cap, models, escalation). When you catch yourself restating an instruction, add a line first, per `encode-lessons-in-structure`. A stop line at the top halts new spawns.
- `units.tsv`: one row per unit: id, track, state (`planned`, `running`, `needs-verify`, `verified`, `merge-ready`, `landed`, `failed`, `abandoned`), thread id, branch, PR, head SHA, brief path. Update rows in place.
- `briefs/<unit>.md`: the exact brief each unit got.
- `reports/<unit>.md`: each worker's final report.
- `ledger.tsv`: one verdict per PR and head SHA: `live-verified`, `test-verified`, `type-check-only`, `verifier-blocked`, `verifier-failed`. A new head SHA voids the row.
- `frontier.md`: for stacked work, the PRs bottom to top with head SHAs, and the lowest unmerged one.
- `gates.md`: decisions only the user can make: the question, the options, your pick, and what happens with no answer.
- `decisions.tsv`: one row per decision: time, phase, decision, why, evidence, result. Append only.

## The brief

Every field filled, or the unit isn't scoped yet and doesn't spawn. Size it to the unit: a one-command unit gets a paragraph that still names the goal, scope, check, and report.

```
/bob <goal, one sentence a stranger could act on>

PLAYBOOK     which Bob playbook fits (Feature, Bug, Refactor, Perf)
SCOPE        paths this unit may write, paths it may not, its branch and base
CONTEXT      files and PRs to read; upstream reports pasted in full, since workers can't see each other
ACCEPTANCE   checkable criteria, one per line
VERIFY       exact commands or the verify-<app> recipe, plus known gotchas
TIMEBOX      rough cap; on expiry, report what you have and stop
RULES        You were started by an orchestrator, not a person. Skip checkpoints; the design is approved
             in CONTEXT. Don't ask the user anything: when a decision isn't yours, stop and report it as a
             gate. Babysit your PR to merge-ready, then stop. Never merge, rebase, force-push, or retarget.
             Don't settle or archive this thread. No fixes outside SCOPE; note them as follow-ups.
REPORT       write ~/.bob/orchestrate/<program>/reports/<unit>.md and end with the same text: status,
             branch, head SHA, PR, what you ran and its output, deviations, gates, follow-ups
STANDING     <standing-orders.md pasted word for word>
```

A dependency means passing context, not just ordering: paste the upstream report into the downstream brief.

## Steps

1. **Frame.** Write the done condition as something countable ("all 40 call sites migrated, every PR `test-verified` or better and merge-ready"). Size it: units, rough effort, tracks, and the wall-clock budget. Set the merge policy: by default workers stop at merge-ready and the user lands; the coordinator merges only if the user says so in the standing orders. A contested split or a one-way door goes through `bob-architect` first. **Checkpoint:** show the plan per `references/visuals.md` (tracks, units, file map of what changes, budget) and ask per **How to ask** in the skill.
2. **Set up.** Create the store, write the standing orders, and schedule a heartbeat with `schedule_task` (`{type: "interval", everyMs: 900000}`, bound to this thread) whose prompt is "/bob orchestrate drain <program>: store at ~/.bob/orchestrate/<program>/". The store path in the prompt is what lets a coordinator with no memory find its way back. Seed `frontier.md` from existing PRs.
3. **Pilot.** Push one unit all the way through: brief, worker, verifier, ledger row, merge-ready PR. Fix the brief template, the check, or the unit size from what the pilot shows before fanning out. For many near-identical cheap units, the first unit is the pilot and fan-out starts when it lands.
4. **Scale.** Keep a rolling window of workers up to the in-flight cap (default 4, since worktree threads run on this machine; raise it in the standing orders) and refill as units finish. Don't wait for a whole batch. Pass upstream reports into downstream briefs.
5. **Drain** on every wake: the heartbeat, a verifier finishing, a watched PR changing, or a user message.
   - Read each running worker without disturbing it: `t3_thread_read`, its report file, `gh pr view`. Never message a worker to check on it.
   - Classify each: landed, merge-ready, needs-verify, failed, stuck, or noise. Update `units.tsv`, `ledger.tsv`, and `frontier.md`.
   - A finished unit that needs judgment gets a verifier unit. Don't review diffs inline.
   - Spawn the next units in one turn, then end the turn with a status board: counts by state, what changed, open gates.
6. **Land, continuously.** Keep the lowest unmerged PR green before work above it. Workers never rebase; a conflict or restack is a unit with its own brief. Merge only under the merge policy, and only PRs whose current head SHA has a passing ledger row.
7. **Close.** Drain one last time. Every spawned unit ends in a final state (landed, merge-ready, abandoned with a reason). Check the done condition on the real product. Delete the heartbeat with `delete_scheduled_task`. Turn recurring corrections into standing orders or brief changes. Leave the store as the record.

## Verification

Scale it to the unit. When VERIFY is one cheap command, the worker runs it and reports the output, and you spot-check. A verifier unit is for checks that are expensive, need judgment, or reach far (`bob-blast-radius` territory). CI green feeds a verdict; it isn't one. Behavior changes need better than `type-check-only`. `verifier-failed` gets a fix unit. `verifier-blocked` gets a respawn once the environment is fixed.

## Resume

The thread forgets; the store doesn't. Every drain writes its tables before the turn ends, so a restart loses at most the drain in progress. Resume whenever you wake without the program in mind (after a restart, a summarized conversation, or in a new thread), or when the user types `/bob orchestrate resume <program>`.

1. Read `standing-orders.md`, `units.tsv`, `gates.md`, `frontier.md`, and the last rows of `decisions.tsv`.
2. Check every `running` unit against the real thing, by its thread id, branch, and PR, never from memory:
   - Its report file exists: drain it like any finished unit.
   - Its thread is idle with no report: the run was cut off. Start a fresh worker from `briefs/<unit>.md` plus "continue from branch `<branch>`". Don't trust the half-finished run's claims.
   - Its PR moved (new commits, merged, closed): update the tables.
3. Check the heartbeat with `list_scheduled_tasks`. Recreate it if it's gone.
4. Append a `resume` row to `decisions.tsv`, then drain as usual.

## When things go wrong

- A worker that went quiet: check its thread, branch, and PR. If it's dead, write what you know into its unit row and replan. Don't wait for everything to settle.
- Retry by cause: too big, respawn with a smaller scope; flaky infrastructure, retry as is; tool errors, retry on another model. Two retries, then abandon the unit and plan around it.
- A worker that comes back late: check its work against the current frontier and ledger before accepting anything.
- When spawning more would produce garbage (bad upstream output, broken checks, dead infrastructure), write a stop line at the top of the standing orders, let running units finish, fix the cause, then clear it.
- Your own tools keep failing: stop retrying, write what's done and how to resume into `decisions.tsv`, and hand back.

## What reaches the user

Only, and batched into the status board: irreversible actions, product calls no experiment settles, a standing order that contradicts what you're seeing, and a dead end that survived a replan. Write each into `gates.md` first and keep other work moving around it. Ask per **How to ask** in the skill.

Never: retries, CI flakes, review-thread triage, restack mechanics, or "should I keep going".

Mid-program discoveries get fixed only when they block the frontier. Everything else goes to follow-ups.

**Reply** at checkpoints, drains the user asked about, and close: the done condition and the count against it from `units.tsv` and `ledger.tsv`, each track and what it landed, the frontier, verdicts, what was abandoned and why, open gates, and the store path. Numbers from the tables, not narrative. **Show:** a board of units by state per track, the frontier with its verdicts, and gates on top; at close, the file map of everything that changed.
