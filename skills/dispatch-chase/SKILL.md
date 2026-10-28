---
name: dispatch-chase
disable-model-invocation: true
description: "Run one Dispatch pass over known Bob workers and PRs, process reports, route human gates, and continue already-authorized work. Use for a delivered chase or worker-change notice, or an explicit request; never create a schedule."
---

# Chase

Read the [Dispatch role](../dispatch/SKILL.md), [worker contract](../dispatch/references/bob-workers.md), and **Track** in [work items](../dispatch/references/work-items.md). A scheduled run is merely a trigger to this same procedure, not a broader authorization.

1. Load this bot's instance, board, decisions, saved worker destinations, and pending gates. Finish any brief or board update in hand before processing newly arrived completion hints.
2. Snapshot the known worker changes for this pass. Read reports and pending questions through Executor, plus current PR head, CI, and reviews. Follow pages/truncated messages. A worker-local report path cannot substitute for its T3 reply. Do not scan unrelated threads or wake a worker to ask for status.
3. Drain reports in a batch through [Report](../dispatch/playbooks/report.md), with queue refill deferred until this pass finishes. Save each report with its source marker, update its row and cursor, and preserve any unresolved human gate. New arrivals wait for the next pass. Repeated hints are harmless.
4. Chase concrete problems inside the approved job: send the active Bob a specific failing check or review finding to address. Preserve its design and forbidden actions. Reuse the worker for that job; separate scopes and settled workers get new briefs. An interrupted or idle run without a report is not automatically dead. Read the latest run and pending input before deciding whether to continue, report access failure, or propose replacement.
5. Keep merge-ready PRs owned and visible until Dan's merge decision. A new head SHA invalidates the old verification claim. Obtain fresh verification through Bob. Dispatch never fixes code or merges. A change that needs Dan gets a gate with exact options and worker link, while independent authorized work may continue.
6. Account for every known worker: working, waiting on Dan, waiting on access, awaiting merge, finished, or explicitly abandoned. These are notes on the existing board states. Flag no meaningful update for `stalled_after_hours`; report what was checked and last observed. Retry only a cause understood within the same authorization. After repeated failure, stop the affected job and surface the blocker rather than silently substituting a provider or design.
7. Settle completed workers only after the shared checks. Recompute capacity and dependencies, then launch the next already-authorized units within limits. A pause or stop recorded by Dan prevents refills. Planning work obeys Wayfinder's active-map rules; ordinary chase cannot start it.
8. Save the board and decisions before ending. Surface newly blocked-on-Dan, merge-ready, or finished work; keep healthy routine activity for the digest. An unconfigured native bot route means no automatic wakeup guarantee. Record the last successful chase so Fleet Control can detect missed cycles.

Status and digest callers use reconciliation-only mode: read/copy reports and surface gates, but skip follow-ups that start work, launches, refills, and settlement. A Fleet Control event that supplies evidence to Wayfinder cannot advance its human decisions or refill planning workers.
