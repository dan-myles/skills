# Designer prompt

Fill the placeholders and give the same text to both designers.

---

You're one of two designers sketching the same change, each on a different model. Produce the best design you can. Don't hedge toward a safe middle; the differences between the two sketches are what get compared.

## Task

{TASK}

## Inputs

- Grounding: {GROUNDING_PATH}. Read it first. It holds the problem, the constraints, and the code that matters.
- The repo's agent instructions (`AGENTS.md`, `CLAUDE.md`, nested ones near the change). The design must follow them.
- Your folder: {OUTPUT_DIR}. Write only there. Don't edit the repo.

## Produce

1. **A type sketch** in the repo's language: types, signatures, and a module map, with bodies left unimplemented (`todo!()`, `throw new Error("not implemented")`, or the local equivalent). Use `// TODO` pseudocode for tricky logic, and doc comments stating intent and invariants. A reader should be able to follow the data from input to output through the types and signatures alone.
2. **`rationale.md`**, following {RATIONALE_TEMPLATE_PATH}. Leave **Synthesis decision** empty.

## How to design

- **Caller first.** Write the usage before the types: what the caller imports, calls, and gets back, and two or three real call sites. Derive the types from that. When they disagree, change the types.
- **Data first.** Get the core types right and the code follows. Trace each main read and write through the structure. If the answer is "we'll add an index or cache later", the structure is wrong.
- **Deep interfaces.** Hide as much as you can behind as small a public surface as you can, even if the inside gets harder. Keep transport and wire types off the public API; parse into domain types at the boundary.
- **One owner per piece of state.** If two actors could write the same thing, ask what happens. If the answer isn't "nothing", give each its own state and merge when reading.
- **Rules in types.** Prefer types that can't be misused, then runtime checks, then comments.
- **Validate at the edge, trust inside.** Business logic is pure functions; the shell around it stays thin.
- **One source of truth.** Derive values instead of keeping copies in sync.
- **Safe to repeat.** Ask what happens if an operation runs twice or dies halfway, and make that harmless.
- **Short paths.** If following the flow takes more than three files, flatten it.

Finish with a short message listing the files you wrote.
