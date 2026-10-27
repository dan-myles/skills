# Feature

The design is yours. Hand off the typing, keep the decisions.

1. Learn the ground first. Run `bob-how` over the area the change touches: its code paths, data shapes, and module boundaries. Read what the repo's rules say about that area. When the design would rework code that looks deliberate, run `bob-why` on it too and carry its Keep/Change/Avoid/Risk into the draft. Show what you learned as a file map per **File maps** in `references/visuals.md`: the area's existing files and how they connect, before drafting.
2. When the feature is complex and leaves several decisions only the user can make (see **When** in `../bob-grill/SKILL.md`), run `bob-grill` before drafting, and design from the decisions it saves. Otherwise mark this `skip: <why>`.
3. Draft the design: the data shape and its structure, where it lives, its public signatures, and how current code will call it, per `model-the-domain` and `foundational-thinking`. When it lands in an existing design, also `redesign-from-first-principles`. When the change adds a service, a module, or a public interface, or moves ownership between modules, run `bob-architect` for the draft. Otherwise draft it yourself. Show the draft with a file map of where every new and changed file goes, and keep going: the design is yours. Stop for the user only when the work is complex and needs a decision from them: a product or taste call the request and the code don't settle, a one-way door like a data migration, deleting data, or breaking a public API. Then it's a **Checkpoint**: the draft, two directions if both are reasonable, and your pick. Small changes never stop, even in sensitive areas, unless they'd change a call under **Decided stays decided** in the skill; Review's `bob-blast-radius` and `bob-adversarial-review` cover their risk.
4. Plan the work as four todo items. Keep an item that doesn't apply, marked `n/a: <why>`.
   - **Goes first.** Anything the rest depends on: schemas, API specs, shared types, generated code.
   - **Runs in parallel.** Pieces in separate files, services, or layers.
   - **Contended.** Files or resources more than one worker would edit. Split them up, or do them one at a time.
   - **Worker count.** How many workers, and the reason.
5. Build it. Brief subagents from the plan with files, data shape, and what done looks like. Finish the "goes first" work, then run the parallel pieces together. Commit each piece once it works (`sequence-verifiable-units`). Repetitive edits get a script, per `build-the-lever`. A `bob-architect` sketch is the contract: follow its **Building against the sketch** and **Scrapping it** sections.
6. Check it, and show it as a **Proof gallery** per `references/visuals.md`. Check it where the user will meet it: the page, the screen, the endpoint, the command, through the repo's verify skill when it has one. Run the repo's checks. A check that's unclear or on the wrong surface hasn't passed. Report it that way.
7. Review per **Review** in the skill.
8. Stop with the work committed on its branch, unpushed. No PR until the user asks; then it's `playbooks/open-pr.md`.

**Reply:** what you built and for whom, the choices you made and why (a table when you weighed options), the evidence that it works, the branch it's committed on, and anything still undecided. **Show:** the file map of what changed, badged, plus a table when you weighed options.
