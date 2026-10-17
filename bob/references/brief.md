# The brief

How a coordinator (Orchestrate, or Frank) hands work to a Bob thread. The worker starts with none of the coordinator's conversation and can't ask it anything, so a vague brief fails quietly. The brief is the product. Synara mechanics are in `synara.md`.

Every field filled, or the work isn't scoped yet and doesn't go out. Size it to the work: a one-command unit gets a paragraph that still names the goal, scope, check, and report.

```
/bob <goal, one sentence a stranger could act on>

PLAYBOOK     which Bob playbook fits (Feature, Bug, Refactor, Perf)
SCOPE        paths it may write, paths it may not, its branch and base
CONTEXT      files, issues, and PRs to read; upstream reports pasted in full, since workers can't see each other.
             The user's own messages ride along as contextMessageIds; say which decisions they settle.
ACCEPTANCE   checkable criteria, one per line
VERIFY       exact commands or the bob-verify-<app> recipe, plus known gotchas
TIMEBOX      rough cap; on expiry, report what you have and stop
RULES        <headless or attended, below>
REPORT       <id> at <path>: status, final (yes or no), branch, head SHA, PR, what you ran and its output, deviations,
             gates, follow-ups, and what this thread still owns (an open PR, running children, a question to
             the user), or "nothing". Delivered per "Reporting" below.
STANDING     <the coordinator's standing orders pasted word for word, when it has any>
REPORT-BACK  standalone only: <coordinator thread id>: <message>. Hub work leaves this out.
```

**RULES, headless** (no one is watching the thread): You were started by <coordinator>, not a person. Skip checkpoints; the design is approved in CONTEXT. Don't ask the user anything: when a decision isn't yours, stop and report it as a gate. Babysit your PR to merge-ready, then stop. Never merge, rebase, force-push, or retarget. Don't archive this thread; the coordinator settles it after your final report. Start subagents only per `../../bob-models/references/delegation.md`, and message no thread except REPORT-BACK. No fixes outside SCOPE; note them as follow-ups.

**RULES, attended** (the user approved the work and will answer in the thread): You were started by <coordinator> for work the user approved. Run the playbook as usual. It stops for the user only where a playbook's own conditions call for a checkpoint, and never to confirm what CONTEXT already says; then ask in this thread. Babysit your PR to merge-ready, then stop. Never merge. Don't archive this thread; the coordinator settles it after your final report. Start subagents only per `../../bob-models/references/delegation.md`, and message no thread except REPORT-BACK. No fixes outside SCOPE; note them as follow-ups.

## Reporting

Report each time the report changes: when the PR opens, again when it's merge-ready, and when you stop on a gate.

**As a Hub worker** (the turn's Hub packet names your work item):

1. Keep the playbook's steps as the work item's checklist with `synara_hub_update_progress`, passing the revision you last read (from the packet, or `synara_hub_list_work` after a conflict). A finished checklist doesn't finish the work item; the Hub does.
2. Write the report to a file in your worktree, add it to the Hub Library with `synara_project_library_add` at the path REPORT names (same `requestId` on a retry), then delete the local copy so the worktree stays clean.
3. When the brief names a project task id, also file the summary with `synara_project_report_result`.
4. End the turn with the full report as your reply. The Hub records it and wakes the coordinator; don't message the coordinator yourself.

**As a standalone worker:** write the report to the path REPORT names, end your reply with the same text, then call `synara_send_message` with the REPORT-BACK thread id, `mode: "queue"`, and the message exactly as given. Synara has no idempotency key for messages, so the coordinator treats a repeat as a no-op unless the report changed.

A dependency means passing context, not just ordering: paste the upstream report into the downstream brief. Save every brief exactly as sent, next to the coordinator's other state.
