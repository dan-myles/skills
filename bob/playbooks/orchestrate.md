# Orchestrate

You own the program, never the code. You write briefs, drain results, keep the PRs moving, and decide. Workers build.

This is for a whole project handed to one standing Synara thread, best a Hub coordinator: many units, many PRs, days of work, with the user checking in a few times a day. If one Bob thread could finish it inside the budget, it isn't a program; sort it into the matching playbook instead.

Three rules carry the rest:

- **The brief is the product.** A worker can't ask you anything, so a vague brief fails quietly.
- **Every spawn carries the standing orders word for word.** Instructions that aren't repeated decay.
- **Completions are queue events.** Handle them in batches at drains, never inline mid-thought.

Find this thread's role per `../references/synara.md` first. As a **Hub coordinator**, the Hub queues workers, caps them, wakes this thread when one reports, and owns retries; the store is Hub documents. As a **standalone** thread, this thread starts and watches workers itself and keeps the store on disk.

## Roles

- **Coordinator: this thread.** Frames the program, writes briefs, drains, reports to the user, makes judgment calls. It never writes or edits product code. Conflict fixes, restacks, and code changes are units with briefs like any other.
- **Workers: Bob threads in their own worktrees.** Title each `bob: <what the unit does>`, in plain words, with no ticket or issue IDs. Start every new unit of a drain in one `synara_create_threads` call (a turn gets one creation plan): per unit `target` from `threads.bob` in `~/.bob-n-frank/synara/models.yaml`, `environment: "worktree"`, `baseRef: <base>`, `projectId` of the repo, `contextMessageIds` of the user's messages that set up the program, and the brief as `prompt`. Synara picks the worktree's branch name, so the brief's SCOPE names the unit branch and the worker switches to it first. One writer per worktree and branch, per `separate-before-serializing-shared-state`. A worker runs Bob's matching playbook, babysits its own PR to merge-ready, and stops.
- **Verifiers:** read-only units on `bob.verifier`, so they run on the other model family from the workers, with a brief that says read-only and names what to check. As a Hub coordinator they're Hub work like any unit; standalone, start them per `../../bob-models/references/delegation.md`.
- **Research or design units** that don't write code are started the same way as verifiers.

Keep it two levels deep: coordinator and workers. Split a program into tracks (build, landing, verification are common cuts), but don't add sub-coordinators unless one drain can't keep up with the tracks.

## The store

One store per program, outside every repo. As a Hub coordinator it's Hub documents under `orchestrate/<program-slug>/`, written with `synara_project_write_document` and the revision you last read, and workers' reports land in the Library under the same folder. Standalone it's `~/.bob-n-frank/synara/orchestrate/<program-slug>/`. Every file has one writer: you, except `reports/`, where each worker writes only its own file.

- `standing-orders.md`: numbered lines, one constraint each (merge policy, verification bar, forbidden paths, in-flight cap, models, respawn policy, escalation). When you catch yourself restating an instruction, add a line first, per `encode-lessons-in-structure`. A stop line at the top halts new spawns.
- `units.tsv`: one row per unit: id, track, state (`planned`, `queued`, `running`, `needs-verify`, `verified`, `merge-ready`, `landed`, `failed`, `abandoned`), work item id (Hub), thread id, branch, PR, head SHA, brief path. Update rows in place. A unit is `queued` until Synara shows its worker working; never report queued units as running.
- `briefs/<unit>.md`: the exact brief each unit got.
- `reports/<unit>.md`: each worker's final report.
- `ledger.tsv`: one verdict per PR and head SHA: `live-verified`, `test-verified`, `type-check-only`, `verifier-blocked`, `verifier-failed`. A new head SHA voids the row.
- `frontier.md`: for stacked work, the PRs bottom to top with head SHAs, and the lowest unmerged one.
- `gates.md`: decisions only the user can make: the question, the options, your pick, and what happens with no answer.
- `decisions.tsv`: one row per decision: time, phase, decision, why, evidence, result. Append only.

## The brief

