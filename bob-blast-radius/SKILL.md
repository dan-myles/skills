---
name: bob-blast-radius
disable-model-invocation: true
description: "Find what a change could break outside its own diff, name the one fact it's safe because of, and prove that fact by running the real code. Use for 'what could this break', 'blast radius of X', or a small diff that reaches far: shared code, a data shape, a dependency bump, a deletion. Manual-only: `/bob-blast-radius [diff, PR, or files]` in Claude threads, `$bob-blast-radius ...` in Codex threads. `bob` runs it at Review and before a bug fix that touches shared code."
---

# Blast radius

`bob-how` says what code does. `bob-why` says why it's shaped that way. This one says what a change breaks somewhere else.

Listing callers isn't the job; grep does that in a second. The job is the breakage grep can't see.

## Prove, don't argue

A writeup that sounds right reads the same whether it's true or not, so the writeup isn't the product. Find the one or two facts the change's safety rests on and prove them by running code.

Take each fact as far down this ladder as is cheap, and say where it stopped:

1. **Said so.** Worth nothing alone.
2. **Pointed at it.** A real `file:line`, in this repo or the library's own source.
3. **Walked it.** Followed the failure step by step and showed it can't get there.
4. **Ran it.** A script or test that calls the real code and fails loudly if the fact is false.
5. **Reproduced it.** Showed it in the running app, through the repo's verify skill when it has one.

Rung 4 is the usual target: one small script that imports the library the app ships and calls the exact function in question.

## Steps

1. **Read the change.** The diff, the symbols it adds, changes, and deletes, and what now behaves differently, including what the diff doesn't spell out. When the risk depends on why the old code was shaped that way, run `bob-why` step 2 (`../bob-why/SKILL.md`) for the commits, PRs, and tickets behind it.
2. **Name the one fact.** Most risky-looking changes are safe because of one fact, like "this call only drops cache entries nothing holds anymore". If it holds, most risks clear at once. Spend the time here, not on a long list of maybes.
3. **Look where grep stops.**
   - The library's source at the version the repo pins, plus any local patch.
   - When things run: microtasks, effects, teardown and unmount, retries, startup order.
   - What a symbol search misses: JSON an API returns, a DB column, a wire format, another language reading the same bytes, config keys, a feature flag, code three hops downstream.
4. **Weigh each risk.** Give it real odds and a real cost. Keep the ones that hold. List the ones you checked and cleared separately. Cite a real `file:line` for each. A search that found nothing is an answer; say what you searched. Never invent a caller or an API.
5. **Prove the fact.** Write the script or test in a scratch folder (`/tmp/bob-blast-radius-<slug>/`), run it, and paste the output. If it shows the fact is false, that's the headline.

**Reply:** no preamble. Show it per `../bob/references/visuals.md`: a file map with the change at the center, every file it reaches, each risk on its path, and the safety fact with its rung on the proof ladder.

- **What it does.** What changed, including the part that isn't obvious.
- **Safe because.** The fact, the rung it reached, and the proof output. If you couldn't prove it, say "unproven".
- **Risks.** For each: how it breaks, `file:line`, odds and cost, and how to check. Paste proof for the ones that matter.
- **Cleared.** What you checked, and why it's fine.
- **Before merging.** The cheapest test or repro that would catch the real bug, with the script you wrote. Suggest keeping it as a regression test when it would be one.

Run `unslop` on the reply, and leave anything private out of what goes into a PR.
