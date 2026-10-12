---
name: bob-models
disable-model-invocation: true
description: "Review and change the model for every role in Bob and Frank: each subagent (explorers, workers, designers, reviewers, judges, verifiers) and each thread Frank or Orchestrate launches. Shows the current setup, checks it against T3's live catalog, recommends upgrades with reasons, and applies changes in plain words. A repo can override lines in .bob-n-frank/models.yaml. Manual-only: `/bob-models [change]` in Claude Code, `$bob-models ...` in Codex."
---

# Models

`models.yaml` in this folder sets the model for every role in Bob and Frank: each subagent (`<skill>.<name>`) and each thread Frank or Orchestrate launches (`threads.<name>`). Each line gives the provider, model, and options inline; a list starts one subagent per entry; `inherit` means the thread's own model. A repo can override any line in `<repo>/.bob-n-frank/models.yaml`. The skills name their line where they start the work, and start it per `references/delegation.md`.

Two threads aren't in the file because T3's composer sets them: Frank's own thread, and any Bob thread the user starts by hand. If the user asks, recommend one: a fast coordinator for Frank (a frontier model at medium effort with its fast tier), a strong model for Bob.

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
   - a checker on the same family as what it checks: `bob.verifier` against `threads.bob`, `frank.validator` against Frank's thread model.
   - a line no skill names, or a `<skill>.<name>` a skill names that has no line. Search the bob- skills for `models.yaml` to find them.
4. **Recommend.** On a review, or for a change the user left open ("a better reviewer"), propose what's worth changing. Each recommendation names the line, before and after, why, and the cost: more effort or a bigger model means slower and more expensive runs. Lead with the one that matters most. "No change" is a fine answer; don't churn models for their own sake.
   - **Newer models.** The catalog doesn't rank models or say what's new. Judge from names and versions (`gpt-6.1-sol` over `gpt-6-sol`), then look up the provider's release notes or model docs, when you can reach them, and cite what you found. Say when a ranking is only a guess from the name.
   - **Fit the job.** Designers, reviewers, judges, explainers, and synthesizers do judgment work: a top model at high effort or more. Workers write code: the strongest coding model for its price. Explorers, investigators, and readers only read: a fast model at medium. Coordinators run many short turns: lower effort on a strong model, never a small one. Eval candidates should be the models Bob actually runs on.
   - **Effort.** `max` thinks for minutes per turn; save it for the rare line that needs it. Never use Claude Haiku 4.5 or a small model to coordinate, review, or judge.
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
