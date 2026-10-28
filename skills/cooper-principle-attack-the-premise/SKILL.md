---
name: cooper-principle-attack-the-premise
disable-model-invocation: true
description: "Apply when two or more fixes sharing one premise have failed the same gate. Write the premise down and test it directly before writing another fix that assumes it. Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Attack the premise

When two or more fixes built on the same assumption fail the same check, suspect the assumption, not the fixes.

Each failure under a shared premise is evidence against it. A third fix on the same premise spends effort where the evidence already says the cause isn't.

- **Write the premise down:** the one sentence every failed fix assumed.
- **Test it before the next fix.** Find an observation that would come out differently if the premise were false, and make it with a rerunnable script (`cooper-principle-build-the-lever`). Look at how the failures are spread out, not only how big they are.
- **Follow the evidence.** If it contradicts the premise, the cause is elsewhere: look for what the failures share that the premise didn't predict. If it confirms the premise, ask the next "why" (`cooper-principle-fix-root-causes`); the earlier fixes may have treated a consequence instead of the cause.
- **Remove the condition; don't compensate for it.** If one part always lands on the losing side, change what puts it there. Something that cleans up after it leaves the cause in place and adds work every run.

**Stop:** don't start another fix until the premise is written down and tested.

Not `cooper-principle-redesign-from-first-principles`, which designs around a new requirement. This one questions a fact the current design assumes.