Write every brief per `../references/brief.md`, headless RULES, with REPORT for `<unit>`, STANDING set to `standing-orders.md` word for word, and saved to `briefs/<unit>.md`. As a Hub coordinator, REPORT points at the Library's `orchestrate/<program>/reports/<unit>.md` and there's no REPORT-BACK; the Hub wakes this thread. Standalone, REPORT is `~/.bob-n-frank/synara/orchestrate/<program>/reports/<unit>.md` and REPORT-BACK is this thread's id (`synara_context`) with the message `/bob orchestrate drain <program>`.

## Steps

1. **Frame.** Write the done condition as something countable ("all 40 call sites migrated, every PR `test-verified` or better and merge-ready"). Size it: units, rough effort, tracks, and the wall-clock budget. Set the merge policy: by default workers stop at merge-ready and the user lands; the coordinator merges only if the user says so in the standing orders. Set the respawn policy the same way: a failed or cut-off unit gets a new worker only with the user's yes, either per unit or as a standing order they approve here ("respawn a failed unit up to twice"). A contested split or a one-way door goes through `bob-architect` first. **Checkpoint:** show the plan per `references/visuals.md` (tracks, units, file map of what changes, budget, and, standalone, the heartbeat it will schedule) and ask per **How to ask** in the skill.
2. **Set up.** Create the store, record this thread's id (`synara_context`) in `coordinator.txt`, write the standing orders, and seed `frontier.md` from existing PRs. As a Hub coordinator, the Hub's own wakes are the heartbeat; save a note with `synara_project_remember` naming the program and its store, so a coordinator with no memory finds its way back. Standalone, create the heartbeat the user approved at Frame per **Automations** in `../references/synara.md`: `mode: "heartbeat"` on this thread, `schedule: {type: "interval", everySeconds: 900}`, name `Drain <program> program`, prompt "/bob orchestrate drain <program>: store at ~/.bob-n-frank/synara/orchestrate/<program>/", `completionPolicy` stopping once `standing-orders.md` says the program is closed, and `maxIterations` sized to the budget. The store path in the prompt is what lets a coordinator with no memory find its way back.
3. **Pilot.** Push one unit all the way through: brief, worker, verifier, ledger row, merge-ready PR. Fix the brief template, the check, or the unit size from what the pilot shows before fanning out. For many near-identical cheap units, the first unit is the pilot and fan-out starts when it lands.
4. **Scale.** Keep a rolling window of workers up to the in-flight cap (default 4, since worktree threads run on this machine; raise it in the standing orders, never past the Hub's `maxConcurrentWorkers`) and refill as units finish. Queued units count against the cap. Don't wait for a whole batch. Pass upstream reports into downstream briefs.
5. **Drain** on every wake: a Hub result, the heartbeat, a report-back, or a user message.
   - Workers report the moment they finish, so most drains start from a Hub wake or a report-back message; the heartbeat is the backstop. A report whose unit is still `running` means the wake never came: drain it and note the defect.
   - Read each unit without disturbing it: `synara_hub_list_work` (state, progress checklist, result) as a Hub coordinator, or `synara_read_thread` standalone; its report; `gh pr view`. Move `queued` to `running` only when Synara shows it working. Never message a worker to check on it.
   - Classify each: landed, merge-ready, needs-verify, failed, stuck, or noise. Update `units.tsv`, `ledger.tsv`, and `frontier.md`.
   - A finished unit that needs judgment gets a verifier unit. Don't review diffs inline.
   - Settle each worker whose unit reached a final state (landed, abandoned, or a closed PR) per `references/settling.md`. A merge-ready PR waiting on the user keeps its worker active. The coordinator never settles itself.
   - Spawn the next units in one `synara_create_threads` call, then end the turn with a status board: counts by state (queued apart from running), what changed, open gates.
6. **Land, continuously.** Keep the lowest unmerged PR green before work above it. Workers never rebase; a conflict or restack is a unit with its own brief. Only one unit per stack may change its shape (rebase, force-push, retarget a base, merge) at a time, so two of them never fight over the same branches. Record which unit holds a stack in `standing-orders.md`, and clear it when that unit finishes. Stacks are plain `gh` branches, each PR based on its parent's; no Graphite. Merge only under the merge policy, and only PRs whose current head SHA has a passing ledger row.
7. **Close.** Drain one last time. Every spawned unit ends in a final state (landed, merge-ready, abandoned with a reason). Settle every worker that passes `references/settling.md`; list the ones left active and why. Check the done condition on the real product. Delete the heartbeat with `synara_cancel_automation` (`mode: "delete"`) if it hasn't retired itself. Turn recurring corrections into standing orders or brief changes. Leave the store as the record.

## Verification

Scale it to the unit. When VERIFY is one cheap command, the worker runs it and reports the output, and you spot-check. A verifier unit is for checks that are expensive, need judgment, or reach far (`bob-blast-radius` territory). CI green feeds a verdict; it isn't one. Behavior changes need better than `type-check-only`. `verifier-failed` gets a fix unit. `verifier-blocked` gets a respawn once the environment is fixed.

## Resume

The thread forgets; the store doesn't. Every drain writes its tables before the turn ends, so a restart loses at most the drain in progress. Resume whenever you wake without the program in mind (after a restart, a summarized conversation, or in a new thread), or when the user types `/bob orchestrate resume <program>`.

1. Read `standing-orders.md`, `units.tsv`, `gates.md`, `frontier.md`, and the last rows of `decisions.tsv`.
2. Check every `running` unit against the real thing, by its thread id, branch, and PR, never from memory:
   - Its report file exists: drain it like any finished unit.
   - Still queued, or the Hub is retrying it: leave it; the Hub owns retries.
   - Its thread is idle with no report, or the Hub finished it without one: the run was cut off. Mark it `failed` and respawn it only under the respawn policy: a fresh worker from `briefs/<unit>.md` plus "continue from branch `<branch>`". Otherwise put it in `gates.md`. Don't trust the half-finished run's claims.
   - Its PR moved (new commits, merged, closed): update the tables.
3. Standalone, check the heartbeat with `synara_list_automations`. If it's gone while the program is open, recreate it as approved at Frame.
4. Append a `resume` row to `decisions.tsv`, then drain as usual.

## When things go wrong

- A worker that went quiet: check its thread, branch, and PR. If it's dead, write what you know into its unit row and replan. Don't wait for everything to settle.
- Retry by cause, within the respawn policy: too big, respawn with a smaller scope; flaky infrastructure, retry as is; tool errors, retry on another model. Two retries, then abandon the unit and plan around it. A creation that failed before Synara accepted it may be corrected and resent with the same `requestId`; once it has an `operationId`, retries resend that exact plan, and the Hub's own retries are never doubled.
- A worker that comes back late: check its work against the current frontier and ledger before accepting anything.
- When spawning more would produce garbage (bad upstream output, broken checks, dead infrastructure), write a stop line at the top of the standing orders, let running units finish, fix the cause, then clear it.
- Your own tools keep failing: stop retrying, write what's done and how to resume into `decisions.tsv`, and hand back.

## When the user asks what's running

Show the **Activity board** per `references/visuals.md`, built from `units.tsv` and the live threads and PRs, with each track as a group.

## What reaches the user

Only, and batched into the status board: irreversible actions, product calls no experiment settles, a standing order that contradicts what you're seeing, and a dead end that survived a replan. Write each into `gates.md` first and keep other work moving around it. Ask per **How to ask** in the skill.

Never: retries, CI flakes, review-thread triage, restack mechanics, or "should I keep going".

Mid-program discoveries get fixed only when they block the frontier. Everything else goes to follow-ups.

**Reply** at checkpoints, drains the user asked about, and close: the done condition and the count against it from `units.tsv` and `ledger.tsv`, each track and what it landed, the frontier, verdicts, what was abandoned and why, open gates, and the store path. Numbers from the tables, not narrative. **Show:** a board of units by state per track, the frontier with its verdicts, and gates on top; at close, the file map of everything that changed.
