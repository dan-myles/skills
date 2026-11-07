# Perf

The numbers are yours. Every change is tied to a measurement. Reading code gives you a guess, never a gain.

Two modes. Pick one, say which, and put only its steps on the todo list.

- **Fix.** One slow thing to make fast enough. The default.
- **Climb.** Push one metric toward a target over many tries: "get p95 under 200 ms", "make it 50% faster", "keep going".

Vet every number, the baseline included, with `references/benchmark-checklist.md` before you plan from it or report it. Behavior doesn't change; a perf change that alters what users see is a Feature.

## Fix

1. Reproduce and measure. Find a case that shows the slowness the user sees, on the surface where they see it, through the repo's verify skill when it has one. Capture a baseline with a profile or trace and vet it. Show the baseline: where the time or memory goes, as flame-style bars.
2. Ground your guesses. Run `cooper-how` over the hot path the profile points at and map the hot spot to source. Don't claim a limit you haven't measured. Try fixes cheapest first, and stop at the first that meets the target:
   1. Don't do it. Drop work whose result nothing uses.
   2. Do it once. Stop repeating it.
   3. Do less of it.
   4. Do it later.
   5. Do it where nobody waits on it.
   6. Do it concurrently.
   7. Do it cheaper.
3. Plan the fix from the profile. When it changes the schema, infrastructure, a public interface, or another call that's the user's (see **When** in `../cooper-grill/SKILL.md`), that's a **Checkpoint**: run `cooper-grill` first. When it crosses modules, run `cooper-architect` and build against its sketch. Commit the harness first when it's worth keeping.
4. Build it in attempts, measuring each. Hand each attempt to a subagent with the files, the hot path, the target number, and the harness command as its check. The subagent measures and reports the output; rerun the measurement yourself. Keep an attempt that moves the number and commit it; revert one that doesn't. One attempt at a time, measured before the next, per `sequence-verifiable-units`.
5. Review per **Review** in the skill. It comes before the final check because its fixes change code.
6. Verify on the final code: compare with the same harness and case, baseline against the final code, and run the repo's checks, since behavior must not change. A result that's inconclusive or on the wrong surface isn't a win; report it that way. Any code change after this, including a Babysit fix, reruns this check for what it touched before it's pushed.
7. Ship it: run `playbooks/open-pr.md`, which opens a ready-for-review PR and babysits it. Stop when Open PR stops.

**Reply:** the verdict, baseline and after with units, run count, range, the limiter, the fix, the artifact path, and the branch it's committed on. **Show:** a before-and-after chart with units, range, and the limiter, and the file map of what changed.

## Climb

One change, one measurement, keep or revert. Never stack untested changes. Never claim a win from reading code.

1. Pick the case and the metric. Run `cooper-how` over the target. Name what moves the number (data size, history, concurrency, state) and pick a case that reproduces the user's complaint. If none does, fix the repro first. Then fix one metric, which direction is better, and a stop rule that pairs a target with a minimum number of tries ("50% faster than baseline, after at least 10 tries"), so a lucky first try can't end the run. Use the user's numbers, or propose them. Show the case, metric, and stop rule and keep going; the user can change them mid-run.
2. Build the harness, prove it, then freeze it, per `build-the-lever`. Run contrasting workloads: the target case should show the problem and easier cases should separate from it. If they don't, change the workload or the metric. Vet it with the checklist. It prints its error count and a count of work done. Once frozen, one command prints the metric as a median of enough runs to clear the noise. Record the baseline and a green run of the regression gate: the tests that must keep passing.
3. Open a decision log: `decision.tsv` in a scratch folder outside the repo, one row per try with id, hypothesis, change, before, after, delta, tests, verdict (kept or reverted), and a note. Read it before each try.
4. Give each hypothesis a mechanism from step 1 ("move X off the startup path; it blocks first paint"), not "try memoizing something". Order them by the list in Fix step 2.
5. Loop, one hypothesis per try:
   - A subagent makes the change from a tight brief, runs the frozen harness and the gate, and reports the output; you review the diff and rerun the measurement. Independent hypotheses can run in parallel, each in its own worktree, per `separate-before-serializing-shared-state`.
   - Measure with the frozen harness and run the gate.
   - Keep the change only when the metric moves past the noise and the gate stays green. Otherwise revert it fully.
   - Commit each kept change on its own, staging only its files. Log the row either way.
6. Push past the first plateau. After several rejects in a row, switch category, combine near-misses, reread the source, or try something bolder. Correctness and simplicity outrank the number: revert a win that breaks behavior, and keep a simplification that holds the number.
7. Stop when the rule is met, or when the ideas left aren't worth their cost. Don't loosen the rule to meet it, and don't quit with cheap ideas untried. If you're stuck, say so.
8. Review per **Review** in the skill. It comes before the final check because its fixes change code.
9. Verify on the final code: run the frozen harness on the final branch against the baseline, plus the regression gate and the repo's checks. Any code change after this, including a Babysit fix, reruns this check for what it touched before it's pushed.
10. Ship it: keep the commits in the order they landed, and run `playbooks/open-pr.md`, which opens a ready-for-review PR and babysits it. Stop when Open PR stops.

**Reply:** the metric and target, baseline to final with the percent change, tries kept and reverted, each kept change in one line, the `decision.tsv` path, and the next idea you'd try. **Show:** the metric across tries, kept and reverted marked, against the target.

**End-of-work reply:** follow the [required recap](../references/visuals.md#required-end-of-work-recap): the diagram and the built-work recap first, then concise caveats and handoff links. This also applies when this playbook ends in a PR or babysit handoff.
