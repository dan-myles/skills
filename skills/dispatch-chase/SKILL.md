---
name: dispatch-chase
disable-model-invocation: true
description: "Run one Dispatch pass over known Cooper workers and PRs, process reports, route human gates, and continue already-authorized work. Use for a delivered chase or worker-change notice, or an explicit request; never create a schedule."
---

# Chase

Verify current store ownership and synchronized Git state per [project state](../dispatch/references/project-state.md) before any state write or worker action. A non-owner may inspect only; takeover must be explicit.

Read the [Dispatch role](../dispatch/SKILL.md), [worker contract](../dispatch/references/cooper-workers.md), and **Track** in [work items](../dispatch/references/work-items.md). A scheduled run is merely a trigger to this same procedure, not a broader authorization.

1. Load this thread's selected store and verified ownership, board, decisions, saved worker destinations, and pending gates. Finish any brief or board update in hand before processing newly arrived completion hints.
2. Follow [freshness reconciliation](../dispatch/references/board-page.md#reconcile-before-presenting): snapshot every known owner's exact live runtime, latest/active run, pending input and bounded new activity since the saved cursor. A past final report cannot establish current completion; resumed execution goes back to Now. Record per-worker verification timestamps and distinguish active local owners from cards and external coordination. Read reports and pending questions through T3, plus current PR head, CI, and reviews. Follow pages/truncated messages. A worker-local report path cannot substitute for its T3 reply. Do not scan unrelated threads or wake a worker to ask for status.
3. Drain reports in a batch through [Report](../dispatch/playbooks/report.md), with queue refill deferred until this pass finishes. Save each report with its source marker, update its row and cursor, and preserve any unresolved human gate. New arrivals wait for the next pass. Repeated hints are harmless.
4. Chase concrete problems inside the approved job: send the active Cooper a specific failing check or review finding to address. Preserve its design and forbidden actions. Reuse the worker for that job; separate scopes and settled workers get new briefs. An interrupted or idle run without a report is not automatically dead. Read the latest run and pending input before deciding whether to continue, report access failure, or propose replacement.
5. Keep merge-ready PRs owned and visible until Dan's merge decision. A new head SHA invalidates the old verification claim. Obtain fresh verification through Cooper. Dispatch never fixes code or merges. A change that needs Dan gets a gate with exact options and worker link, while independent authorized work may continue.
6. Account for every known worker: working, waiting on Dan, waiting on access, awaiting merge, finished, or explicitly abandoned. These are notes on the board states. Flag no meaningful update for the store's Stalled after hours threshold; report what was checked and last observed. Retry only a cause understood within the same authorization. After repeated failure, stop the affected job and surface the blocker rather than silently substituting a provider or design.
7. Settle completed workers only after the shared checks. Recompute capacity and dependencies, then launch the next already-authorized units within limits. A pause or stop recorded by Dan prevents refills. Planning work obeys Wayfinder's active-map rules; ordinary chase cannot start it.
8. Save the board and journal before ending. Now reflects executing workers; accepted no-PR findings or merged work moves to What landed. Open merge-ready PRs remain owned in Backlog. Follow [the board](../dispatch/references/board-page.md). Surface newly blocked-on-Dan, merge-ready, or finished work; keep healthy source-thread chatter for the digest, but always render the freshly saved board in this turn. Record the last successful chase in the journal. A notification or user request can trigger the next pass; no cadence is created or promised.

Status and digest callers use reconciliation-only mode: read/copy reports and surface gates, but skip follow-ups that start work, launches, refills, and settlement. An external event that supplies evidence to Wayfinder cannot advance its human decisions or refill planning workers.
