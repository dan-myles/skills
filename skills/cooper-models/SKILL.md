---
name: cooper-models
disable-model-invocation: true
description: "Review and upgrade models and effort settings hardcoded in Cooper and Dispatch skill source. Inventory actual launch sites, check live T3 availability, propose scoped upgrades, and edit approved declarations and examples together. Manual-only: /cooper-models or $cooper-models."
---

# Models

Maintain the model choices written directly in the skills. This is an authoring tool, not a runtime resolver or a settings-file editor. Existing home/repo model YAML files are ignored and left untouched. Launch mechanics live in [Cooper](../cooper/references/delegation.md).

## Use

- `/cooper-models`: inventory current choices, validate availability, and recommend changes without editing.
- `/cooper-models <change>`: make an explicit source change, such as "upgrade adversarial reviewers", "put build subagents on <model> high", or "update every use of <model>".
- Recommendations from `/cooper-improve models` are evidence to assess, not approval to apply them.

A change to shared skill source affects future launches wherever that source is installed. A request limited to one project/job is an explicit brief override, not permission to rewrite shared defaults. Record the instruction and scope in the current job brief. A project-wide instruction may instead be a sourced Dispatch standing order, applied explicitly to each in-scope brief and launch. Honor that scope without asking again; do not introduce a hidden project model registry. Identify that scope before editing. Model edits do not change already-running threads, install skills, or sync a machine.

## Inventory

Resolve the authoring repository and read its instructions first. If only an installed copy is available, identify the source checkout before writing; do not edit installed destinations or redirect skill links.

Search actual source, not a cached role registry. Start with `rg -n 'modelSelection|reasoningEffort|effort:|provider family|claude-|gpt-' skills/cooper* skills/dispatch* skills/grokbot-gs-crisp-support README.md PARKING_LOT.md`. Follow every caller and launch example for an affected role. Include active README/PARKING_LOT summaries and any current human documentation reached by those references. Read each match in context so a historical note, model in evidence, or unrelated role is not accidentally changed. Dated validation reports describe their original commits and stay unchanged.

Build a table with role, source file/step, provider family, exact model/options, thread or subagent transport, and whether the setting is authoritative or a matching example. Include Cooper build/hard roles, How/Why, architect/judge, adversarial reviewers, comment review, verify readers, Improve reflection/eval, Orchestrate workers/verifiers, and Dispatch workers/programs/validator policy. Include the separate support worker contract when the requested change covers it. The table is a review artifact, not a new runtime configuration file.

## Check and recommend

Use the current thread's capability result, calling `orchestrator_capabilities` before its first `delegate_task` or `t3_thread_launch` if not already read and refreshing only after an error or user-named provider change. Inspect enabled instances using [live provider resolution](../cooper/references/delegation.md). Distinguish a disabled instance from an unavailable family/model. Check exact options and launch capability, not only model names. Preserve account-specific instance IDs as runtime observations, never shared defaults. Do not start test workers just to inventory choices.

Flag unavailable models/settings, drift between a declaration and example, lost Claude/GPT diversity, and verifiers on the same model family as their workers. Check that Comment Sicko differs from the build-subagent family, the divergent reflection lens differs from judgment/tooling, and eval candidates cover models Cooper actually runs. A same-family override does not satisfy a second-family gate. Preserve job scope, approval rules, panel counts, ordering and read-only restrictions unless the user explicitly changes them.

For recommendations, show role/file, before and after, evidence, expected quality/latency/cost tradeoff and uncertainty. Availability is not a ranking. Use official provider documentation or observed session evidence for upgrade claims; do not infer superiority from a version number alone. Keep current choices when evidence does not justify a change. No silent fallback is permitted.

## Apply a scoped change

A fully specified user change is already approved. For recommendations or an unspecified upgrade, show the concrete proposed edits and ask through the host's question tool per [Cooper](../cooper/SKILL.md). The recommended choice comes first. Do not apply a model/provider/effort the user has not selected.

Edit authoritative launch steps, their corresponding examples, and affected active documentation summaries in the authoring checkout. Preserve historical validation snapshots. Trace all uses of the affected role and update them together, while preserving deliberately different settings for other roles. Use scoped edits; a global model-name replacement can change unrelated reviewers or historical evidence. Do not invent a role-to-model YAML file, global override layer, or new central runtime registry.

After editing, re-inventory affected launches, validate exact selections against live capabilities, check all relative references and skill/UI metadata, run the repository's validation and diff checks, and exercise representative launch-selection or upgrade flows in an isolated fixture when warranted. A structural check is not proof a live launch succeeded. Report unavailable validation honestly. Commit/push only under the repository's workflow and the user's authorization. Never sync installed skills as a side effect.

**Reply:** affected roles and source paths, old/new model/options, evidence and checks, remaining unavailable choices, and commit/branch when authorized. Show the source map and before/after table per [visuals](../cooper/references/visuals.md).
