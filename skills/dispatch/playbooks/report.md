# Report

Verify current store ownership and synchronized Git state per [project state](../references/project-state.md) before any state write or worker action. A non-owner may inspect only; takeover must be explicit.

A direct `/dispatch report <id>` request or a chase found a worker report. Finish the step in hand, then process it. Read the [worker contract](../references/cooper-workers.md).

1. Resolve the board item, owning worker, and saved T3 destination. Read the complete T3 reply, not a file path on Mac Studio or Paperclip. Recover exact title/ID/link from saved launch data and live metadata. Save a shareable report under `<state_dir>/reports/<item>-<attempt>-<revision>.md` with source item/position, timestamp, owner generation and head before changing its board marker. Preserve restricted evidence by reference with omissions noted, per project-state. A repeat source marker does not start work again.
2. Check reported decisions against DECIDED and [reserved choices](../references/decisions.md). A departure remains a gate, even when checks pass. Report missing evidence precisely. Preserve Dan's questions and approvals with their owning worker links.
3. For a validator, read CONFIRMED/REJECTED and the model evidence. Recheck every auto-dispatch condition and capacity; otherwise propose it. Settle only after the shared checks. Do not dispatch a duplicate implementation for a validator report processed before a crash.
4. A Wayfinder result follows **Process planning reports** in [Wayfinder](wayfinder.md). Research evidence is not a user choice or build approval. Respect active/paused map and caller limits.
5. For implementation, read current PR/head/check/review state and update ownership. A new head needs fresh verification. Cooper owns its authorized PR watches; report notifications and explicit chase reconcile the Dispatch board. Put merge-ready work on Dan's list with the actual owning worker link beside each PR. Never merge.
6. A final report does not finish an open-PR job. Settle only after all shared checks, acceptance or explicit handback, and safe artifact preservation. Save follow-ups as separate items, not silent scope expansion.
7. After the batch, recompute authorized ready work and capacity. A direct report/chase may refill existing authorization; status/digest skips all launches and settlement. Externally delivered Wayfinder evidence cannot start or refill planning. Write the board before ending.

Healthy routine changes wait for the digest. Surface newly blocked-on-Dan, merge-ready, or finished work. Record missing reports or failed required T3 notifications as their actual failure, without duplicating workers.
