---
name: bob-principle-laziness-protocol
disable-model-invocation: true
description: "Apply when sizing a diff, refactoring, or tempted to add an abstraction, a layer, or a new value threaded through several layers. Get the most result from the least code and complexity. Use explicitly by name in Capy; helpers are also loaded by Bob."
---

# Laziness protocol

Get the most result from the least code and complexity.

- **Delete first.** Asked to improve something, look for what to remove before what to add.
- **Keep the call graph flat.** If answering one question means tracing more than three files or layers, flatten it. A rich interface that hides real work isn't a deep chain.
- **Decide once.** Don't repeat the same choice in several places. Put it behind one source of truth and pass the result.
- **Smallest diff that solves it.** Fewer lines beat elegant boilerplate.
- **Question threading.** When a task wants a new value passed through types, schemas, and pipelines, look for a more direct path first.
- **Fix small leaks early.** Tiny pass-throughs, leaked representations, and duplicated choices spread and become permanent coordination costs.

**Check:** Would an engineer find this code tiring to maintain? Then it's the wrong solution.
