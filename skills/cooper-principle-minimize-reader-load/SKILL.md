---
name: cooper-principle-minimize-reader-load
disable-model-invocation: true
description: "Apply when shaping or reviewing code that's hard to follow, or deciding whether a refactor was worth it. Code is maintainable when a reader can understand it with little effort. Count two things: layers to trace, and state to hold in your head. Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Minimize reader load

Code is maintainable when a reader can understand it with little effort. Count two things: layers to trace, and state to hold in your head.

- **Collapse layers that cost more than they save:** wrappers with one caller, adapters with one implementation, indirection nobody needed.
- **Each layer should change the abstraction.** A layer that repeats the same methods and arguments adds reading without hiding anything.
- **Prefer small interfaces that hide real decisions.** A broad interface over little logic makes readers learn both.
- **Shrink state scope:** return values over mutation, locals over fields, fields over module state, module state over globals. Derive values instead of syncing copies.
- **State an invariant once, at the boundary,** not in every consumer.
- Before adding a layer or a piece of state, ask whether it saves at least as much reading somewhere else.

The two axes are separate: a flat file with fifty globals is as hard as a six-layer adapter stack.

**Check:** Can a new reader answer "where does X come from?" and "what can change X?" in thirty seconds? If not, cut layers or state.
