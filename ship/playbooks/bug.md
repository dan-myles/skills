# Bug

You own the fix. Be scientific: every shipped line traces to runtime evidence. A change that "might help" is a hypothesis, not a fix, and it doesn't ship. When evidence refutes a hypothesis, revert what it motivated.

1. Reproduce it yourself on the surface where it was reported. Drive the browser, simulator, API, or CLI with the tools the harness has, and capture the failing output. Ask the user to reproduce only when no tool reaches the surface, and say why. If it won't fire, synthesize the trigger, tighten the conditions, or add instrumentation until it does.
2. Find the cause by elimination. List the candidate causes, seeded from recent history: git log and blame on the area, linked tickets, and error tracking or traces when the repo has them. Each round, test the split that rules out the most, using runtime evidence such as logs, instrumentation, or a debugger. Don't guess. Confirm the mechanism before you fix it.
3. Plan the smallest fix the evidence justifies. Sketch it first when it crosses module boundaries. Delegate the change to a subagent with a specific scope.
4. Write a regression test when the bug is in business logic and has a cheap local test path. Running `/ship` on a bug counts as the user asking for that test. Follow the repo's test conventions and test behavior, not wiring. Skip with a reason when the test would be expensive, integration-heavy, or unclear.
5. Verify on the same surface as step 1: the original repro now passes. Unit tests show branch behavior, not that the bug is gone. Run the repo's checks.
6. Order the commits so the failing test or repro lands before the fix.
7. Review per **Review** in the skill.
8. Run **Opening the PR**. A bug fix follows the repo's merge flow.

**Reply:** what was broken, the root cause with its evidence, the fix, how you verified it, the repro output before and after pasted verbatim, and the PR link.
