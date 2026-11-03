# Dispatch, Fleet Control and Support in depth

The roles, the `.dispatch/` store, takeover, and how models are declared. Moved out of the README on 2026-11-03.

## Roles

Cooper was previously named Bob. Use `$cooper` or `/cooper`, with helpers under `cooper-*`. Existing grills and Orchestrate state remain in `.bob-n-frank`. Models and effort are now hardcoded at each launch step. Legacy home/repo model YAML files are ignored and left untouched. Repo-local `bob-verify-*` skills remain supported. Loadout deploys the renamed folders; review ownership of old `bob*` copies and start a new agent session after sync. See [rename checks](cooper-rename.md).

Dispatch and Cooper run inside [T3 Code](https://github.com/pingdotgg/t3code). Dispatch is a long-running pinned project thread scoped to one repository. Fleet Control and GameStock Support remain Grok Bots; their separate Executor transport is retained.

**Fleet Control** retains `grokbot-fleet-control` for its existing bot scopes and approved cadences. New T3 Dispatches do not register with it or depend on it; cross-project T3 Dispatch routing is outside this port.

**Dispatch** is the per-project engineering lead. Each repository uses the same `dispatch` skill with a separate Git-shareable `.dispatch/<id>/` store. Independent Dispatches can use separate stores; taking over another store requires explicit authorization and an exclusive-writer handoff. It decomposes approved work, launches Cooper, chases CI/reviews/stalls, and owns the item until completion, explicit abandonment, or handback. It never writes repo code or merges. A merge-ready PR stays owned while waiting on Dan.

**Cooper** is the engineer. Each worker runs the right playbook, performs repo work and verification, opens its authorized PR, and reports in its own T3 reply and notifies the exact owning Dispatch thread. Dispatch preserves a sanitized copy with source markers in Git. Coopers can use subagents. Only Dan approves merges.

**GameStock Support** uses `grokbot-gs-crisp-support`, imported from the content Dan supplied. Its interactive Crisp queue and exact production-write approvals remain separate from engineering auto-dispatch. It keeps its own Executor launch and thread-message report contract, plus the existing approval and settlement boundaries.

The workflows draw on these sources:

- **[pstack](https://github.com/cursor/plugins/tree/main/pstack)** by Lauren Tan: the playbooks, the principles, and the engineering bar (one job, verified, no slop).
- **[Matt Pocock's skills](https://github.com/mattpocock/skills)**: grilling, the round-by-round interview before complex work, and Wayfinder's durable maps for planning across sessions.
- **[Engineering Lead](https://x.ai/bot/marketplace/bots/engineering-lead)** by Lauren Tan: onboard, decompose, run, chase, and report; keep healthy work quiet and preserve active worker context. Its public listing exposes operating principles and skill summaries, not a complete runnable routine.
- **Custom workflows** use T3 worker threads, Cooper subagents, PR watches, persistent project ownership and sourced reports. Bot support retains Executor separately.

**Dispatch's modes** are shared skills under `dispatch-*`, like the focused modes in pstack. Other Grok Bot roles use `grokbot-*`; these are skill namespaces, not one skill per bot instance. The entrypoint keeps `/dispatch setup`, `event`, `brief`, `report`, `status`, `chase`, and `wayfinder` inputs. Event, Report, and user-invoked Wayfinder remain local playbooks. Wayfinder runs in the Dispatch thread, coordinates Cooper research/prototypes, and produces a spec; build approval remains separate. Fleet Control never starts Wayfinder or answers its human decisions.

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

[`tools/t3-grokbot-bridge`](../tools/t3-grokbot-bridge/README.md) remains a separate optional bot tool. T3 Dispatch does not require it, Fleet Control, Executor, a global instance registry, or an external Page. No actual CrabStock state, live bot configuration, or installed skill copies are migrated by this source change. Historical [Grok Bot validation](grokbot-validation.md) records the previous port, not this Dispatch runtime. Current checks are recorded in [T3 Dispatch validation](dispatch-t3-validation.md).

Cooper's grills and Orchestrate stores remain unchanged. Existing `~/.bob-n-frank/models.yaml` and repo model overrides remain on disk but are no longer consulted. Support customer details stay in its session queue and scoped worker threads, never tracked skill files.

## Models in skill source

Each launch step declares its exact model, effort and provider family. Cooper build subagents use GPT-6.1 Sol high; readers use Sonnet 5.5 medium. Other roles keep their existing selections. T3 resolves a capable enabled provider instance at runtime rather than treating generic names or account-specific pool IDs as portable defaults. An unavailable model/setting is a visible gate, never an automatic substitute. Explicit user instructions can override a particular job.

`cooper-models` remains the upgrade tool. It inventories actual skill source and examples, checks live capabilities, proposes scoped changes, and edits approved declarations together. It does not create a YAML configuration, change running threads, or sync installed copies. Launch mechanics live in [Cooper's delegation reference](../skills/cooper/references/delegation.md). See [model migration checks](hardcoded-models-validation.md).
