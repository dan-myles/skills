---
name: dispatch-digest
disable-model-invocation: true
description: "Produce a repo-level Dispatch digest or read-only status from the board and live worker evidence. Group human gates, ready PRs, active work, and routine changes; never launch work from a digest."
---

# Digest

Read the [Dispatch role](../dispatch/SKILL.md). Reconcile known workers through [Chase](../dispatch-chase/SKILL.md) in reconciliation-only mode. Both status and brief calls skip launches, queue refills, work-starting follow-ups, and settlement. A request for status is not approval to acknowledge customers or to resume a paused job.

Build the response from the saved board and current thread/PR state, never conversation memory. Put four bands on the board:

- Fires: a pending Dan decision, urgent failure, missing access, or stalled work, with evidence and the owning worker link.
- Today: decisions, proposals, completed findings, and merge-ready PRs. Keep the actual owning Bob link beside each PR.
- Waiting: active workers and dependencies; group Wayfinder maps separately with their current question, owners, and gates.
- FYI: deduped/dropped items, routine progress, and source/destination failures.

State what changed since the last digest, what needs Dan, and what remains owned. Count from the board; name inaccessible evidence. If nothing changed, say "Nothing new since <time>." and stop. Show an activity board or timeline using the host's available visual tools when useful; no dependency on a T3-only rendering skill exists on the box.

Fleet Control aggregates the repo summaries into one cross-machine digest. Pass only scoped status and human gates through a verified native bot route or a shared box-local summary; do not post to people or channels without authorization. Do not copy customer details into a global digest. The support skill owns its interactive case presentation.
