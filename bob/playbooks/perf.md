# Perf

The numbers are yours. Every change is tied to a measurement. Reading code gives you a guess, never a gain.

Two modes. Pick one, say which, and put only its steps on the todo list.

- **Fix.** One slow thing to make fast enough. The default.
- **Climb.** Push one metric toward a target over many tries: "get p95 under 200 ms", "make it 50% faster", "keep going".

Vet every number, the baseline included, with `references/benchmark-checklist.md` before you plan from it or report it. Behavior doesn't change; a perf change that alters what users see is a Feature.

## Fix

1. Reproduce and measure. Find a case that shows the slowness the user sees, on the surface where they see it, through the repo's verify skill when it has one. Capture a baseline with a profile or trace and vet it.
2. Ground your guesses. Run `bob-how` over the hot path the profile points at and map the hot spot to source. Don't claim a limit you haven't measured. Try fixes cheapest first, and stop at the first that meets the target:
   1. Don't do it. Drop work whose result nothing uses.
   2. Do it once. Stop repeating it.
   3. Do less of it.
   4. Do it later.
   5. Do it where nobody waits on it.
   6. Do it concurrently.
   7. Do it cheaper.
3. Plan the fix from the profile. When it crosses modules or changes a public interface, run `bob-architect`. Hand it to a subagent with the files, the hot path, and the target number. One attempt at a time, measured before the next, per `sequence-verifiable-units`. Revert an attempt that doesn't move the number.
4. Compare with the same harness and case, before and after. Commit the harness first when it's worth keeping. A result that's inconclusive or on the wrong surface isn't a win; report it that way.
5. Run the repo's checks. Behavior must not change.
6. Review per **Review** in the skill.
7. Run **Opening the PR**. The PR body gets one headline number. The runs, range, and limiter go in the details or a linked artifact.

**Reply:** the verdict, baseline and after with units, run count, range, the limiter, the fix, the artifact path, and the PR link.

## Climb

One change, one measurement, keep or revert. Never stack untested changes. Never claim a win from reading code.

1. Pick the case and the metric. Run `bob-how` over the target. Name what moves the number (data size, history, concurrency, state) and pick a case that reproduces the user's complaint. If none does, fix the repro first. Then fix one metric, which direction is better, and a stop rule that pairs a target with a minimum number of tries ("50% faster than baseline, after at least 10 tries"), so a lucky first try can't end the run. Use the user's numbers, or propose them. **Checkpoint:** show the case, metric, and stop rule and wait, unless the user said to skip this.
2. Build the harness, prove it, then freeze it, per `build-the-lever`. Run contrasting workloads: the target case should show the problem and easier cases should separate from it. If they don't, change the workload or the metric. Vet it with the checklist. It prints its error count and a count of work done. Once frozen, one command prints the metric as a median of enough runs to clear the noise. Record the baseline and a green run of the regression gate: the tests that must keep passing.
3. Open a decision log: `decision.tsv` in a scratch folder outside the repo, one row per try with id, hypothesis, change, before, after, delta, tests, verdict (kept or reverted), and a note. Read it before each try.
4. Give each hypothesis a mechanism from step 1 ("move X off the startup path; it blocks first paint"), not "try memoizing something". Order them by the list in Fix step 2.
5. Loop, one hypothesis per try:
   - A subagent makes the change from a tight brief; you review the diff. Independent hypotheses can run in parallel, each in its own worktree, per `separate-before-serializing-shared-state`.
   - Measure with the frozen harness and run the gate.
   - Keep the change only when the metric moves past the noise and the gate stays green. Otherwise revert it fully.
   - Commit each kept change on its own, staging only its files. Log the row either way.
6. Push past the first plateau. After several rejects in a row, switch category, combine near-misses, reread the source, or try something bolder. Correctness and simplicity outrank the number: revert a win that breaks behavior, and keep a simplification that holds the number.
7. Stop when the rule is met, or when the ideas left aren't worth their cost. Don't loosen the rule to meet it, and don't quit with cheap ideas untried. If you're stuck, say so.
8. Review per **Review** in the skill, then run **Opening the PR** with the kept commits in the order they landed.

**Reply:** the metric and target, baseline to final with the percent change, tries kept and reverted, each kept change in one line, the `decision.tsv` path, and the next idea you'd try.
