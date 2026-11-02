# The board

The board is a view of the Beads graph under this Dispatch's root, joined with live T3 and PR evidence from the current pass. The graph is authoritative; nothing about the board is saved separately. Follow the fields and placement in [board data](board-data.md).

Sections, in order:

1. **Now**: every open Cooper, until it is settled: running, idle, finished but unsettled, or waiting on Dan, a merge or review. Show its runtime, actual model/effort if known, exact worker link, PR/head and gates. A completed run does not move it out. Say plainly how many are open and how many are running right now.
2. **Backlog**: queued work, proposals, dependencies and work with no open Cooper, and why it cannot start or finish.
3. **What landed**: merged implementation or accepted no-PR findings, with evidence and caveats. A model turn ending or an open merge-ready PR does not count as landed.
4. **Watch and links**: risks, inaccessible evidence, external coordination and the source links behind the work.

History lives in issue comments and `bd history`, not on the board. Decisions and gates appear on the item they block. Show urgent human gates prominently in the chat handoff with worker links.

After every state-changing update, render the board in the same T3 turn: setup, intake, launches, reports, chase, gates, decisions, and completion. Render after each coherent update batch before handing back; do not wait for a status request or the next digest. Status/digest also shows the board when nothing changed.

Render the sections as tabs with counts, Now selected by default, through `html_preview` then `html_render`. Never substitute an old render. If rendering tools are unavailable or fail, show a compact Markdown board from the same data and state the rendering gap. This view needs no external canvas ID or Page service.

Keep text below the board to one to three short lines: the material change, any decision needed, or the next action. Put item detail, counts, status, evidence, and links in the board instead of repeating them below. A required failure or approval explanation may take the space it needs.

## Reconcile before presenting

Before every status/chase, snapshot the owner of every in_progress or assigned issue, and of every closed issue without `t3.settled`: exact runtime status, active/latest run ID and status, and pending input count. Read new messages and comments since `t3.cursor`, including user follow-ups after final reports. Check current PR head, checks and reviews, and run `bd gate check`. Follow truncated relevant evidence, without scanning unrelated threads. Never wake or launch a worker to obtain status.

A past final answer is historical evidence, not current runtime. An open worker stays in Now whatever its last report said. Keep runtime separate from acceptance, merge and deployment. An idle run may still own an open job. Missing access remains an explicit unverified gap. If the graph and live observations disagree, resolve them before presenting or label the uncertainty. A non-owner renders the same view without writing to the graph.

## Required renderer

Use [scripts/render-board.py](../scripts/render-board.py) with the shipped [template](../assets/board.html), [styles](../assets/board.css), and [interaction script](../assets/board.js). Preserve this appearance across repositories. Do not replace it with a newly improvised dashboard.

The standard is responsive themed issue cards, Now / Backlog / What landed / Watch and links tabs with truthful counts, Now default, search, keyboard-accessible tabs and collapsible evidence. Every issue has a one-sentence outcome and cause/effect or before/after schematic; set `board.summary` and `board.visual` when creating it. Add mini screens, buttons or gesture sketches when useful, explicitly labelled schematic. Never invent screenshots, measurements, progress percentages or deployment claims. Keep actual worker, PR, tracker and source links prominent, with status and gates visible. Use theme variables and no page background or outer frame.

Export the graph, write the live file, run the renderer and inspect its warnings. Read the newly generated HTML, call `html_preview`, then `html_render` in the same turn. Check mobile and desktop when changing the renderer. Never reuse a stale HTML file.
