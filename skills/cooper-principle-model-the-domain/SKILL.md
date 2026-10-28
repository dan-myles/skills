---
name: cooper-principle-model-the-domain
disable-model-invocation: true
description: "Apply when writing stateful logic, or when code branches a lot or repeats the same shape assumption in several places. Put the domain's rules in a data structure, not in conditionals spread across files. Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Model the domain

Put the domain's rules in a data structure, not in conditionals spread across files.

A structure that matches the domain deletes branches and makes bad states impossible. Picking it while writing is cheap. Recovering it later looks like a refactor, and refactors get put off.

Reach for:

- a state machine over loose booleans and phase checks
- a typed model over loose parameters and repeated shape assumptions
- a lookup table, registry, or tagged union over branching spread across files
- a reducer or command/event model over ad hoc mutation
- a module built around one body of knowledge, not around steps like load, validate, save. Running order isn't ownership.
- a queue, cache, index, tree, or normalized collection when that's how the data gets read

If none fits, write down what the code must never allow and how the data gets read, then pick the structure that encodes exactly that.

Don't force it. Plain code is fine when the shape is clear, local, and unlikely to grow. Distrust a structure that adds a layer without removing a branch, a duplicated rule, a bad state, or a lifecycle risk.

**You skipped it when** a new feature adds one more branch to an existing if/else chain, a second boolean has to stay in sync with the first, or modules named after steps repeat the same rules.
