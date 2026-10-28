---
name: cooper-principle-foundational-thinking
disable-model-invocation: true
description: "Apply when choosing core types and data structures, deciding what to build first, or letting more than one actor touch the same state. Get the data shape right before the logic. Structure decisions keep options open; code decisions keep things simple. Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Foundational thinking

Get the data shape right before the logic. Structure decisions keep options open; code decisions keep things simple.

- **Data first.** Define the core types early, trace every way they're read and written, and pick structures that fit the common paths. The logic after that tends to be obvious.
- **Share structure, not lines.** Types and models should converge. Three similar statements still beat an early abstraction. Explicit beats clever.
- **Concurrency.** Before two actors share state, ask what happens if the other one changes it mid-operation. If the answer isn't "nothing", separate them. See `cooper-principle-separate-before-serializing-shared-state`.
- **Scaffold first.** Do first what helps every later step: CI, lint, test setup, shared types. Setup before features, tests before fixes.
- **Build up an abstraction.** Each step lands a coherent abstraction or deepens one. Don't spread a new capability across callers as special cases.

Delete before you lay foundations. See `cooper-principle-subtract-before-you-add`.
