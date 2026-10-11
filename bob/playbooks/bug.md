# Bug

The fix is yours. Work from evidence: each line you ship should answer something you saw happen at runtime. Changes made on a hunch are experiments, and experiments don't ship. If a test of an idea comes back negative, undo the edits that idea led to.

1. See it fail yourself, on the surface where it was reported. Drive the browser, simulator, API, or CLI through the repo's verify skill when it has one, otherwise with the harness's tools, and save the failing output. Ask the user to reproduce it only when nothing you have can reach that surface, and explain the gap. When it won't fail on demand, build the trigger yourself, narrow the conditions, or add logging until it does.
2. Narrow down the cause. Write out what could cause it. Run `bob-how` over the affected area to ground the list. When it looks like a regression, run `bob-why` on the code that broke to find what changed and what that change was for. Each round, run the check that rules out the most suspects at once, using real output from logs, added instrumentation, or a debugger. When you can show how the failure happens, you've found it. Follow `fix-root-causes`, and switch to `attack-the-premise` when two fixes on the same assumption have failed.
3. Plan the smallest fix that matches what you found. If it reaches across modules or changes a public interface, run `bob-architect` and stop at its sketch for the user to approve. When the fix touches code other modules depend on, run `bob-blast-radius` on the planned edit and put its risks in the brief. Hand the change to a subagent with a clear scope.
4. Add a regression test when the bug sits in business logic and a local test is cheap. Calling `/bob` on a bug is the user's request for that test. Use the repo's test conventions and assert on behavior, not plumbing, per `test-behavior-not-implementation`. Mark it `skip: <why>` when the test would be slow, need heavy integration setup, or have no clear shape.
5. Run the step 1 reproduction again on the same surface and show that it passes now. Passing unit tests cover the branches they hit; they don't show the bug is gone. Run the repo's checks.
6. Commit the failing test or reproduction first, then the fix on top.
7. Review per **Review** in the skill.
8. Run **Opening the PR**. Bug fixes follow the repo's merge flow.

**Reply:** what went wrong, the cause and the evidence for it, the fix, how you checked it, the reproduction output from before and after copied exactly, and the PR link. **Show:** the failure path with the point it broke, and the reproduction before and after.
