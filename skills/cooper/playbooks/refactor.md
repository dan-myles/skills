# Refactor

The structure is yours to change. The behavior isn't.

Feature adds behavior and Bug corrects it; a refactor does neither. When the cleanup turns up a bug or a missing feature, note it, finish the refactor against the pinned behavior, and offer the other as its own task. A redesign that changes what users see is a Feature. When the work spans many modules or needs phases, say it's too big for one refactor and propose how to split it.

1. Pin the behavior. Run `cooper-how` over the area to learn what it does today, then capture that before anything moves: a characterization test, a snapshot, or a script that diffs old and new outputs. If the area has no coverage, the pin comes first. Types and lint aren't a pin. Commit the pin on its own. Show the area as a file map per **File maps** in `references/visuals.md`.
2. Name what the code is missing, per `model-the-domain`: the state machine, typed model, or lookup table its branches are standing in for. Leave plain code alone when its shape is already clear and local. The reshape has to remove branches, duplicated rules, or bad states, not add layers.
3. Name the target shape. When the target changes the schema, infrastructure, a public interface, or another call that's the user's (see **When** in `../cooper-grill/SKILL.md`), that's a **Checkpoint**: run `cooper-grill` first. Then draw it: the module layout, types, and call graph you'd build today, per `redesign-from-first-principles`. When it crosses modules, run `cooper-architect` and build against its sketch. Show the pin and the target shape as before-and-after file maps and keep going; nothing else here stops for the user.
4. Delete first, per `subtract-before-you-add`: dead code, wrappers with one caller, redundant checks, stale references. Rerun the pin, then commit the deletions before the reshape.
5. Reshape in small steps, verifying each, per `sequence-verifiable-units`. Brief subagents with the files, the names that move, the behavior to hold, and the pin as the check. The subagent runs the pin and reports its output; rerun it yourself before you commit the step, and don't start the next step until it passes.
   - Replacing an API: move every caller and delete the old one in the same change, per `migrate-callers-then-delete-legacy-apis`. No shims, no old and new paths side by side.
   - Mechanical edits get a codemod or script, per `build-the-lever`.
   - Check renames by hand. Strings, docs, and config hide usages a symbol search misses.
6. Decide it's worth keeping, per `minimize-reader-load`. Somewhere there should be fewer layers to trace or less state to hold. If there aren't, revert it and say so. This comes before Review so nothing reverted gets reviewed.
7. Review per **Review** in the skill. A refactor usually reaches past its diff, so `cooper-blast-radius` usually applies. It comes before the final check because its fixes change code.
8. Verify on the final code that nothing changed, shown as a **Proof gallery** per `references/visuals.md`. Rerun the pin and the repo's checks, and drive every entry point the change touches on the real app. For a larger move, run the old-against-new diff. Any code change after this, including a Babysit fix, reruns this check for what it touched before it's pushed.
9. Ship it: order the commits as pin, deletions, reshape, then follow-on cleanup, and run `playbooks/open-pr.md`, which opens a ready-for-review PR and babysits it. Stop when Open PR stops.

**Reply:** the structure that changed, the pin and the proof behavior held, what got easier to read (layers or state removed), what you reverted, any bug or feature you split out, and the branch it's committed on. No new behavior. **Show:** before-and-after file maps, with what was deleted, moved, and added badged.

**End-of-work reply:** follow the [required interactive recap](../references/visuals.md#required-end-of-work-recap), with the built-work recap in the visual, `html_preview` then `html_render` before concise caveats and handoff links. This also applies when this playbook ends in a PR or babysit handoff.
