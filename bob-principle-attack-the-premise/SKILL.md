---
name: bob-principle-attack-the-premise
disable-model-invocation: true
description: "Apply when two or more fixes sharing one premise have failed the same gate. When two or more fixes built on the same assumption fail the same check, suspect the assumption, not the fixes. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Attack the premise

When two or more fixes built on the same assumption fail the same check, suspect the assumption, not the fixes.

Each failure under a shared premise is evidence against it.

- **Write the premise down:** the one sentence every failed fix assumed.
- **Count before the next fix.** Measure the imbalance per actor (worker, node, shard, user) with a rerunnable script. The count shows who holds it, not just how much there is.
- **Read the skew.** If the same few actors hold most of it every run, something assigns them that role. Find it; that's the next "why".
- **Remove the asymmetry; don't compensate for it.** Rotate the role, randomize it, or move it. A rebalancer or a return path leaves the assignment in place and adds work every run.

**Stop:** don't start another fix until the premise is written and the count exists. If the count is even, the premise isn't the cause; look elsewhere and keep the count as evidence.

Not `bob-principle-redesign-from-first-principles`, which designs around a new requirement.
