# Bob work brief

A Captain or parent gives Bob enough context to act without the parent's conversation. Fill every applicable field before starting work.

```text
GOAL        one concrete result
PLAYBOOK    Feature, Bug, Refactor, Perf, or Investigation
SCOPE       allowed paths, forbidden paths, branch and exact upstream base
PLACEMENT   shared read-only or fresh writer; expected machine
CONTEXT     relevant repository instructions, source excerpts, issues, PRs, upstream reports
DECIDED     the user's decisions verbatim with sources; reserved calls still apply
ACCEPTANCE  observable criteria
VERIFY      exact commands and app recipes, required environment and known gaps
TIMEBOX     rough cap and what to report on expiry
AUTHORITY   whether publishing a branch or opening a PR was authorized; never infer merge permission
REPORT      status, branch, SHA, PR, checks and evidence, decisions, gates, follow-ups, remaining ownership
```

A fresh writer cannot read uncommitted parent changes or parent-only report paths. Verify the upstream base is available and include required reference contents in the prompt. Each parallel writer owns disjoint files and a separate branch; overlapping work stacks from the previous PR branch.

Existing approvals in CONTEXT satisfy the same checkpoint; do not ask twice. If a blocker would change DECIDED or a reserved call, stop and report the question and options. Do not build the alternative. Missing approval is a gate, including approval to publish.

Use native subagent final/blocked reports or Captain crew reports per `runtime.md`. Never archive or delete the worker as part of reporting. Pass upstream results into downstream prompts; ordering alone does not transfer context.
