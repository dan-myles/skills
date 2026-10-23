---
name: bob-models
disable-model-invocation: true
description: "Use explicitly to inspect and configure Bob's Capy subagent model roles. Check available models and effort controls before proposing changes."
---
# Bob models

1. Read the user's explicit task selections, `.bob/capy/models.yaml` if present, and `models.example.yaml` for missing roles, in that order. Show the effective model ID, effort, modes, and source for each role. `bob.thread` is the parent-thread recommendation; other roles control children.
2. Inspect Capy's current model catalog and the native subagent model controls. If unavailable, report the gap; do not invent IDs or option values.
3. Recommend changes from session evidence and current availability. Default Claude roles to `claude-code/` IDs for the Claude subscription. Keep GPT workers and mixed-family panels from the defaults. The user can choose any supported model and effort for any role, or explicitly choose `inherit`. State any harness, connection, billing, or reviewer-independence difference before applying a change.
4. Show the exact proposed configuration diff and ask before applying it. Write only the selected changes to `.bob/capy/models.yaml`; never change account connections, subscription settings, or the parent model. Do not commit the file unless requested.
5. Recheck each selection against Capy's catalog. A saved preference does not prove a launched child used it. Apply `references/delegation.md` at every start.

Use Capy's model picker for the parent thread. Report unsupported models or effort levels explicitly; never coerce them.

For example, `/bob-models use Sonnet 5.5 medium for explorers` changes only `bob-how.explorers` after showing the diff. A one-task request such as "use GPT-6.1 Sol xhigh for this review" overrides that task without rewriting saved defaults. Use exact Capy fields in configuration:

```yaml
bob-how:
  explorers:
    modelId: claude-code/claude-sonnet-5-5
    reasoningMode: medium
```

Preserve unrelated roles in a project override. Check subscription availability before delegation; never deliberately switch to another billing route because a subscription is unavailable. Account run-out policies remain controlled in Capy's settings.
