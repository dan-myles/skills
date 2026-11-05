---
name: cooper-grill
disable-model-invocation: true
description: "Settle every open decision in a schema, infrastructure, or other change that's the user's call before anyone designs or builds it. Maps the decisions as a tree, asks the user each round's ready questions with a recommended answer, looks facts up instead of asking, and saves the agreed decisions. Use when work changes stored data, infrastructure, how services talk, providers, money values, or a shared contract, is a one-way door, leaves a feature's product or taste call open, or the user says 'grill me'. Manual-only: `/cooper-grill plan` in Claude Code, `$cooper-grill ...` in Codex. `cooper` runs it at a Checkpoint."
---

# Grill

Ask until you and the user understand the plan the same way, with nothing left assumed. A grill is a Cooper **Checkpoint**: the main kind of stop for the user, alongside Prototype's pick and Babysit's high-stakes question.

## When

Only for real changes the user has to decide. Run it before designing or building when the request leaves one of these open:

- a call that belongs to the user, per **Decided stays decided** in `../cooper/SKILL.md`: the schema or shape of stored data, infrastructure, how services talk, external providers, money values, contracts other code calls
- a one-way door: a data migration, deleting data, breaking a public API
- in a feature, a product or taste call the request, the code, and the docs don't settle

Or when the user asks for it ("grill me"). Size doesn't matter: a one-column schema change grills, and a big change that touches none of these doesn't. Everything else is Cooper's to decide without asking: names, file layout, internal structure, which existing library to use, and any detail that's easy to change later. Facts are never questions either; look them up.

## Map the tree

List every decision the plan needs. A decision can hang off others: "retry policy" waits on "sync or async". The **frontier** is every open decision whose prerequisites are settled.

## Facts are yours

A question the code, the repo, the tracker, or a quick run can answer isn't the user's. Look it up: `cooper-how` explorers with the explicit selection in [How](../cooper-how/SKILL.md) for code, plain commands for the rest. When a quick sketch would settle it (a layout, a timing, an output), build it per `../cooper/playbooks/prototype.md`. Don't hold the round for a lookup: only the questions that depend on it wait.

## Rounds

1. Draw the tree per `../cooper/references/visuals.md`: settled decisions with their answers, this round's frontier highlighted, later ones dashed. The first round opens with the catch-up per **Catch the user up first** in `../cooper/SKILL.md`: the goal, what you found, and why these calls are the user's. Each question in every round says what it decides and shows where it lands in the problem.
2. Ask the whole frontier per **How to ask** in `../cooper/SKILL.md`: one question per decision, your recommended answer first as "(Recommended)", each option one line on what it means and what it costs. Word it so "Send it" accepts your recommendation. The question tool takes four questions per call, so a bigger frontier goes out in several calls, the most fundamental first.
3. A question whose answer depends on another in the same round waits for the next round.
4. Record each answer, recompute the frontier, and go again.

When an answer conflicts with something already settled, or with what the code shows, say so plainly and ask again.

When the user said not to be asked ("don't ask me", "just decide"), don't ask. Take your recommended answer for every decision, mark each one a default in the tree and the saved file, and list them in the reply so the user can overrule any. Decisions that can't be undone, like a deploy, deleting data, or a public API change, still wait for the user.

## Finish

The grill is done when the frontier is empty: every branch visited, nothing silently assumed. Show the whole tree with every answer and ask the user to confirm it's the shared understanding. Nothing gets designed or built on it before they do.

Save it to `~/.cooper/grills/<slug>.md`: the goal, each decision with its answer and the reason, the facts found and where they came from, and what's deliberately out of scope. Whatever runs next reads it: the Feature design draft, or `cooper-architect`'s grounding, pasted in full.

**Reply:** the decisions, what's out of scope, and the file path. **Show:** the final tree.
