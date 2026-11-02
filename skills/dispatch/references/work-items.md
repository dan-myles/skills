# Work items

Shared coordination for delivered work, recorded in the Beads graph per [project state](project-state.md). This procedure never starts Wayfinder automatically.

## Triage

1. Read the delivered item, replies, material attachments, linked context, and relevant tracker records within this root's repository scope. Honor disabled sources. Flag a routing mismatch instead of adopting another repo's work.
2. Trace only from available evidence. Repo code/history reading, reproduction, and validation go to a read-only Cooper Investigation via the [worker contract](cooper-workers.md). Cooper can use its own how/why helpers on T3. Do not treat a visible symptom or inaccessible code as proof of cause.
3. Classify bug, perf, feature, question, or noise. Dedupe by `source.id`, `bd search`, and `bd find-duplicates` against this root's descendants and any external mirror, by source link, signature, and area. A repeat delivery updates the existing issue with a comment. An unclear bug-versus-feature call stays a question for Dan.
4. Record new work as an issue under the root, labelled `triage`, with source metadata and evidence. Mirror a clear new bug to a configured external tracker with its link as `--external-ref`. Do not set people's priorities or assign people in external trackers. Keep insufficient evidence as an open proposal.

## Decide

Auto-dispatch only when the root's contained-bug policy allows it, within its per-pass limit and execution capacity:

- Clear reproduction or exact error signature confirms a bug in this repo and a bounded area.
- No auth, money, stored data, migrations, public API, or never-path work is involved.
- A second model validates it. Use a separate read-only Cooper validator (`spike`, `discovered-from` the bug, `approved` citing the policy) with evidence, scope, no PR or writes, and a CONFIRMED/REJECTED report. Record its exact worker identity and model, and keep the bug in `triage` until its report is processed. Verify this Dispatch thread's actual model from T3 metadata. If model diversity cannot be verified, leave the bug proposed for Dan rather than claiming the condition passed.

Use the [shared launch setting](cooper-workers.md) for Coopers. If its model does not meet the second-model requirement, an explicitly configured different validator verified through the worker contract is required before auto-dispatch. Do not change Cooper's global model defaults to satisfy it. Auto-dispatched bugs get `approved` with a comment citing the policy and validator report, and `merge:human` unless the merge policy plainly allows `auto`.

An ambiguous goal, scope, desired behavior, or reserved choice is not auto-dispatched. Follow the [human decision rules](decisions.md). Propose other work with impact, effort, evidence, and a recommendation. Approval applies only to the chosen scope; record it with `approved` and a comment quoting its source. Unresolved Wayfinder items never enter this implementation path.

## Dispatch

Write and launch the brief through [dispatch-decompose](../../dispatch-decompose/SKILL.md) and the [worker contract](cooper-workers.md). Titles are `cooper: <plain job description>`; issue IDs belong in the brief. REPORT-BACK names the exact current owner thread and the issue's attempt.

Launch only issues that are `approved` and appear in `bd ready`, so every `blocks` prerequisite has closed with accepted evidence. Count in_progress workers and uncertain launches against capacity. Keep open-PR ownership distinct from execution capacity. No coding, verification, prototype, or restack is performed by Dispatch itself.

## Track

Read every known active worker and pending validator without disturbing them, on the saved, verified T3 destination, alongside its issue and new comments. Also reconcile closed issues whose worker has not been settled yet. Use `t3.cursor` to avoid duplicate processing.

- Process unread reports through [Report](../playbooks/report.md). A missing required T3 notification is a delivery defect; process a visible report anyway and record the gap.
- Show open `human` decisions first, with the owning worker link. Never answer them on Dan's behalf.
- For implementation, verify current PR/head/check/review state against `pr.head`. A merge-ready PR stays owned until merged, closed, abandoned, or explicitly handed back. Missing evidence is not a passing check. Run `bd gate check` so merged PRs resolve their `gh:pr` gates.
- A no-PR investigation can close when its evidence and follow-ups are accepted. Record inaccessible artifacts and leave dependent work blocked.
- Flag anything `bd stale --days <threshold in days, rounded up>` reports under the root with its last observed action. Read the latest run before reporting a failure; a previously failed run may already have recovered.
- Triage new `discovered-from` follow-ups; workers' findings never launch themselves.
- Reuse a Cooper for concrete follow-up on the same active job. Never message just to ask for status. Settled threads and separate jobs get new attempts. Reconcile uncertain launches before retries.
- Settle only through the shared checks after the issue is final. An open PR or pending Dan input keeps the worker active.

Status/digest runs only read, record report evidence, and surface gates. They skip launches, refills, work-starting follow-ups, and settlement. An event can attach evidence to a Wayfinder ticket but cannot refill planning workers. Chase/report processing may refill only its already-approved scope.
