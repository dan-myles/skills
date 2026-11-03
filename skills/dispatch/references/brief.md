# The brief

How Dispatch hands work to a Cooper thread. Cooper's skills know nothing about Dispatch: everything the worker needs, including how to report back, travels in this brief. The worker starts with none of Dispatch's conversation and can't ask it anything, so a vague brief fails quietly. The brief is the product.

Every field filled, or the work isn't scoped yet and doesn't go out. Size it to the work: a one-command unit gets a paragraph that still names the goal, scope, check, and report.

```
/cooper <goal, one sentence a stranger could act on>

PLAYBOOK     which Cooper playbook fits (Feature, Bug, Refactor, Perf)
SCOPE        paths it may write, paths it may not, its branch and base
CONTEXT      files, issues, and PRs to read; upstream reports pasted in full, since workers can't see each other
DECIDED      the user's decisions this work must keep, word for word, each with its source; the reserved calls
             under **Decided stays decided** in cooper/SKILL.md apply on top
ACCEPTANCE   checkable criteria, one per line
VERIFY       exact commands or the cooper-verify-<app> recipe, plus known gotchas
TIMEBOX      rough cap; on expiry, report what you have and stop
RULES        <headless or attended, below>
REPORT       end with the full report; also write <report path> when reachable from this worker
             status, final (yes or no), owning worker's
             exact thread id and title, [thread title](t3-thread://v1/<exact-threadId>), branch, head SHA,
             PR, what you ran and its output, each decision you made that the brief didn't (marked when it touches
             DECIDED or a reserved call), gates, follow-ups, and what this thread still
             owns (an open PR, running children, a question to the user), or "nothing"
STANDING     <Dispatch's standing orders pasted word for word, when it has any>
REPORT-BACK  <exact current Dispatch thread id>, <message>, store/item/attempt/ownership generation
```

**RULES, headless** (no one is watching the thread): You were started by Dispatch, not a person. Skip checkpoints; the design is approved in CONTEXT. Don't ask the user anything: when a decision isn't yours, stop and report it as a gate. DECIDED and the reserved calls are never yours: when a blocker would force one, stop and report the options with your pick as a gate, and don't build the alternative. The playbook ends by opening a ready-for-review PR per `playbooks/open-pr.md` and babysitting it to merge-ready; then stop. Never merge, rebase, force-push, or retarget. Don't settle or archive this thread; Dispatch settles it after your final report. No fixes outside SCOPE; note them as follow-ups.

**RULES, attended** (the user approved the work and will answer in the thread): You were started by Dispatch for work the user approved. Run the playbook as usual. It stops for the user only where a playbook's own conditions call for a checkpoint, or before changing anything in DECIDED or a reserved call, and never to confirm what CONTEXT already says; then ask in this thread. The playbook ends by opening a ready-for-review PR per `playbooks/open-pr.md` and babysitting it to merge-ready; then stop. Never merge. Don't settle or archive this thread; Dispatch settles it after your final report. No fixes outside SCOPE; note them as follow-ups.

**Report back, both RULES.** These lines go into the brief itself, since Cooper's skills don't carry them. Always put the complete report in your T3 reply at PR-open, merge-ready, a gate, or completion. Then save the report file when one was requested and call `t3_thread_send` with the exact Dispatch thread ID, `mode: "auto"`, the given message, the brief's verified return `environmentId` when required, and `clientRequestId` `<id>-report-<n>`. Auto steers into a running turn or starts an idle Dispatch. Keep store/item/attempt/ownership generation as given, and never edit Dispatch's `.dispatch` store or report cursors, even when a copy is reachable. Leave secrets, private data, and machine-specific absolute paths out of the shareable report, and mark restricted evidence separately.

Keep the item ID and ownership on every follow-up. A missing or ambiguous destination is a gate, with the report still in your reply. A final model turn does not release an open PR or other ownership; say exactly what remains.

Resolve your own identity from T3 context; REPORT-BACK names Dispatch, not you. Every review-ready report and final handoff includes your thread link, `[thread title](t3-thread://v1/<exact-threadId>)` with the exact id unencoded, next to every PR link. Dispatch keeps that ownership when it processes or relays the report.

Bound every judgment call. "Use your judgment" or "do it smartly" with no DECIDED tells the worker a blocker is permission to redesign. A conflict fix or restack keeps both sides' design and touches only what the conflict needs.

A dependency means passing context, not just ordering: paste the upstream report into the downstream brief. Save every brief exactly as sent in the store's `briefs/`.
