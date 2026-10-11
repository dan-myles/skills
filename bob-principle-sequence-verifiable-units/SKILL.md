---
name: bob-principle-sequence-verifiable-units
disable-model-invocation: true
description: "Apply when doing multi-step work (sweeps, migrations, runs of similar edits) and when ordering commits and PRs. Do work as small units that each end in a state you can check. Don't start the next until the current one passes. Deliver them in an order that proves itself. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Sequence verifiable units

Do work as small units that each end in a state you can check. Don't start the next until the current one passes. Deliver them in an order that proves itself.

A break caught at the unit that caused it is cheap to find. One caught after a batch is buried under work built on it.

- **Doing it.** Known-good state, one change, run the check, move on. Rebase onto a clean base first so each check measures against the real thing. When a script does the edits, the check is nearly free; run it anyway.
- **Delivering it.** Order commits and PRs as an argument: the failing test, then the fix. Deletions, then the reshape. A baseline, then the change. Scaffold, then the feature. Each commit stands on its own.
