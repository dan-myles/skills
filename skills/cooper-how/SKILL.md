---
name: cooper-how
disable-model-invocation: true
description: "Explain how part of a codebase works: subsystem architecture, runtime flow, and where something belongs (which package owns it, which layer it sits in). Use before changing unfamiliar code, for walkthroughs, and for onboarding. For why code is shaped the way it is, use `cooper-why`."
---

# How

Answer "how does X work?" well enough that an experienced engineer new to the area could start working in it. Aim for a mental model, not a line-by-line tour of the source.

## 1. Size the question

If the scope is unclear, state how you read it and go. The user can correct you.

- **Small.** One module, one utility, one function. Use a single explainer. Go to step 3.
- **Large.** A subsystem across several files or services, a cross-cutting feature, or a whole-system overview. Run explorers first. Go to step 2.

When unsure, treat it as small.

## 2. Explore in parallel (large questions)

Split the question into two to four angles that don't overlap, such as entry points, data model, outbound integrations, and failure handling. Start one explorer subagent per angle, all at once. Brief each with `references/explorer.md` and its angle. They use `claude-sonnet-5-5` with `{effort: medium}` on provider family `claudeAgent` and only read. Start them per [launch mechanics](../cooper/references/delegation.md).

## 3. Explain

Start one read-only explainer subagent using `claude-opus-5-5` with `{effort: high}` on provider family `claudeAgent`, briefed with `references/explainer.md`. For a large question, include every explorer's findings. For a small one, leave that section out; the explainer explores on its own.

Without subagents, do both roles yourself in that order: gather facts first, then write.

## 4. Present

Hand the user the explainer's answer. Tighten wording or add context from the conversation, but keep its substance.

The answer uses these sections, dropping any that don't apply: Overview, Key concepts, How it works, Where things live, Gotchas. In T3, present it as a rendered HTML page per `../cooper/references/visuals.md`, never as text alone: draw How it works as a flow with `file:line` on each step, and Where things live as a map. The text keeps the overview, concepts, and gotchas short.
