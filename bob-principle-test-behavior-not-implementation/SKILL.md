---
name: bob-principle-test-behavior-not-implementation
disable-model-invocation: true
description: "Apply when writing, changing, or keeping a test. A test calls the code the way its users do and checks what they'd see against a literal expected value. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Test behavior, not implementation

A test calls the code the way its users do and checks what they'd see against a literal expected value.

**Check:** would the test still pass if every function it imports returned `undefined`? Then it can't catch a bug. Rewrite the assertion or delete the test.

Shapes that pass that way:

- **Weak or no assertion:** only `toBeDefined`, `toBeTruthy`, `not.toThrow`, `toBeGreaterThan(0)`.
- **Only mocks or absence:** only `toHaveBeenCalled`, `toBeUndefined`, `toEqual([])`, `not.toBe(x)`.
- **Circular:** the expected value comes from the code under test, like `expect(parse(u).url).toBe(buildUrl(u))`.
- **Constant pin:** it restates a constant, config default, table row, or prompt string. It catches nothing and blocks honest edits.
- **Fixture checks fixture:** it asserts data the test built, and the code under test never runs.

**Fix:** run the code in the test body with one concrete input and assert the literal output or the visible effect: `expect(slugify("Hello, World!")).toBe("hello-world")`. For an absence, assert the presence for another input in the same test. For a constant, test the code that reads it. For a mock, assert the payload it got or the state after. If no such assertion exists, delete the test.

**Keep** tests of relations across a table (a key present in two tables) and compile-time type tests.
