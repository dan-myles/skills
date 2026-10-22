# The brief

How a coordinator (Orchestrate, or Frank) hands work to a Bob thread. The worker starts with none of the coordinator's conversation and can't ask it anything, so a vague brief fails quietly. The brief is the product.

Every field filled, or the work isn't scoped yet and doesn't go out. Size it to the work: a one-command unit gets a paragraph that still names the goal, scope, check, and report.

```
/bob <goal, one sentence a stranger could act on>

PLAYBOOK     which Bob playbook fits (Feature, Bug, Refactor, Perf)
SCOPE        paths it may write, paths it may not, its branch and base
CONTEXT      files, issues, and PRs to read; upstream reports pasted in full, since workers can't see each other
DECIDED      the user's decisions this work must keep, word for word, each with its source; the reserved calls
             under **Decided stays decided** in bob/SKILL.md apply on top
ACCEPTANCE   checkable criteria, one per line
VERIFY       exact commands or the bob-verify-<app> recipe, plus known gotchas
TIMEBOX      rough cap; on expiry, report what you have and stop
RULES        <headless or attended, below>
REPORT       write <report path> and end with the same text: status, final (yes or no), branch, head SHA,
             PR, what you ran and its output, each decision you made that the brief didn't (marked when it touches
             DECIDED or a reserved call), gates, follow-ups, and what this thread still
             owns (an open PR, running children, a question to the user), or "nothing"
STANDING     <the coordinator's standing orders pasted word for word, when it has any>
REPORT-BACK  <coordinator thread id>: <message>, sent the moment the report is written
```

**RULES, headless** (no one is watching the thread): You were started by <coordinator>, not a person. Skip checkpoints; the design is approved in CONTEXT. Don't ask the user anything: when a decision isn't yours, stop and report it as a gate. DECIDED and the reserved calls are never yours: when a blocker would force one, stop and report the options with your pick as a gate, and don't build the alternative. When the work is done, open its PR per `playbooks/open-pr.md` and babysit it to merge-ready, then stop. Never merge, rebase, force-push, or retarget. Don't settle or archive this thread; the coordinator settles it after your final report. No fixes outside SCOPE; note them as follow-ups.

**RULES, attended** (the user approved the work and will answer in the thread): You were started by <coordinator> for work the user approved. Run the playbook as usual. It stops for the user only where a playbook's own conditions call for a checkpoint, or before changing anything in DECIDED or a reserved call, and never to confirm what CONTEXT already says; then ask in this thread. When the work is done, open its PR per `playbooks/open-pr.md` and babysit it to merge-ready, then stop. Never merge. Don't settle or archive this thread; the coordinator settles it after your final report. No fixes outside SCOPE; note them as follow-ups.

**Report back, both RULES.** Each time you write the report (when the PR opens, again when it's merge-ready, or when you stop on a gate): call `t3_thread_send` with `threadId` from REPORT-BACK, `mode: "auto"`, the message exactly as given, and `clientRequestId` `<id>-report-<n>` where `n` counts your reports. Auto steers the report into the coordinator's running turn, or starts a turn if it's idle, so it never waits in a queue behind other work. This is what wakes the coordinator; without it, nobody hears you finished until its next check.

Bound every judgment call. "Use your judgment" or "do it smartly" with no DECIDED tells the worker a blocker is permission to redesign. A conflict fix or restack keeps both sides' design and touches only what the conflict needs.

A dependency means passing context, not just ordering: paste the upstream report into the downstream brief. Save every brief exactly as sent, next to the coordinator's other state.
