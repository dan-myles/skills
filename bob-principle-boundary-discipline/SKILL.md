---
name: bob-principle-boundary-discipline
disable-model-invocation: true
description: "Apply when wiring validation, error handling, or a framework adapter. Validate and handle errors at the system's edges. Inside, trust the types. Keep business logic in pure functions and the framework glue thin. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Boundary discipline

Validate and handle errors at the system's edges. Inside, trust the types. Keep business logic in pure functions and the framework glue thin.

- **At the edges** (CLI args, config files, network, outside APIs): validate, parse into domain types, return errors, be defensive.
- **Inside:** typed data, errors passed up, no re-checking. A nil check deep in a call chain after the edge already validated is noise that looks like safety.
- **Across the edge,** expose domain concepts, not the transport's, storage's, or framework's own types. General mechanism inside, special-case policy at the edge.
- **Pure core.** Parsing, scoring, and prompt building are functions from data to data that the framework shell calls. Then they can be tested without the framework.

**Check:** Is this data crossing a boundary right now? If not, the validation is redundant. Could this be a pure function the shell just calls? Then pull it out.
