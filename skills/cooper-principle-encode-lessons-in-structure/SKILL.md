---
name: cooper-principle-encode-lessons-in-structure
disable-model-invocation: true
description: "Apply when you write the same instruction a second time or see the same correction again. When a correction keeps coming back, enforce it with a mechanism (a type, a lint, a check, a script), not another instruction. Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Encode lessons in structure

When a correction keeps coming back, enforce it with a mechanism (a type, a lint, a check, a script), not another instruction.

Instructions only work if the reader notices, remembers, and complies. A mechanism works without cooperation.

1. Ask whether it can be a type, a lint rule, a metadata flag, a runtime check, or a script.
2. If yes, build it and delete the instruction.
3. If it needs judgment, make the instruction more prominent and add an example of the failure.

**Pick the strongest that fits:** a state that can't compile, then a lint or banned API that fails CI, then a shared helper, then a runtime check. Agents copy whatever the code around them does, so a weak guard becomes the next template.

- **Catch every correction** and decide whether it's a one-off or a pattern.
- **Route it:** a one-off goes nowhere, a repo fact to AGENTS.md, a recurring fix to a mechanism or a skill. `/cooper-improve` does this.
- **Close the loop:** apply it now or file a concrete task. "I'll keep that in mind" doesn't persist.
