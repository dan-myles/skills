---
name: bob-how
disable-model-invocation: true
description: "Explain how part of a codebase works: subsystem architecture, runtime flow, and where something belongs (which package owns it, which layer it sits in). Use before changing unfamiliar code, for walkthroughs, and for onboarding. For why code is shaped the way it is, use `bob-why`."
---

# How

Answer "how does X work?" well enough that an experienced engineer new to the area could start working in it. Aim for a mental model, not a line-by-line tour of the source.

## 1. Size the question

If the scope is unclear, state how you read it and go. The user can correct you.

- **Small.** One module, one utility, one function. Use a single explainer. Go to step 3.
- **Large.** A subsystem across several files or services, a cross-cutting feature, or a whole-system overview. Run explorers first. Go to step 2.

When unsure, treat it as small.

## 2. Explore in parallel (large questions)

Split the question into two to four angles that don't overlap, such as entry points, data model, outbound integrations, and failure handling. Start one explorer subagent per angle, all at once. Brief each with `references/explorer.md` and its angle. They only read.

## 3. Explain

Start one explainer subagent, read-only, briefed with `references/explainer.md`. For a large question, include every explorer's findings. For a small one, leave that section out; the explainer explores on its own.

Without subagents, do both roles yourself in that order: gather facts first, then write.

## 4. Present

Hand the user the explainer's answer. Tighten wording or add context from the conversation, but keep its substance.

The answer uses these sections, dropping any that don't apply: Overview, Key concepts, How it works, Where things live, Gotchas.
