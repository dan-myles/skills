# The board

`<state_dir>/board.md` is the human-readable source of truth. Keep one board per store, with a status timestamp and stable item IDs. Each item occurs once in the reading sections; link its brief/report for details. Follow the fields and states in [project state](project-state.md).

Use these sections in this order:

1. **Now**: currently executing workers, what they are doing, actual model/effort if known, exact worker links, PR/head, and gates. Say plainly when none is running.
2. **Backlog**: queued work, proposals, dependencies, work waiting on a user decision/access/merge, and why it cannot start or finish. Keep merge-ready PRs and worker links visible here until they merge. Waiting on a merge is not executing work.
3. **What landed**: merged implementation or accepted no-PR findings, with evidence and caveats. A model turn ending or an open merge-ready PR does not count as landed.
4. **Watch and links**: risks, inaccessible evidence, and source/artifact links behind the work.

Do not add Recent activity or Waiting on you sections. The running history belongs in `journal.md`; decisions/gates belong on the relevant item in Backlog. Show urgent human gates prominently in the chat handoff with worker links.

Update the saved board when workers launch, gate, finish, or status reconciliation changes evidence. It must not disagree with its saved reports or journal. A non-owner's status leaves files unchanged and labels live observations separately.

For an inline T3 view, render the saved sections as tabs with counts, Now selected by default, through `html_preview` then `html_render` when available. Keep this view disposable and derived from the Markdown. It requires no external canvas ID, Page service, or additional source of truth. A rendered view is not the Git checkpoint.
