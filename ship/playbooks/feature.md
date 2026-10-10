# Feature

You own the design. Delegate the typing and stay in the lead.

1. Map the affected area: the code paths, data shapes, and module boundaries the change touches, plus the repo rules for that area. Delegate the sweep to a subagent when it spans many files.
2. Sketch the design: the data shape and its structure, where it lives, the public signatures, and how existing code calls it. Offer two sketches only when there's a real fork. **Checkpoint:** show the sketch and wait for the user's OK before writing code, unless they waived it ("just do it").
3. Write the plan as four todo items. A dimension that doesn't apply keeps its item as `n/a: <reason>`.
   - **Blocking first steps.** Contracts others build on: schemas, API specs, shared types, generated code.
   - **Independent workstreams.** Disjoint files, services, or layers that can run in parallel.
   - **Shared state.** Files or resources two workers would both write. Split them, or serialize.
   - **Smallest decomposition.** How many workers, and why.
4. Build. Delegate code to subagents with the scope from step 3: files, data shape, success criteria. Blocking steps go first, then the independent streams in parallel. Commit each unit once it works.
5. Verify on the surface the user will use: the page, the screen, the endpoint, the command. Run the repo's checks. Inconclusive or wrong-surface is not a pass. Flag it.
6. Review per **Review** in the skill.
7. Run **Opening the PR**. A feature stops at an open PR.

**Reply:** what you built and who it's for, what you chose and why (a table when there were alternatives), how you verified it with the evidence, the PR link, and open decisions.
