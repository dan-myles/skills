---
name: bob-architect
disable-model-invocation: true
description: "Design a change before writing it. Two designers from different model families each sketch the types, signatures, and module map, a judge scores them, and Bob merges the stronger sketch with the best of the weaker one into a rationale and a type sketch with empty bodies. Use when a change adds a service, module, or public interface, or moves ownership. Use explicitly by name in Capy; helpers are also loaded by Bob."
---

# Architect

Before delegating, read `../bob/references/runtime.md` and `../bob-models/references/delegation.md`. Paths in this skill and its playbooks resolve from this skill's folder unless explicitly rooted in the target repo. Use this helper only when requested or called by a Bob workflow.

Sketch the shape before the code: types, signatures, module boundaries, with bodies left unimplemented. Sketch it twice, on two model families, and merge. Then build against the merged sketch, and throw it out if the build proves it wrong.

Open a todo per step.

## 1. Ground

A design needs a real picture of every system it touches. Naming a file isn't grounding.

When `bob` called this, use what `bob-how` and `bob-why` found in its step 1. When run alone, do it now: follow `../bob-how/SKILL.md` over the area, and `../bob-why/SKILL.md` too when the design changes who owns what or which layer does what. Skip this only for true greenfield work with nothing around it.

Make a working folder, `/tmp/bob-architect-<slug>/`, and write the grounding to `grounding.md` there. The designers start with none of this session, so the file has to stand alone: the problem, the constraints, the repo rules that apply, and absolute paths to the code that matters.

## 2. Frame

1. State what each designer produces: a type sketch, a module map, and a rationale.
2. Write a rubric of three to six criteria that say what a good design means for this task. Only the judge and you see it.
3. Give each designer its own folder: `/tmp/bob-architect-<slug>/a/` and `/b/`.

## 3. Sketch

Two designers at the same time, from `bob-architect.designers` in `.bob/capy/models.yaml`: Designer A on its first entry, Designer B on its second. Start them per `../bob-models/references/delegation.md`.

Each gets the task, the path to `grounding.md`, its own folder, and `references/designer-prompt.md`. Each writes a sketch and a `rationale.md` shaped by `references/rationale-template.md` into its folder.

The two must be different whole shapes, not variations on one. If one designer fails, go on with the other, note the dropout, and draft a second shape yourself.

## 4. Screen

Check both sketches against `references/design-red-flags.md`. Assume the next contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Prefer the design where a change that looks right from one file is right for the whole repo.

Compare interface depth: prefer the design that hides more behind a smaller public surface.

## 5. Judge and pick

Once both sketches are written, start one judge on `bob-architect.judge`, with `references/judge-prompt.md`. It sees the rubric and the sketches under neutral labels.

While it runs, read both sketches end to end yourself and score them on the rubric one criterion at a time. Then compare with the judge. If you agree on the base, that confirms it. If you disagree, one of you is biased or the rubric was vague. Reread both rationales before deciding.

Pick the base a future maintainer could extend most easily without breaking its rules. On a tie, pick the smaller interface or the cleaner boundary.

## 6. Merge

Go through the other sketch once more for what's worth bringing over. It's usually one or two things. Fold each in by hand so the result still reads as one design. Don't paste.

- If the two converged on the same shape, that's strong agreement. Take it as is.
- If they diverged wildly, the framing was too loose. Tighten step 2 and sketch again rather than averaging.

Fill the merged rationale's **Synthesis decision**: the base and why, what came from the other sketch, what was rejected and why, the judge's verdict, and any dropout.

## 7. Hand back

Return the merged `rationale.md` and the sketch, shown per `../bob/references/visuals.md`: a file map of the chosen shape (every file, where it lives, how they connect), its types, and the two designs side by side with the judge's scores. When `bob` called this, its step 3 **Checkpoint** shows them to the user and waits. When run alone, show them and stop. For a contested design, `../bob-adversarial-review/SKILL.md` can review the sketch before the user sees it.

The repo's rules decide where the rationale is kept. If they're silent, it goes in the PR body. After approval, the sketch lands as the first commit on the branch. Delete the working folder when the PR is open.

## Building against the sketch

The approved sketch is the contract. Fill in the empty bodies and turn pseudocode into logic.

A change from the sketch is a signal, not friction to absorb quietly. If a function needs a parameter the sketch didn't have, ask whether the sketch was wrong, a requirement was missed, or the code is reaching too far, and tell the user which.

## Scrapping it

When the build keeps fighting the sketch, throw the sketch out. Don't bolt fixes onto a wrong design. The sign is a pattern, not one case:

- the same kind of workaround showing up in unrelated places
- several unrelated edge cases that each need a special branch
- types that only compile with escape hatches: `any`, casts, optional fields that are always set
- reaching for a lock when the sketch said the state wasn't shared
- callers needing to know the abstraction's internal rules
- two or more separate deviations of the same shape

A few edge cases don't condemn a design, and complex data isn't a complex design. When you scrap it:

1. Run `bob-how` over what's been built.
2. Redesign as if the new constraints had been known on day one.
3. Remove before adding: the new sketch starts smaller than the old one.
4. Go back to step 2. Tell the user, since the design they approved changed.
