---
name: bob-principle-subtract-before-you-add
disable-model-invocation: true
description: "Apply when ordering an addition, a refactor, or a rewrite. Remove complexity first, then build on what's left. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Subtract before you add

Remove complexity first, then build on what's left.

Adding to a complicated system compounds it. Removing first leaves less code, shows the real structure, and often makes the next design obvious.

- Remove before you build: dead code, redundant validators, stale references.
- Get to the minimum before polishing.
- Design for how it's used today, not for imagined edge cases.
- No validators, parsers, or guards beyond what the spec needs.
- Cut redundant instructions from prompts and templates.
- A reference with nothing new in it gets deleted, not left as a stub.

Leave the design a little simpler than you found it, with the same or a smaller surface.
