# Dispatch in depth

The roles, the `.dispatch/` store, takeover, and how models are declared. Moved out of the README on 2026-11-03.

## Roles

Dispatch and Cooper run inside [T3 Code](https://github.com/pingdotgg/t3code).

**Dispatch** is the per-project engineering lead: a long-running pinned thread scoped to one repository, with a Git-shareable `.dispatch/<id>/` store. It decomposes approved work, launches Cooper, chases CI, reviews, and stalls, and owns each item until it's done, abandoned, or handed back. It never writes repo code or merges; a merge-ready PR stays owned while waiting on Dan. Taking over another Dispatch's store needs explicit authorization and an exclusive-writer handoff.

**Cooper** is the engineer, and only that. Its skills know nothing about Dispatch. Everything a Cooper worker needs from Dispatch, including how and where to report back, travels in the brief Dispatch writes ([brief](../skills/dispatch/references/brief.md)). Dispatch also owns settling its workers ([settling](../skills/dispatch/references/settling.md)).

**Dispatch's modes** are shared skills under `dispatch-*`, like the focused modes in pstack. The entrypoint keeps `/dispatch setup`, `event`, `brief`, `report`, `status`, `chase`, and `wayfinder` inputs. Event, Report, and user-invoked Wayfinder remain local playbooks. Wayfinder runs in the Dispatch thread, coordinates Cooper research/prototypes, and produces a spec; build approval remains separate.

## T3 Dispatch project state

In a T3 project thread for the repository, invoke `$dispatch setup` or `/dispatch setup`. Setup verifies the exact thread/project/repository identity, initializes or resumes its owned store, and pins the coordinator with the available `t3_thread_organize` pin action. A missing pin capability leaves an explicit manual step. Setup creates no schedules or workers.

```text
<repo>/.dispatch/t-<sha256 of exact initial thread ID>/
├── store.md          stable identity, current owner and generation, standing orders
├── board.md          Now, Backlog, What landed, Watch and links
├── journal.md        running history, source/report markers, ownership handoffs
├── decisions.md      human decisions with exact words and sources
├── briefs/           worker scope, authorization, exact launch identity
├── reports/          shareable evidence with source, attempt and head SHA
└── wayfinder/        explicitly invoked planning maps and resolutions
```

The ID is `t-` plus the full lowercase SHA-256 of the initial thread's exact UTF-8 ID, including prefixes and punctuation. `store.md` retains that exact original ID forever. The owner thread/user and ownership generation can change without renaming the store. Only the current owner edits it. A second independent Dispatch gets its own folder and must avoid overlapping jobs/branches.

Save board and journal updates together, review `git diff -- .dispatch/<id>`, and automatically commit/push the owned state documents directly to `main` with `[skip ci]`. No per-save approval is needed. Leave unrelated changes and outgoing commits untouched; use a dedicated checkout from `origin/main` when needed. Never force-push or change repository protection settings. The skip marker suppresses supported CI triggers, not every possible integration. Tell the recipient which branch/commit contains the latest state. Pulling an unshared local checkpoint is impossible. Store sanitized evidence and repo-relative paths, never secrets, credentials, private customer material, absolute machine paths, or connection tokens. Runtime access is verified again on each machine.

To transfer ownership, stop the old writer, save/share its final snapshot, pull that branch on the recipient's machine, start a new Dispatch in the same repo, and explicitly request `dispatch takeover <id>`. Preserve identity/history and increment the owner generation. Share the ownership transition before new worker actions. If the old thread is inaccessible, the operator must confirm it will no longer write. Git is not a lock; divergent ownership or offline uncertainty stops mutations until reconciled.

Takeover does not make another user's worker threads accessible. Keep inaccessible workers gated with their last verified report/time/head. Recover access and confirm control before retargeting or settling; a replacement requires explicit approval and evidence the prior worker is stopped or isolated. Never silently declare it finished or discard its provenance. See [the state and takeover contract](../skills/dispatch/references/project-state.md) and [worker contract](../skills/dispatch/references/cooper-workers.md).

Dispatch coordinates; Cooper investigates, implements and validates in T3 worker threads. Each worker reports its store/item/attempt/generation and notifies the exact current owner via `t3_thread_send`. Dispatch reads the full reply and preserves shareable evidence before advancing report markers. Lost/duplicate notifications are reconciled without duplicate launches. The worker model choices are preserved. Their source declarations are now direct launch settings rather than YAML lookups.

## Models in skill source

Each launch step declares its exact model, effort and provider family. Cooper build subagents use GPT-6.1 Sol high; readers use Sonnet 5.5 medium. Other roles keep their existing selections. T3 resolves a capable enabled provider instance at runtime rather than treating generic names or account-specific pool IDs as portable defaults. An unavailable model/setting is a visible gate, never an automatic substitute. Explicit user instructions can override a particular job.

`cooper-models` remains the upgrade tool. It inventories actual skill source and examples, checks live capabilities, proposes scoped changes, and edits approved declarations together. It does not create a YAML configuration, change running threads, or sync installed copies. Launch mechanics live in [Cooper's delegation reference](../skills/cooper/references/delegation.md).
