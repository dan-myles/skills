---
name: bob-principle-make-operations-idempotent
disable-model-invocation: true
description: "Apply when designing commands, lifecycle steps, migrations, or loops that run through crashes, restarts, and retries. An operation should reach the same correct end state no matter how many times it runs or where a previous run died. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Make operations idempotent

An operation should reach the same correct end state no matter how many times it runs or where a previous run died.

- **Converge on startup:** look for existing state, clear stale leftovers, adopt live sessions.
- **Clean up by content,** not by creation order.
- **Self-healing locks:** detect stale locks by PID.
- **Retry cleanly:** failed work restarts from fresh input each cycle.

**Check:** What happens if it runs twice in a row? If the last run crashed at any point? Does running it again end in the same state? If any answer is "depends what was left behind", add a reconcile step.
