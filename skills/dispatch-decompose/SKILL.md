---
name: dispatch-decompose
disable-model-invocation: true
description: "Break an assigned repo goal into scoped Cooper jobs, resolve human decisions, and launch authorized work through T3. Use for Dispatch task planning and implementation handoffs, not automatic Wayfinder invocation."
---

# Decompose

Verify current root ownership and a reachable Beads graph per [project state](../dispatch/references/project-state.md) before any write or worker action. A non-owner may inspect only; takeover must be explicit.

Read the [Dispatch role](../dispatch/SKILL.md), [work-item rules](../dispatch/references/work-items.md), and [Cooper worker contract](../dispatch/references/cooper-workers.md).

Reconcile known workers first, without queue refill. Find the existing issue, its source, and Dan's actual authorization. A goal that leaves reserved decisions open needs the [decision procedure](../dispatch/references/decisions.md). Do not infer Wayfinder from size; only Dan starts that planning mode.

Split only where units have independent acceptance, ownership, or dependencies. Each unit is its own issue under the root (or under a parent epic for a multi-unit goal), with `blocks` dependencies only for real prerequisites, so `bd ready` shows the launchable frontier. Prefer one bounded Cooper job when it can finish within its timebox. Each writable job gets an exclusive worktree off the repo's verified default branch; no two workers write the same branch. Write the brief onto the issue before launch. A program that truly needs Cooper Orchestrate gets an explicit program scope and standing orders, including Dan's merge policy, rather than an unbounded delegation.

For every unit, state the outcome, allowed paths, forbidden actions, acceptance, verification, timebox, merge policy, applicable decision issues, and dependency evidence, plus `board.summary` and `board.visual`. Paste upstream findings rather than a path the worker cannot read. Use the shared report contract, including its PR ownership instructions when the worker will open or update a PR.

Only launch units labelled `approved` on Dan's authorization or the contained-bug policy. Keep proposals visible as open issues without `approved`; ranked recommendations are not permission. Set `merge:auto` only when the [merge policy](../dispatch/references/cooper-workers.md#merge-policy) clearly allows it. Count known working Coopers and uncertain launches against the root's in-flight cap. A PR waiting on Dan remains owned but does not consume an executing slot unless its worker is still working. Keep ownership and execution status distinct.

Record each launch on its issue as it happens, then render [the board](../dispatch/references/board-page.md): launched units in Now, and unlaunched ones in Backlog with the reason, so running work and queued work stay distinct.

Launch a rolling window, not a blocking batch. A dependent unit becomes eligible only when its prerequisites close with accepted evidence. The chase loop can refill that authorized frontier as workers finish; it cannot answer a human gate, expand scope, or turn a planning result into build approval.
