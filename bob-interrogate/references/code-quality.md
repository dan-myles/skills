# Code quality

Apply this on top of the rubric. It's a strict bar for how the change is built: structure, abstractions, and what it does to the codebase over time.

Be ambitious. Don't stop at local tidying. Look for the restructuring that keeps behavior the same and makes the change much smaller and more direct: one that deletes branches, helpers, modes, or layers instead of moving them around. Assume one usually exists.

## What to push on

1. **Delete over rearrange.** If a reframing makes whole conditionals or layers disappear, push for it. Prefer changes that remove moving parts over refactors that spread the same complexity around.
2. **Big files.** A change that pushes a file past about 1,000 lines should split it first, unless there's a strong structural reason not to.
3. **Tangled flows.** New one-off `if`s dropped into unrelated paths are a design problem, not style. The logic belongs in its own helper, state machine, or module.
4. **Working isn't enough.** If the same behavior fits a cleaner structure, ask for the cleaner one.
5. **Boring beats clever.** Flag magic, brittle generic machinery that hides a simple data shape, and wrappers that only forward calls.
6. **Types and boundaries.** Question needless optional fields, `any`, `unknown`, and casts where a clear typed model could exist. A silent fallback covering an unclear invariant means the boundary should be explicit.
7. **Right layer.** Feature logic leaking into shared code, internals leaking through an API, a new helper that duplicates an existing one: push the code to where it belongs.
8. **Ordering and atomicity.** Independent work done one after another for no reason, or related writes that can be left half-applied, when a cleaner structure is obvious.

Report in that order of weight: missed simplifications and structural regressions first, then tangled branching, then types, boundaries, and file size, then smaller readability points.

## Blockers

Correct behavior alone doesn't pass. Treat these as blockers unless the author justifies them:

- complexity a clear restructuring would delete
- a file pushed past about 1,000 lines
- one-off branches tangled into an existing flow
- feature checks scattered through shared code
- a needless abstraction, wrapper, or cast-heavy contract
- a duplicate of an existing helper, or logic in the wrong layer

## Tone

Direct and serious. Not rude, but don't soften a structural problem into "maybe rename this". If the change makes the codebase messier, say so.
