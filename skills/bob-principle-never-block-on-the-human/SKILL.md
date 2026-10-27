---
name: bob-principle-never-block-on-the-human
disable-model-invocation: true
description: "Apply when about to ask \"should I do X?\" about something you can undo. The user checks in when they can. Make reasonable calls on reversible work, do it, and let them correct course after. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Never block on the human

The user checks in when they can. Make reasonable calls on reversible work, do it, and let them correct course after.

Every pause for permission makes the user the bottleneck. Code is reversible and reviewable, so a wrong call usually costs less than waiting.

- **Do it, then show it,** with why.
- **Fix what you notice.** Note a problem and fix it next round.

**Limits:** irreversible or outward actions still need a yes: force-pushing shared branches, deleting real data, deploying, messaging people. Product direction comes from the user; execution shouldn't wait on them. Reversing a decision the user made, or making a reserved call (`bob/SKILL.md`, **Decided stays decided**), isn't reversible work even on a branch: other work builds on it before anyone notices.
