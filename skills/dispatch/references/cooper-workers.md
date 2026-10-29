# Cooper workers in T3

Dispatch launches long-lived Cooper worker threads with actual T3 tools. Read the calling mode's authority first. This contract grants no implementation, production-write, merge, external messaging, or scheduling permission beyond its brief. Grok Bot support retains its separate [Executor contract](../../grokbot-gs-crisp-support/references/cooper-workers.md).

## Route and launch

Use the current verified T3 project for this repository. For another machine, discover live `t3_environment_links`, then verify the same repository with `t3_project_list`/`t3_project_read` on that environment. Pass its `environmentId` consistently. IDs saved by a prior user are provenance, not proof that a destination is accessible now. Do not guess routes from titles or silently fall back to the local machine.

Discover live tool signatures before calling. A writable job uses `t3_thread_launch` with a unique `clientRequestId`, `projectId`, title `cooper: <plain job description>`, and an explicit workspace strategy:

```javascript
await t3_thread_launch({
  clientRequestId: "<store-id>-I001-a1-launch",
  projectId: "<verified same-repository project>",
  title: "cooper: <plain description>",
  workspaceStrategy: {
    type: "worktree",
    baseRef: "main",
    startFromOrigin: true,
    branch: "<unique worker branch>"
  },
  modelSelection: {
    instanceId: "<verified Claude provider instance>",
    model: "claude-opus-5-5",
    options: { effort: "medium" }
  },
  message: "$cooper <complete brief>"
});
```

Verify the repo's default branch rather than assuming `main`. With `startFromOrigin: true`, `baseRef: "main"` selects `origin/main`; never supply `origin/origin/main`. Stack jobs use the accepted dependency branch with `startFromOrigin: false`. Do not create a worktree in shell or ask the worker to create its own checkout. Read-only research uses `{type: "root"}` and forbids repository/production writes. Prototypes use isolated writable storage. Omitting workspace strategy binds a project root, not Dispatch's state checkout.

Worker threads use `claude-opus-5-5` with `{effort: medium}` on provider family `claudeAgent`, unless the user names another setting for the job. A program handed to Cooper Orchestrate uses `claude-opus-5-5` with `{effort: medium}` on provider family `claudeAgent` as its coordinator selection; the Orchestrate playbook declares its own worker/verifier selections. Verify the provider instance/model/options through live capabilities; do not assume a pool instance ID is portable. If unavailable, surface the failure and ask rather than silently replacing the provider/model/effort. This launch selection is hardcoded here; Cooper's subagents have their own explicit selections in their launching skills. `/cooper-models` can upgrade source declarations without becoming a runtime dependency. A second-model validator needs an explicit user-configured validator selection, verified against the live catalog and the Dispatch thread's actual model. Keep that existing selection in the store's working rules when supplied; no override means unconfigured, not permission to change model policy or select a substitute. If diversity is not verifiable, propose the bug for the user instead of auto-dispatching it.

Before launch, save the exact brief, authorization source, owner generation, attempt and stable request ID in the store; mark `launch pending`. Save the result's exact worker ID/title/link, project/environment observations and run ID immediately, then read the worker. After an error or lost reply, retry only with the same `clientRequestId`, and reconcile candidate threads with `t3_thread_list`/`t3_thread_read` before starting a different attempt. An uncertain launch consumes capacity. Never create a second worker because a reply was lost.

## Brief

Fill every field, scaled to the work:

