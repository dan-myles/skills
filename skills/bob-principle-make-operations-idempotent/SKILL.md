---
name: bob-principle-make-operations-idempotent
disable-model-invocation: true
description: "Apply when designing commands, lifecycle steps, migrations, or loops that run through crashes, restarts, and retries. An operation should reach the same correct end state no matter how many times it runs or where a previous run died. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Make operations idempotent

An operation should reach the same correct end state no matter how many times it runs or where a previous run died.

Derive each step from the state that exists, not from what the last run meant to do. Read the current state, compare it to the goal, and apply only the difference. A repeat then finds nothing left to do.

Anything a run leaves behind (a lock, a temp file, a half-written record, a claimed job) must be recognizable as stale by the next run, wherever the last one stopped, not just in the common case. A marker the next run can't judge turns every crash into manual cleanup. Write to a temp path and rename it into place; compare artifacts by content, not creation order.

**Check:** What happens if it runs twice in a row? If the last run crashed at any point? Does running it again end in the same state? If any answer is "depends what was left behind", add a reconcile step.
