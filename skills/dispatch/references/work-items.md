# Work items

Shared coordination for delivered work. This procedure never starts Wayfinder automatically.

## Triage

1. Read the delivered item, replies, material attachments, linked context, and relevant tracker records within this instance's scope. Honor disabled sources. Flag a routing mismatch instead of adopting another repo's work.
2. Trace only from available evidence. Repo code/history reading, reproduction, and validation go to a read-only Cooper Investigation via the [worker contract](cooper-workers.md). Cooper can use its own how/why helpers on T3. Do not treat a visible symptom or inaccessible code as proof of cause.
3. Classify bug, perf, feature, question, or noise. Dedupe against board, seen IDs, and tracker by source link, signature, and area. An unclear bug-versus-feature call stays a question for Dan.
4. File only a clear new bug in the configured tracker, with evidence and source link. Do not set priority or assign people. Record its board row and seen ID; preserve a proposal when evidence is insufficient.

## Decide

Auto-dispatch only when the configured contained-bug policy allows it, within `auto_dispatch.per_run` and execution capacity:

- Clear reproduction or exact error signature confirms a bug in this configured repo and a bounded area.
- No auth, money, stored data, migrations, public API, or configured `never_paths` work is involved.
- A second model validates it. Use a separate read-only Cooper validator with evidence, scope, no PR or writes, and a CONFIRMED/REJECTED report in its T3 reply. Record its exact worker identity and model, and keep the item `triaged` until its report is processed. The Grok Bot's model is not inferred from T3. If model diversity cannot be verified, leave the item proposed for Dan rather than claiming the condition passed.

Use the [shared launch setting](cooper-workers.md) for Coopers. If its model does not meet the second-model requirement, an explicitly configured, catalog-verified validator override is required before auto-dispatch. Do not change Cooper's global model defaults to satisfy it.

An ambiguous goal, scope, desired behavior, or reserved choice is not auto-dispatched. Follow the [human decision rules](decisions.md). Propose other work with impact, effort, evidence, and a recommendation. Approval applies only to the chosen scope. Unresolved Wayfinder items never enter this implementation path.

## Dispatch

Write and launch the brief through [dispatch-decompose](../../dispatch-decompose/SKILL.md) and the [worker contract](cooper-workers.md). Save exact worker ID/title/link, destination, and launch result. Titles are `cooper: <plain job description>`; ticket IDs belong in the brief. Do not use the bot identity as REPORT-BACK's T3 address or ask workers to write box-local reports.

An authorized unit's dependency must have accepted evidence before launch. Count executing workers and uncertain launches against capacity. Keep open-PR ownership distinct from execution capacity. No coding, verification, prototype, or restack is performed by Dispatch itself.

## Track

Read every known active worker and pending validator without disturbing them, through the saved Executor app. Also reconcile `done` rows whose worker has not been settled yet. Use the shared report source markers to avoid duplicate processing.

- Process unread reports through [Report](../playbooks/report.md). A T3 reply without a bot notification is normal for this transport, not a report-back defect.
- Show human questions and approvals first, with the owning worker link. Never answer them on Dan's behalf.
- For implementation, verify current PR/head/check/review state. A merge-ready PR becomes `merge-ready` and remains owned until merged, closed, abandoned, or explicitly handed back. Missing evidence is not a passing check.
- A no-PR investigation can finish when its evidence and follow-ups are accepted. Record inaccessible artifacts and leave dependent work blocked.
- A meaningful update older than `stalled_after_hours` gets flagged with its last observed action. Read the latest run before reporting a failure; a previously failed run may already have recovered.
- Reuse a Cooper for concrete follow-up on the same active job. Never message just to ask for status. Settled threads and separate jobs get fresh briefs. Reconcile uncertain launches before retries.
- Settle only through the shared checks after the item is final. An open PR or pending Dan input keeps the worker active.

Status/digest runs only read, copy reports, update evidence, and surface gates. They skip launches, refills, work-starting follow-ups, and settlement. An event can attach evidence to a Wayfinder ticket but cannot refill planning workers. Chase/report processing may refill only its already-approved scope.
