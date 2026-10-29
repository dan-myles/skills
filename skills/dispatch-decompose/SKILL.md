---
name: dispatch-decompose
disable-model-invocation: true
description: "Break an assigned repo goal into scoped Cooper jobs, resolve human decisions, and launch authorized work through Executor. Use for Dispatch task planning and implementation handoffs, not automatic Wayfinder invocation."
---

# Decompose

Read the [Dispatch role](../dispatch/SKILL.md), [work-item rules](../dispatch/references/work-items.md), and [Cooper worker contract](../dispatch/references/cooper-workers.md).

Reconcile known workers first, without queue refill. Find the existing item, its source, and Dan's actual authorization. A goal that leaves reserved decisions open needs the [decision procedure](../dispatch/references/decisions.md). Do not infer Wayfinder from size; only Dan starts that planning mode.

Split only where units have independent acceptance, ownership, or dependencies. Prefer one bounded Cooper job when it can finish within its timebox. Each writable job gets an exclusive worktree off `origin/main`; no two workers write the same branch. Save the whole brief before launch. A program that truly needs Cooper Orchestrate gets an explicit program scope and standing orders, including Dan's merge policy, rather than an unbounded delegation.

For every unit, state the outcome, allowed paths, forbidden actions, acceptance, verification, timebox, applicable user decisions, and dependency evidence. Paste upstream findings rather than a path the worker cannot read. Use the shared report contract, including its PR ownership instructions when the worker will open or update a PR.

Only launch units authorized by Dan or by the existing contained-bug policy. Keep proposals visible; ranked recommendations are not permission. Count known working Coopers and uncertain launches against `in_flight_cap`. A PR waiting on Dan remains owned but does not consume an executing slot unless its worker is still working. Keep ownership and execution status distinct in the board note.

Update the board page as each unit is launched: the unit appears on the Now tab with what it is doing, and anything left unlaunched appears under Backlog with why, so the page always distinguishes running work from queued work. Follow [the board page](../dispatch/references/board-page.md).

Launch a rolling window, not a blocking batch. A dependency becomes eligible only after its required evidence is accepted. The chase loop can refill that authorized frontier as workers finish; it cannot answer a human gate, expand scope, or turn a planning result into build approval.
