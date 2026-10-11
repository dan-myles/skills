---
name: bob-principle-redesign-from-first-principles
disable-model-invocation: true
description: "Apply when a new requirement lands in an existing design, or a refactor needs a target shape. Don't bolt a new requirement onto the old design. Design as if it had been there from day one, then get there in steps. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Redesign from first principles

Don't bolt a new requirement onto the old design. Design as if it had been there from day one, then get there in steps.

- Read every file the change touches and understand the current design.
- Ask what you'd build from scratch, knowing this requirement.
- Carry the change through every reference: types, docs, examples, comments that explain the design.
- Think through the whole redesign first, then deliver it in small verified steps. See `bob-principle-sequence-verifiable-units`.

Not `bob-principle-attack-the-premise`, which questions a fact the current design assumes after fixes keep failing.
