---
name: bob-models
disable-model-invocation: true
description: "Review and change the model for every role in Bob and Frank: each subagent (explorers, workers, designers, reviewers, judges, verifiers) and each thread Frank or Orchestrate launches. Shows the current setup, checks it against Synara's live catalog, recommends upgrades with reasons, and applies changes in plain words. A repo can override lines in .bob-n-frank/synara/models.yaml. Manual-only: `/bob-models [change]` in Claude threads, `$bob-models ...` in Codex threads."
---

# Models

The user's models file, `~/.bob-n-frank/synara/models.yaml`, sets the model for every role in Bob and Frank: each subagent (`<skill>.<name>`) and each thread Frank or Orchestrate launches (`threads.<name>`). Each line gives the provider, model, and options inline; a list starts one subagent per entry; `inherit` means the thread's own model. A repo can override any line in `<repo>/.bob-n-frank/synara/models.yaml`. The T3 edition's `~/.bob-n-frank/models.yaml` is a different file with T3 model ids; never edit it from here. `models.example.yaml` in this folder is the built-in default: it has every line, it's what runs when the user has no models file, and it fills any line the user's file lacks. The skills name their line where they start the work, and start it per `references/delegation.md`.

Some threads aren't in the file because Synara sets them: a Hub's coordinator and its default worker model (the Hub's settings), and any thread the user starts by hand (the composer). If the user asks, recommend one: a strong model at medium effort for a coordinator, which runs many short turns, and a strong model for Bob.

## Use

- `/bob-models`: review. Show the setup, check it, and recommend changes.
- `/bob-models <change>`: make a change in plain words, for example:
  - "put the architect judge on opus"
  - "add a third reviewer"
  - "drop the reviewers to high effort"
  - "put the explorers on luna to save money"
  - "in crabstock, run workers on opus" (a repo override)
- `/bob-models` with recommendations pasted from `/bob-improve`: weigh each one as in step 4.

## Steps

1. **Read the catalog.** Call `synara_capabilities`. It is the only source of ids: never write a provider, model slug, or option value it didn't return. If it returns nothing, stop and say so. Save its result to a file for step 3.
2. **Show the setup.** A table with one row per entry: line, provider, model, options, and whether the catalog still lists it.
3. **Check the file.** Run `python3 scripts/check_models.py <capabilities.json> models.example.yaml [~/.bob-n-frank/synara/models.yaml] [<repo>/.bob-n-frank/synara/models.yaml] --skills-root ..` (later files override earlier ones). It marks most of these; judge the rest:
   - a model, provider, or option value the catalog doesn't list
   - a provider that isn't `available`
   - a panel that doesn't mix providers. `bob-architect.designers` must be two entries from different providers. `bob-adversarial-review.reviewers` and `bob-improve.eval-candidates` should mix them.
   - a checker on the same family as what it checks: `bob.verifier` against `threads.bob`, `frank.validator` against Frank's thread model.
   - a line no skill names, or a `<skill>.<name>` a skill names that has no line. Search the bob- skills for `models.yaml` to find them.
4. **Recommend.** On a review, or for a change the user left open ("a better reviewer"), propose what's worth changing. Each recommendation names the line, before and after, why, and the cost: more effort or a bigger model means slower and more expensive runs. Lead with the one that matters most. "No change" is a fine answer; don't churn models for their own sake.
   - **Newer models.** The catalog doesn't rank models or say what's new. Judge from names and versions (`gpt-6.1-sol` over `gpt-6-sol`), then look up the provider's release notes or model docs, when you can reach them, and cite what you found. Say when a ranking is only a guess from the name.
   - **Fit the job.** Designers, reviewers, judges, explainers, and synthesizers do judgment work: a top model at high effort or more. Workers write code: the strongest coding model for its price. Explorers, investigators, and readers only read: a fast model at medium. Coordinators run many short turns: lower effort on a strong model, never a small one. Eval candidates should be the models Bob actually runs on.
   - **Effort.** `max` thinks for minutes per turn; save it for the rare line that needs it. Never use Claude Haiku 4.5 or a small model to coordinate, review, or judge.
   - **Diversity.** When the catalog gains a provider that can run child tasks, suggest it as an extra reviewer. Don't put a judge on the same provider as both entries it judges.
   - **Inherit.** Set a line to `inherit` only with a reason: the thread's own model already fits that job, and a separate model adds cost without a better result.
   - Skip reasoning values that start more agents (`ultracode`), values injected into the prompt (`ultrathink`), and values whose effect the catalog doesn't describe (`ultra`).
   - **Aliases.** `opus` and `sonnet` follow Synara's newest model of the family. Recommend a pinned slug only when the user wants a role frozen; pinned slugs can't run as native Claude subagents, so they cost a child thread or a headless run.
5. **Confirm.** Show the changes as before and after, line by line, and ask with the question tool whether to apply them, "Send it (Recommended)" to apply, per **How to ask** in `../bob/SKILL.md`. Wait for the answer. A change the user spelled out in full doesn't need a second confirmation.
6. **Write.**
   - Edit `~/.bob-n-frank/synara/models.yaml`. If it's missing, create it as a copy of `models.example.yaml` first, then apply the change, keep its comments, and set `checked` to today's date. Edit `<repo>/.bob-n-frank/synara/models.yaml` instead only when the user asks for a change in one repo; say whether that file is committed (the whole team gets it) or listed in `.git/info/exclude` (only this machine). Change `models.example.yaml` only when the user says to change the defaults.
   - A new role, a subagent a skill starts that has no line yet, gets its line in both the user's file and `models.example.yaml`, and the skill step that starts it names the line and points at `references/delegation.md`. A role the skills no longer use loses its line in both. Update a panel's comment when its count changes.
   - Re-run `scripts/check_models.py` afterwards; it must exit 0.
7. **Commit** only what lives in the skills repo (`models.example.yaml`, skill edits for a new role), with a short lowercase message. Resolve this folder's real path first; it may be a symlink. The user's file isn't in any repo, and a repo override follows that repo's own flow.

**Reply:** the final table, what changed, and recommendations left open with their reasons. Show the table and the before and after per `../bob/references/visuals.md`.
