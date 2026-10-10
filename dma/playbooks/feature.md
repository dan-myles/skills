# Feature

The design is yours. Hand off the typing, keep the decisions.

1. Learn the ground first. Run `how` over the area the change touches: its code paths, data shapes, and module boundaries. Read what the repo's rules say about that area. When the design would rework code that looks deliberate, run `why` on it too and carry its Keep/Change/Avoid/Risk into the draft.
2. Draft the design: the data shape and its structure, where it lives, its public signatures, and how current code will call it. Bring two drafts only when two directions are both reasonable. **Checkpoint:** show the draft and wait for the user to agree before writing code, unless they said to skip this.
3. Plan the work as four todo items. Keep an item that doesn't apply, marked `n/a: <why>`.
   - **Goes first.** Anything the rest depends on: schemas, API specs, shared types, generated code.
   - **Runs in parallel.** Pieces in separate files, services, or layers.
   - **Contended.** Files or resources more than one worker would edit. Split them up, or do them one at a time.
   - **Worker count.** How many workers, and the reason.
4. Build it. Brief subagents from the plan with files, data shape, and what done looks like. Finish the "goes first" work, then run the parallel pieces together. Commit each piece once it works.
5. Check it where the user will meet it: the page, the screen, the endpoint, the command. Run the repo's checks. A check that's unclear or on the wrong surface hasn't passed. Report it that way.
6. Review per **Review** in the skill.
7. Run **Opening the PR**. Features end at an open PR.

**Reply:** what you built and for whom, the choices you made and why (a table when you weighed options), the evidence that it works, the PR link, and anything still undecided.
