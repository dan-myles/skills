---
name: bob-grill
disable-model-invocation: true
description: "Settle every open decision in a complex or risky piece of work before anyone designs, builds, or dispatches it. Maps the decisions as a tree, asks the user each round's ready questions with a recommended answer, looks facts up instead of asking, and saves the agreed decisions. Use when a feature is complex, something could easily go wrong, the right behavior is unclear, or the user says 'grill me'. Manual-only: `/bob-grill <plan>` in Claude Code, `$bob-grill ...` in Codex. `bob` and `frank` run it when unsure."
---

# Grill

Ask until you and the user understand the plan the same way, with nothing left assumed.

## When

Only for complex work that needs the user's decisions. Run it before designing, building, or dispatching when either holds:

- several decisions only the user can make, especially ones that depend on each other
- a one-way door: a data migration, deleting data, breaking a public API

Or when the user asks for it ("grill me"). Never for small changes, however sensitive the area; Bob's review covers their risk. Never when the only open questions are facts, or details small and easy to change later; Bob picks those himself.

## Map the tree

List every decision the plan needs. A decision can hang off others: "retry policy" waits on "sync or async". The **frontier** is every open decision whose prerequisites are settled.

## Facts are yours

A question the code, the repo, the tracker, or a quick run can answer isn't the user's. Look it up: `bob-how` explorers (`bob-how.explorers` in `~/.bob-n-frank/synara/models.yaml`) for code, plain commands for the rest. When a quick sketch would settle it (a layout, a timing, an output), build it per `../bob/playbooks/prototype.md`. Don't hold the round for a lookup: only the questions that depend on it wait.

## Rounds

1. Draw the tree per `../bob/references/visuals.md`: settled decisions with their answers, this round's frontier highlighted, later ones dashed.
2. Ask the whole frontier per **How to ask** in `../bob/SKILL.md`: one question per decision, your recommended answer first as "(Recommended)", each option one line on what it means and what it costs. Word it so "Send it" accepts your recommendation. The question tool takes four questions per call, so a bigger frontier goes out in several calls, the most fundamental first.
3. A question whose answer depends on another in the same round waits for the next round.
4. Record each answer, recompute the frontier, and go again.

When an answer conflicts with something already settled, or with what the code shows, say so plainly and ask again.

When the user said not to be asked ("don't ask me", "just decide"), don't ask. Take your recommended answer for every decision, mark each one a default in the tree and the saved file, and list them in the reply so the user can overrule any. Decisions that can't be undone, like a deploy, deleting data, or a public API change, still wait for the user.

## Finish

The grill is done when the frontier is empty: every branch visited, nothing silently assumed. Show the whole tree with every answer and ask the user to confirm it's the shared understanding. Nothing gets designed, built, or dispatched on it before they do.

Save it as `grills/<slug>.md` in this role's store per **State** in `../bob/references/synara.md`: a Hub document for a coordinator, a Library file for a Hub worker, `~/.bob-n-frank/synara/grills/` standalone. Older grills in `~/.bob-n-frank/grills/` are the T3 edition's; read them, never write there. The file holds the goal, each decision with its answer and the reason, the facts found and where they came from, and what's deliberately out of scope. Whatever runs next reads it: the Feature design draft, `bob-architect`'s grounding, or a brief's CONTEXT, pasted in full.

**Reply:** the decisions, what's out of scope, and where it's saved. **Show:** the final tree.
