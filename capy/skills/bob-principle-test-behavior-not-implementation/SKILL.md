---
name: bob-principle-test-behavior-not-implementation
disable-model-invocation: true
description: "Apply when writing, changing, or keeping a test. Assert what the code's users can observe, so the test fails when that behavior breaks and keeps passing when only the internals change. Use explicitly by name in Capy; helpers are also loaded by Bob."
---

# Test behavior, not implementation

A test is a claim about what the code does for its users: a caller, an end user, another service. Behavior is what they can observe: return values, errors, state they can read back, and effects outside the code (a request sent, a row written, a message emitted). Implementation is what they can't: private helpers, internal call order, intermediate data, which collaborator did the work.

Judge every test with two imagined edits:

- **Break the behavior.** Return a wrong value, skip an effect, or do it twice. If the test still passes, it proves nothing. Usual causes: an assertion looser than the contract (`toBeDefined`, `toBeTruthy`), an expected value computed by the code under test, a restated constant that never runs the code reading it, or an assertion on data the test built itself.
- **Change the internals.** Keep every observable result and restructure underneath. If the test now fails, it's pinned to the implementation: it breaks on every refactor and still catches no bug.

Keep a test that catches the first edit and survives the second. Rewrite or delete the rest. To write one, drive the code through its users' interface with a concrete input, take the expected value from the requirement (never from a run of the code), and assert exactly what the contract promises.

**The contract decides, not the assertion's shape.**

- "An empty cart never charges" makes "the payment client got no call" behavior. Pair it with a case where the charge happens, so the test proves it can see a call.
- The payload a mocked external service receives is behavior; that service observes it. A call to an internal helper is implementation.
- An empty list is the exact answer when nothing matches, and a hollow check when the test just needs some result.
- An exact error message pins wording no caller reads. The error type callers branch on is the contract.

An invariant counts as behavior too: a key that must exist in two tables, or a compile-time type test.
