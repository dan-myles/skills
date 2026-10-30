---
name: dispatch-digest
disable-model-invocation: true
description: "Show one repository's Dispatch status from its Markdown board and live worker evidence. Reconcile reports and surface gates without launching, resuming, retargeting, or settling workers."
---

# Digest

Read the [Dispatch role](../dispatch/SKILL.md) and [project state](../dispatch/references/project-state.md). Select the store explicitly or by verified ownership. Build status from its board and current worker/PR evidence, never memory.

The current owner uses [Chase](../dispatch-chase/SKILL.md) in reconciliation-only mode: read/copy shareable reports, update evidence and surface gates, but skip launches, queue refills, work-starting follow-ups, retargeting and settlement. A non-owner or stale/offline checkout only reads and displays observations, with no file/cursor writes. Status never initiates takeover or resumes a pause.

Follow [the board](../dispatch/references/board-page.md): Now, Backlog, What landed, Watch and links. Keep urgent user gates visible in the chat, and the actual owning Cooper link beside every review-ready PR. Group explicit Wayfinder maps with their questions and owners; status never advances human decisions or starts planning work.

State the store/owner generation, timestamp, running work, what changed, what needs the user, and what remains owned. Distinguish saved evidence from live observations. An inaccessible prior-user thread stays waiting on access with its last verified source/time/head; saved green checks are not current verification. No cross-project aggregation or Fleet Control handoff is required.

For the current owner, automatically commit and push changed evidence documents and journal markers with `[skip ci]` under the project-state contract. If nothing changed, say "Nothing new since <time>." An inline T3 board may be rendered from the Markdown; no external Page is required.
