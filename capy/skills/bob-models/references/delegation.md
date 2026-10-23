# Models and native Capy subagents

Read `../bob/references/runtime.md` for placement, context transfer, reporting, and PR waits.

Resolve each named role from the user's explicit selection for this task, then `.bob/capy/models.yaml` in the target project, then `models.example.yaml`. A project override replaces the whole role entry or panel list, not an entire group. A role may be `inherit`, a model entry, or a list of entries for a panel. Never create a configuration during ordinary delegation.

An entry uses Capy's model-selection fields: `modelId`, optional `reasoningMode`, and optional `modes` such as `fast`. Check the current Capy catalog and available native subagent controls before starting. Inherit the current model and settings only when the role is explicitly `inherit`; do not import provider-instance IDs or settings from another app. Do not silently substitute models, lower effort, change billing connections, or change the parent thread model. If the native start controls cannot apply the requested effort or mode, report the mismatch instead of putting the setting only in the prompt.

Defaults retain explicit models and efforts for every role. Claude roles use `claude-code/` model IDs by default to select the Claude subscription harness. Do not substitute an `anthropic/` ID, which selects a different harness and billing route. GPT roles remain `openai/` to preserve mixed-family design and review. The user can choose any supported model, effort, or panel through a task instruction or `/bob-models`; subscription defaults do not lock model choice.

Check that the intended subscription or connection can serve the selection. If it is unavailable or exhausted, report it and ask before changing the selection or authorizing a paid alternative. Never change account connection order or run-out settings. Capy's connection and run-out policies control actual billing; a plugin preference cannot override those account policies.

Designers and reviewers use different model families by default; a checker uses a different family from the author when available. Honor an explicit user override and disclose when it removes that independence. If a required model or option is unavailable, show the mismatch and ask before changing that selection. When independent delegation itself is unavailable, do the review directly and label the missing independence.

`bob.thread` recommends the model for a new Bob parent thread. Use the model picker or authorized native thread controls to select it; loading this skill never silently changes an existing thread's model.

Draft each child with its full prompt, select the resolved model and supported reasoning mode and modes using the native controls, and explicitly start it with shared or fresh placement. Check the returned model, settings, placement, and machine ID. If settings cannot be verified, say so rather than claiming they took effect.

Use shared read-only children for all panels and judges. Writers use fresh machines from a verified upstream base. For a later review round, include the original brief, previous findings, responses, changed head SHA, and unresolved objections. Retain child identifiers, inspect final results, and report any unfinished children.
