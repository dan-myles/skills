# Report

A worker reported back with `/dispatch report <id>`, or tracking found an unread report. Finish the step in hand before processing it.

Preserve the calling playbook's limits. Status reconciliation skips all launches; Brief reconciliation skips planning launches. A direct worker completion may refill authorized research under Wayfinder's active-map rules.

1. Resolve the board item and read `<state_dir>/reports/<id>.md`. Recover its owning worker's exact thread id and title from the board, launch result, and live T3 metadata. A repeat report changes nothing unless it contains new evidence.
2. A validator report (`<id>-validate`) settles that bug's **a second model confirmed it** check in `../references/work-items.md`. CONFIRMED dispatches it through **Dispatch** when the other auto-dispatch conditions and caps still hold. On REJECTED, or when those no longer hold, the row becomes `proposed` with the reason. Settle the validator thread per `../../bob/references/settling.md`, then skip to step 7.
3. If the item belongs to a Wayfinder map, read **Process planning reports** in `wayfinder.md` and follow that path. Do not send it through implementation or PR handling below.
4. For an implementation item, read its PR and update the board. Call `watch_pull_request` on a new PR so checks and reviews wake this Dispatch. Preserve owning worker links in every review handoff, per the skill.
5. Check the report's decisions against DECIDED and Bob's reserved calls. A departure keeps the item open and reaches the user as a recommendation, never as a decision already taken.
6. Settle the worker only when its report is final and it passes `../../bob/references/settling.md`. A PR waiting on the user keeps its worker active.
7. Dispatch the next already-authorized implementation item if there is capacity, using `../references/work-items.md`. This does not authorize a Wayfinder-to-build handoff.

Write the board before ending. Reply only when the user is needed or something failed. A report that lacks a report-back is a defect; process it and note the missing delivery in the brief.
