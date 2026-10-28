---
name: cooper-principle-build-the-lever
disable-model-invocation: true
description: "Apply when doing any non-trivial edit, migration, analysis, or check, not only bulk work. For any work that isn't trivial, build the tool that does it or proves it: a codemod, a script, a generator, a check. Don't do it by hand. Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Build the lever

For any work that isn't trivial, build the tool that does it or proves it: a codemod, a script, a generator, a check. Don't do it by hand.

A tool does the work the same way every time and reruns for free. It's also one thing a reviewer can read and rerun. Hand edits can only be checked by redoing them. A script turns "trust me" into "run this".

- Do the first unit by hand to learn the recipe, then build the tool. Rerun it on that unit and diff against your hand version. Make it safe to rerun.
- Codemods or scripts for edits, generators for repeated files, a query over a dump for analysis, a rerunnable check for verification.
- One script that handles every unit beats fanning out subagents to apply it by hand.
- When subagents do share the work, write the recipe, the check, and the don't-touch list as one file they all read, outside what they're allowed to edit.
- Commit the tool when the work outlives the session.

The bar is triviality, not repetition: a one-off earns a tool when the tool is what makes it checkable. Build the smallest script that does the job, never a framework.

**You skipped it when** you cite this and the diff has no script, codemod, generator, or shared recipe.

Not `cooper-principle-encode-lessons-in-structure`, which turns a recurring instruction into a guardrail.
