# The board

`<state_dir>/board.md` is the human-readable source of truth. Keep one board per store, with a status timestamp and stable item IDs. Each item occurs once in the reading sections; link its brief/report for details. Follow the fields and states in [project state](project-state.md).

Use these sections in this order:

1. **Now**: every open Cooper, until it is settled: running, idle, finished but unsettled, or waiting on Dan, a merge or review. Show its runtime, actual model/effort if known, exact worker link, PR/head and gates. A completed run does not move it out. Say plainly how many are open and how many are running right now.
2. **Backlog**: queued work, proposals, dependencies, and work with no open Cooper waiting on a user decision, access or merge, and why it cannot start or finish. Keep merge-ready PRs and worker links visible until they merge.
3. **What landed**: merged implementation or accepted no-PR findings, with evidence and caveats. A model turn ending or an open merge-ready PR does not count as landed.
4. **Watch and links**: risks, inaccessible evidence, and source/artifact links behind the work.

Do not add Recent activity or Waiting on you sections. The running history belongs in `journal.md`; decisions/gates belong on the relevant item in Backlog. Show urgent human gates prominently in the chat handoff with worker links.

Update the saved board when workers launch, gate, finish, or status reconciliation changes evidence. It must not disagree with its saved reports or journal. A non-owner's status leaves files unchanged and labels live observations separately.

After every state-changing update, show the freshly saved board in the same T3 turn, including updates from setup, intake, launches, reports, chase, gates, decisions, and completion. Render after each coherent update batch before handing back; do not wait for a status request or the next digest. Status/digest also shows the board when nothing changed.

Render the saved sections as tabs with counts, Now selected by default, through `html_preview` then `html_render`. Keep the view derived from the current Markdown with its timestamp, worker/PR links, and gates. Do not substitute an old render or only link to board.md. If rendering tools are unavailable or fail, show a compact Markdown board and state the rendering gap. This view needs no external canvas ID, Page service, or additional source of truth. A rendered view is not the Git checkpoint.

Keep text below the board to one to three short lines: the material change, any decision needed, or the next action. Put item detail, counts, status, evidence, and links in the board instead of repeating them below. If the board is sufficient, omit extra prose. A required failure or approval explanation may take the space it needs.

## Reconcile before presenting

Saved owners and old final replies cannot show a worker that resumed or started since. Status and chase therefore read the project's live thread list twice:

1. **Entry list.** At entry, call `t3_thread_list` with the exact repository `projectId` (and `environmentId` for another machine), `statuses: ["running", "starting", "preparing", "queued", "waiting"]` and `limit: 100`. Follow `nextCursor` until it is null. Match each thread to known owners by exact thread ID; add any running Cooper you didn't know. Never list other projects or `allProjects`.
2. **Owner reads.** Then, for each owner, snapshot the details below.
3. **Final list.** After owner, activity and PR reconciliation, immediately before saving the board or stating any count, read the same list again, every page. For each relevant thread whose state changed since its owner read, read its exact active/latest run, pending input and bounded new activity, update its card, and place it by the new state.

Exclude this Dispatch thread, and count a thread repeated across pages once. Write the final list's result as a board header line: `Live list: complete at <UTC>` only when its last page had no `nextCursor`, nothing failed, and it read every one of `total` threads; otherwise `Live list: incomplete at <UTC>; total unknown`. Anything but a complete line makes the running count a lower bound with the total unknown, never zero. A thread that resumes after the final list shows on the next pass; state the list's time, and never promise an atomic or live count.

Before every status/chase, snapshot every known board owner and every worker not yet settled: exact runtime status, active/latest run ID and status, and pending input count. Read bounded new messages/activity since saved cursors, including user follow-ups after final reports. Check current PR head, checks and reviews. Follow truncated relevant evidence, without scanning unrelated threads. Never wake or launch a worker to obtain status.

A past final answer is historical evidence, not current runtime. An open worker stays in Now whatever its last report said, and a resumed one shows its current runtime, not "awaiting review" from that report. Record `Runtime`, `Verified`, `Run`, `Pending input` and evidence cursors on its card. Keep runtime separate from acceptance, merge and deployment. An idle run may still own an open job. Missing access remains an explicit unverified gap. Do not present stale saved counts as live facts.

Count distinct open worker owners and those running right now separately from each other and from issue cards. Show cross-project coordination separately, excluded from local worker totals. Record a last-verified timestamp for each worker and the saved board timestamp. If observations disagree, resolve them before presenting or label the uncertainty. A non-owner keeps live observations separate from the unchanged saved board.

## Required renderer

Use [scripts/render-board.py](../scripts/render-board.py) with the [saved data contract](board-data.md) and shipped [template](../assets/board.html), [styles](../assets/board.css), and [interaction script](../assets/board.js). Preserve this appearance across repositories. Do not replace it with a newly improvised dashboard.

The standard is responsive themed issue cards, Now / Backlog / What landed / Watch and links tabs with truthful counts, Now default, search, keyboard-accessible tabs and collapsible evidence. Every issue has a one-sentence outcome and cause/effect or before/after schematic. Add mini screens, buttons or gesture sketches when useful, explicitly labelled schematic. Never invent screenshots, measurements, progress percentages or deployment claims. Keep actual worker, PR, Linear and source links prominent, with status and gates visible. Use theme variables and no page background or outer frame.

After saving current Markdown, run the renderer and inspect its warnings. Read the newly generated HTML, call `html_preview`, then `html_render` in the same turn. Check mobile and desktop when changing the renderer. Never reuse a stale HTML file. If rendering fails, explicitly state the gap and use only the compact Markdown fallback. Keep publication and privacy rules unchanged.
