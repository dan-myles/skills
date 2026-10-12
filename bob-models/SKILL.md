---
name: bob-models
disable-model-invocation: true
description: "Review and change the models behind Bob's panels and judges (bob-architect designers and judge, bob-adversarial-review reviewers, bob-improve eval, Orchestrate's verifiers). Shows the current setup, checks it against T3's live catalog, recommends upgrades with reasons, and applies changes like swapping a model, adding a reviewer, or pinning a subagent that runs on Bob's model today. Every other subagent runs on Bob's own model. Manual-only: `/bob-models [change]` in Claude Code, `$bob-models ...` in Codex."
---

# Models

`models.yaml` in this folder holds the models for the subagents where mixing model families is the point: panels (designers, reviewers, eval candidates) and the judges that score them. Each line is keyed `<skill>.<name>` and gives the provider, model, and options inline; a list starts one subagent per entry. Every other subagent runs on Bob's own model and has no line here. The skills that use a line name it where they start the subagent, and start it per `references/delegation.md`.

Bob's own model is the T3 thread's model, set in T3's composer. This file can't change it. If the user asks, say so and recommend one.

## Use

- `/bob-models`: review. Show the setup, check it, and recommend changes.
- `/bob-models <change>`: make a change in plain words, for example:
  - "put the architect judge on opus"
  - "add a third reviewer"
  - "drop the reviewers to high effort"
  - "pin bob-why's synthesizer to opus" (a subagent that runs on Bob's model today)
  - "unpin the eval judge"
- `/bob-models` with recommendations pasted from `/bob-improve`: weigh each one as in step 4.

## Steps

1. **Read the catalog.** Call T3's `orchestrator_capabilities`. It is the only source of ids: never write a provider, model, or option value it didn't return. If it returns nothing, stop and say so.
2. **Show the setup.** A table with one row per entry: line, provider, model, options, and whether the catalog still lists it.
3. **Check the file.** Mark:
   - a model, provider, or option value the catalog doesn't list
   - a provider whose `canRunCrossProviderChildTask` is false
   - a panel that doesn't mix providers. `bob-architect.designers` must be two entries from different providers. `bob-adversarial-review.reviewers` and `bob-improve.eval-candidates` should mix them.
   - a line no skill names, or a `<skill>.<name>` a skill names that has no line. Search the bob- skills for `models.yaml` to find them.
4. **Recommend.** On a review, or for a change the user left open ("a better reviewer"), propose what's worth changing. Each recommendation names the line, before and after, why, and the cost: more effort or a bigger model means slower and more expensive runs. Lead with the one that matters most. "No change" is a fine answer; don't churn models for their own sake.
   - **Newer models.** The catalog doesn't rank models or say what's new. Judge from names and versions (`gpt-6.1-sol` over `gpt-6-sol`), then look up the provider's release notes or model docs, when you can reach them, and cite what you found. Say when a ranking is only a guess from the name.
   - **Fit the job.** Designers, reviewers, and judges do judgment work, so they get a top model at high effort or more. Eval candidates should be the models Bob actually runs on, since the eval tests a skill as Bob will use it.
   - **Diversity.** When the catalog gains a provider that can run child tasks, suggest it as an extra reviewer. Don't put a judge on the same provider as both entries it judges.
   - **Pin or unpin.** Pin a subagent only with a reason: a session where Bob's model fell short at that job, or a job that needs a different family. Unpin a line when Bob's model does that job as well.
   - Skip reasoning values that start more agents (`ultracode`), values injected into the prompt (`ultrathink`), and values whose effect the catalog doesn't describe (`ultra`).
5. **Confirm.** Show the changes as before and after, line by line, and ask with the question tool whether to apply them, "Send it (Recommended)" to apply, per **How to ask** in `../bob/SKILL.md`. Wait for the answer. A change the user spelled out in full doesn't need a second confirmation.
6. **Write.**
   - Edit `models.yaml`, keep its comments, and set `checked` to today's date.
   - Pinning adds a line here and changes the skill step that starts that subagent: name the line and point at `../bob-models/references/delegation.md`, the way `bob-architect` does for its judge. Unpinning removes both. Update a panel's comment when its count changes.
   - Parse the file afterwards and re-run step 3's checks.
7. **Commit** in the skills repo with a short lowercase message, the skill edits from a pin in the same commit. Resolve this folder's real path first; it may be a symlink.

**Reply:** the final table, what changed, and recommendations left open with their reasons. Show the table and the before and after per `../bob/references/visuals.md`.