```text
$cooper <bounded goal>
PLAYBOOK     Investigation, Bug, Feature, Refactor, Perf, Prototype, or Orchestrate
SCOPE        repository, allowed/forbidden paths, worktree/base, read-only limits
CONTEXT      sourced evidence; paste findings a worker cannot access
DECIDED      binding user decisions and sources, verbatim
ACCEPTANCE   checkable outcome and dependency evidence
VERIFY       checks, expected evidence, environment limits
TIMEBOX      cap; stop with findings and gates on expiry
RULES        attended/headless; no merge, deploy, external messaging, or scope expansion
REPORT       complete shareable report in T3 reply: store/item/attempt/generation,
             status, final yes/no, exact worker ID/title/link, branch, head SHA,
             full PR URLs, checks/output, decisions, gates, follow-ups, artifacts,
             and what the worker still owns. Identify restricted evidence separately.
STANDING     applicable sourced standing orders, verbatim
REPORT-BACK  transport t3-thread: <exact current Dispatch owner ID>
             /dispatch report <item-id>; store <id>, attempt <n>, generation <n>
             Include a verified return environmentId when required; never assume reverse access.
             Send a notification with a stable store/item/attempt/revision clientRequestId.
```

Use [Cooper's brief rules](../../cooper/references/brief.md) for attended/headless behavior. Investigation and planning briefs explicitly forbid implementation/PRs/production writes. The complete report belongs in the worker reply at each gate or handoff; the notification points to it and does not replace it. Dispatch copies sanitized evidence into its store. Workers never edit Dispatch's board, journal, ownership metadata or report cursors, including in another worktree that contains the same `.dispatch` folder. A report file outside shared Git is supplemental only. Preserve required artifacts with repository-relative links or a verified authorized shared destination before accepting them.

A send uses `t3_thread_send` with the exact coordinator ID, `mode: "auto"`, and stable `clientRequestId` for that revision. Cross-machine return links are one-way and account-specific: verify the coordinator environment through the worker's live links and pass its `environmentId` when required. If no verified return route is available, leave the complete reply and record notification failure; Dispatch can still read it on the saved worker destination. Never send to a same-looking local thread or invent reverse connectivity. A failed notification leaves a delivery gap, not a missing report or permission to invent a coordinator. On takeover, update the route only after the new owner has reconciled and explicitly handed off control. Late reports retain their original owner generation and attempt.

## Ownership and PRs

Cooper owns its PR and follows the repo's authorized PR/review workflow. Dispatch does not open PRs or post comments for it. Each created or pushed PR is linked by Cooper's next tool call to `link_pull_request`; failures are reported. Every review-ready handoff includes the actual owning worker link, current branch/head, and full PR URL for every stack layer. Verification must match that head.

Read known workers with `t3_thread_read`, paging/traversing truncated items until the full report is read. Use live metadata to distinguish recent failure, recovery, pending input and idle state. A missing notification does not block reconciliation of a visible report. Save the shareable report with source markers before updating the board cursor, per [project state](project-state.md). Repeated notifications must not duplicate accepted reports, decisions, launches, or follow-ups. A replaced worker's late report cannot reclaim ownership.

Use `t3_thread_send` only for concrete authorized follow-up on the same active job, never to ask for status. Save the action and retry ID first. Preserve decisions and route actual user answers faithfully; never answer pending approvals on their behalf. Uncertain delivery must be reconciled before resend. Settled workers and separate jobs get new briefs. Inaccessible workers follow project-state's explicit recovery rules.

## Settle safely

Only the owning coordinator settles a worker. An explicit store takeover inherits recorded coordination responsibility, but not control of inaccessible threads; recover/confirm control first. Read [settlement checks](../../cooper/references/settling.md). All must pass: acceptance or explicit handback, complete recorded report/follow-ups, no running turns/children, no pending questions/queues, all owned PRs merged/closed, clean and pushed work where applicable, preserved artifacts, and safe project settle actions. Repo/worktree verification comes from fresh Cooper evidence, not Dispatch running a validation job itself. Missing access is not a pass.

Use `t3_thread_organize` on the verified environment with the exact worker `threadId`; unsnooze first if necessary. Never omit the ID, settle this Dispatch, archive, or prune as part of this step. A merge-ready PR waiting on the user keeps ownership active. Status/digest skips all settlement. Workers retain authorized PR watches; Dispatch needs no polling loop or invented automatic wakeup.
