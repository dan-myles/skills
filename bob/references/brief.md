# The brief

How a coordinator (Orchestrate, or Frank) hands work to a Bob thread. The worker starts with none of the coordinator's conversation and can't ask it anything, so a vague brief fails quietly. The brief is the product.

Every field filled, or the work isn't scoped yet and doesn't go out. Size it to the work: a one-command unit gets a paragraph that still names the goal, scope, check, and report.

```
/bob <goal, one sentence a stranger could act on>

PLAYBOOK     which Bob playbook fits (Feature, Bug, Refactor, Perf)
SCOPE        paths it may write, paths it may not, its branch and base
CONTEXT      files, issues, and PRs to read; upstream reports pasted in full, since workers can't see each other
ACCEPTANCE   checkable criteria, one per line
VERIFY       exact commands or the bob-verify-<app> recipe, plus known gotchas
TIMEBOX      rough cap; on expiry, report what you have and stop
RULES        <headless or attended, below>
REPORT       write <report path> and end with the same text: status, branch, head SHA, PR,
             what you ran and its output, deviations, gates, follow-ups
STANDING     <the coordinator's standing orders pasted word for word, when it has any>
```

**RULES, headless** (no one is watching the thread): You were started by <coordinator>, not a person. Skip checkpoints; the design is approved in CONTEXT. Don't ask the user anything: when a decision isn't yours, stop and report it as a gate. Babysit your PR to merge-ready, then stop. Never merge, rebase, force-push, or retarget. Don't settle or archive this thread. No fixes outside SCOPE; note them as follow-ups.

**RULES, attended** (the user approved the work and will answer in the thread): You were started by <coordinator> for work the user approved. Run the playbook as usual, checkpoints included; ask the user in this thread. Babysit your PR to merge-ready, then stop. Never merge. No fixes outside SCOPE; note them as follow-ups.

A dependency means passing context, not just ordering: paste the upstream report into the downstream brief. Save every brief exactly as sent, next to the coordinator's other state.
