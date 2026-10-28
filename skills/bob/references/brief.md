# The brief

How a coordinator (Orchestrate, or Dispatch) hands work to a Bob thread. The worker starts with none of the coordinator's conversation and can't ask it anything, so a vague brief fails quietly. The brief is the product.

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
REPORT       end with the full report; also write <report path> when reachable from this worker
             status, final (yes or no), owning worker's
             exact thread id and title, [thread title](t3-thread://v1/<exact-threadId>), branch, head SHA,
             PR, what you ran and its output, each decision you made that the brief didn't (marked when it touches
             DECIDED or a reserved call), gates, follow-ups, and what this thread still
             owns (an open PR, running children, a question to the user), or "nothing"
STANDING     <the coordinator's standing orders pasted word for word, when it has any>
REPORT-BACK  transport t3-thread: <coordinator thread id>, <message>; or
             transport thread-message: grokbot:<bot id>, item id, coordinator reads this worker reply
```

**RULES, headless** (no one is watching the thread): You were started by <coordinator>, not a person. Skip checkpoints; the design is approved in CONTEXT. Don't ask the user anything: when a decision isn't yours, stop and report it as a gate. DECIDED and the reserved calls are never yours: when a blocker would force one, stop and report the options with your pick as a gate, and don't build the alternative. When the work is done, open its PR per `playbooks/open-pr.md` and babysit it to merge-ready, then stop. Never merge, rebase, force-push, or retarget. Don't settle or archive this thread; the coordinator settles it after your final report. No fixes outside SCOPE; note them as follow-ups.

**RULES, attended** (the user approved the work and will answer in the thread): You were started by <coordinator> for work the user approved. Run the playbook as usual. It stops for the user only where a playbook's own conditions call for a checkpoint, or before changing anything in DECIDED or a reserved call, and never to confirm what CONTEXT already says; then ask in this thread. When the work is done, open its PR per `playbooks/open-pr.md` and babysit it to merge-ready, then stop. Never merge. Don't settle or archive this thread; the coordinator settles it after your final report. No fixes outside SCOPE; note them as follow-ups.

**Report back, both RULES.** Always put the complete report in the T3 reply at PR-open, merge-ready, a gate, or completion. Follow the explicit coordinator transport:

- **T3 coordinator.** Save its reachable report file when requested, then call `t3_thread_send` with the exact coordinator thread ID, `mode: "auto"`, the given message, and `clientRequestId` `<id>-report-<n>`. Auto steers into a running turn or starts an idle coordinator. Keep the existing Orchestrate report-back behavior.
- **Grok Bot coordinator.** `grokbot:<bot id>` is an identity, not a T3 address. Do not call `t3_thread_send` to it. The Grok Bot reads your T3 reply through Executor and writes its own copy into the box-local report store. Do not try to write that store from Mac Studio or Paperclip. A worker-local file alone is not a report. Put essential findings inline and use a genuinely shared destination for larger artifacts; report inaccessible artifacts as a gate. No instant bot wakeup is promised.

Preserve transport, item ID, and ownership on every follow-up. A legacy REPORT-BACK with an actual T3 coordinator ID keeps the T3 path; never guess a bot's T3 proxy. A missing or ambiguous destination is a gate, with the report still in your reply. A final model turn does not release an open PR or other ownership; say exactly what remains.

Resolve the worker's own identity from T3 context or metadata; REPORT-BACK names the coordinator, not the worker. Preserve the exact id without URL encoding. Every review-ready report and final handoff includes the owning worker link alongside its PR links, per **Review handoffs** in `bob/SKILL.md`. The coordinator preserves that ownership when processing or relaying the report.

Bound every judgment call. "Use your judgment" or "do it smartly" with no DECIDED tells the worker a blocker is permission to redesign. A conflict fix or restack keeps both sides' design and touches only what the conflict needs.

A dependency means passing context, not just ordering: paste the upstream report into the downstream brief. Save every brief exactly as sent, next to the coordinator's other state.
