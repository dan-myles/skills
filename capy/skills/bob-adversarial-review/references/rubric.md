# Rubric

Use the lenses that fit the change. Not every one applies.

## Correctness

Does the code do what the intent says?

- Edge cases: empty input, null, boundary values, concurrent access.
- Errors: caught, passed up, or swallowed?
- Off-by-one, type coercion, overflow, encoding.
- State: races, stale closures, references that outlive their owner.
- Both the happy path and the failure path.
- Idempotency: what happens if this runs twice, or a previous run died halfway? If the answer depends on what was left behind, a reconciliation step is missing.
- Concurrency: when several actors can touch the same state (rows, files, branches), is access ordered by structure (a lock, a single owner, sequential phases) or by a convention that won't hold?

When you suspect a bug, trace the path that triggers it. "This could be null" isn't a finding; the call chain that makes it null is.

## Cause or symptom

Does the change fix the real problem or cover it up? Read past the diff: callers, callees, types, sibling modules. Understand why the code exists before judging whether the change sits at the right layer.

- A guard clause hiding a broken invariant.
- A retry hiding a broken contract.
- A cast silencing a modeling mistake.
- A fix in module A that belongs in module B's contract.
- A comment or convention saying "don't do X" where a type, lint, or runtime check could make X impossible.

## Structure

Does it fit the system it lives in?

- Boundaries: is input validated once where it enters, then trusted inside, or is validation scattered through the logic?
- Levels: is high-level orchestration mixed with low-level detail?
- Coupling: does it add dependencies that make the next change harder?
- Data fit: do the data structures match how they're read and written? The right shape makes the code around it obvious.
- Bolted on or built in: if this requirement had been known from day one, would the code look like this?
- Two paths: does it add a new API and keep the old one alive? With no outside consumers, move the callers and delete the old path in the same change.

Don't punish simple code for lacking abstraction. A premature abstraction costs more than a little duplication.

## Verification

Can you tell from reading that it works?

- Are there tests, and do they check behavior rather than internals?
- Is there a test for the bug, if this is a bug fix?
- Is the full path tested where the change crosses an integration boundary?
- Does it check the real thing, not a proxy (a cached value, a file timestamp, a status someone reported)?
- For delegated or async work: does it check the actual output, or trust a summary?

## Complexity

Is every moving part earning its place?

- Code that could be simpler without losing correctness.
- An abstraction with one caller.
- Options and config for cases that don't exist.
- Dead code, unused imports, leftover parameters.
- "Just in case" paths nothing calls.
- Compatibility scaffolding for a migration that's already done.
- Features or controls the user doesn't need. Half-built is worse than missing.

## Security

For each finding, trace the input from where it enters to where it lands.

- User input reaching SQL, a shell, eval, or raw HTML unescaped.
- Missing authentication or authorization on new endpoints.
- Secrets in code, logs, or error messages.
- Check-then-use gaps on security-critical paths.
