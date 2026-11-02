# Cooper workers in T3

Dispatch launches long-lived Cooper worker threads with actual T3 tools, one Beads issue per job. Read the calling mode's authority first. This contract grants no implementation, production-write, merge, or scheduling permission beyond its brief. Grok Bot support retains its separate [Executor contract](../../grokbot-gs-crisp-support/references/cooper-workers.md).

## Route and launch

If work came from Slack or another messaging conversation, carry its source destination and update sender in the brief and `source.*` metadata. Dispatch posts by default; assign the worker instead when appropriate and include the last posted milestone to avoid duplicates. Routine task-related messages need no separate approval. Missing access is a reported gap, not a reason to guess a destination.

Use the current verified T3 project for this repository. For another machine, discover live `t3_environment_links`, then verify the same repository with `t3_project_list`/`t3_project_read` on that environment, and that its checkout resolves the same Beads database. Pass its `environmentId` consistently. Saved IDs are provenance, not proof that a destination is accessible now. Do not guess routes from titles or silently fall back to the local machine.

Discover live tool signatures before calling. A writable job uses `t3_thread_launch` with a unique `clientRequestId`, `projectId`, title `cooper: <plain job description>`, and an explicit workspace strategy:

```javascript
await t3_thread_launch({
  clientRequestId: "<issue-id>-a1-launch",
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

Verify the repo's default branch rather than assuming `main`. With `startFromOrigin: true`, `baseRef: "main"` selects `origin/main`; never supply `origin/origin/main`. Stack jobs use the accepted dependency branch with `startFromOrigin: false`. Do not create a worktree in shell or ask the worker to create its own checkout. Read-only research uses `{type: "root"}` and forbids repository/production writes. Prototypes use isolated writable storage. Omitting workspace strategy binds a project root.

Worker threads use `claude-opus-5-5` with `{effort: medium}` on provider family `claudeAgent`, unless the user names another setting for the job. A program handed to Cooper Orchestrate uses `claude-opus-5-5` with `{effort: medium}` on provider family `claudeAgent` as its coordinator selection; the Orchestrate playbook declares its own worker/verifier selections. Verify the provider instance/model/options through live capabilities; do not assume a pool instance ID is portable. If unavailable, surface the failure and ask rather than silently replacing the provider/model/effort. This launch selection is hardcoded here; Cooper's subagents have their own explicit selections in their launching skills. `/cooper-models` can upgrade source declarations without becoming a runtime dependency. A second-model validator needs an explicit user-configured validator selection from the root's working rules, verified against the live catalog and the Dispatch thread's actual model. No override means unconfigured, not permission to change model policy or select a substitute. If diversity is not verifiable, propose the bug for the user instead of auto-dispatching it.

Before launch, in the graph per [project state](project-state.md): confirm the issue is `approved` and `bd ready` (Wayfinder tickets and validators get `approved` with a comment citing the map invocation or contained-bug policy), write its description, design and acceptance as the brief's content, set `merge:auto` or `merge:human`, then assign it with `--if-assignee '' --assignee cooper:<issue>-a<n>` and set `attempt` and `t3.request`. Comment the launch request. A guard failure means someone else holds it: reconcile, do not launch. After the launch returns, set `t3.thread`, `t3.link`, `t3.title`, `t3.environment`, `t3.project` and `model`, comment the result and run ID, then read the worker. After an error or lost reply, retry only with the same `clientRequestId`, and reconcile candidate threads with `t3_thread_list`/`t3_thread_read` before starting a different attempt. An assigned issue without `t3.thread` is an uncertain launch: it consumes capacity, and it never justifies a second worker.

## Brief

The issue carries the durable brief; the launch message adds what the worker needs to act on it. Fill every field, scaled to the work:

```text
$cooper <bounded goal>
ISSUE        <issue ID>; actor cooper:<issue>-a<n>; root <root ID>
PLAYBOOK     Investigation, Bug, Feature, Refactor, Perf, Prototype, or Orchestrate
SCOPE        repository, allowed/forbidden paths, worktree/base, read-only limits
CONTEXT      sourced evidence; paste findings a worker cannot access
DECIDED      binding decision issue IDs with the user's words and sources, verbatim
ACCEPTANCE   checkable outcome and dependency evidence (matches the issue)
VERIFY       checks, expected evidence, environment limits
MERGE        auto or human, with the reason; see Merge policy
TIMEBOX      cap; stop with findings and gates on expiry
RULES        attended/headless; no deploy or scope expansion; source-thread update sender and destination
REPORT       complete shareable report in T3 reply and as a comment on ISSUE:
             issue/attempt, status, final yes/no, exact worker ID/title/link, branch, head SHA,
             full PR URLs, checks/output, decisions, gates, follow-up issue IDs, artifacts,
             and what the worker still owns. Identify restricted evidence separately.
STANDING     applicable sourced standing orders, verbatim
REPORT-BACK  transport t3-thread: <exact current Dispatch owner ID>
             /dispatch report <issue ID>; attempt <n>
             Include a verified return environmentId when required; never assume reverse access.
             Send a notification with a stable issue/attempt/revision clientRequestId.
```

Use [Cooper's brief rules](../../cooper/references/brief.md) for attended/headless behavior and [Cooper's Beads rules](../../cooper/references/beads.md) for what the worker writes. Investigation and planning briefs explicitly forbid implementation/PRs/production writes and use `MERGE human` with no PR. Preserve required artifacts with repository-relative links or a verified authorized shared destination before accepting them.

A send uses `t3_thread_send` with the exact coordinator ID, `mode: "auto"`, and stable `clientRequestId` for that revision. Cross-machine return links are one-way and account-specific: verify the coordinator environment through the worker's live links and pass its `environmentId` when required. If no verified return route is available, leave the complete reply and the issue comment; Dispatch can still read both. Never send to a same-looking local thread or invent reverse connectivity. On takeover, update the route only after the new owner has reconciled and explicitly handed off control. Late reports retain their original attempt.

## Merge policy

Dispatch sets `MERGE` per brief, and the matching label, before launch.

`human` applies when the change touches auth, money, stored data or migrations, a public API or shared contract, another team's services or infra, or the root's never paths; when `cooper-blast-radius` leaves its safety fact unproven; when `cooper-adversarial-review` leaves an unresolved **Act on** finding; or when branch protection requires a person's approval. When unsure, choose `human`. Everything else is `auto`.

With `auto`, the worker merges once GitHub reports its exact verified head mergeable with every required check and review satisfied, using the repo's normal merge method. It never uses admin bypass, never overrides a required review, and merges a stack lowest layer first. It then closes its issue with the PR and merge SHA, comments, and notifies Dispatch. With `human`, it stops at merge-ready, labels the issue `merge-ready`, opens a `human` decision for the merge linked `related` to its issue, adds a `gh:pr` gate blocking its issue, and notifies Dispatch. Whoever merges, the worker then resolves its own gate and closes its issue; Dispatch closes the merge decision, recording who merged when Dan merged directly.

A worker may raise `auto` to `human` after its own review; neither the worker nor a report may lower it. After the user approves a `human` merge, Dispatch records the decision and sends the worker a concrete merge follow-up naming the closed decision and the approved head SHA; that follow-up is the worker's authorization to merge that head. When the worker is settled or inaccessible, Dispatch may merge the approved head itself under the same rules, then reassign and close the issue.

## Ownership and PRs

Cooper owns its PR and follows the repo's authorized PR/review workflow. Dispatch does not open PRs or post review comments for it. Each created or pushed PR is linked by Cooper's next tool call to `link_pull_request`; failures are reported. Every review-ready handoff includes the actual owning worker link, current branch/head, and full PR URL for every stack layer. Verification must match that head.

Read known workers with `t3_thread_read`, paging truncated items until the full report is read, and read their issue with `bd show <id> --json` and `bd comments <id>`. Use live metadata to distinguish recent failure, recovery, pending input and idle state. A missing notification does not block reconciling a visible report. Advance `t3.cursor` only after the report is recorded on the issue. Repeated notifications must not duplicate accepted reports, decisions, launches, or follow-ups. A replaced worker's late report cannot reclaim ownership.

Use `t3_thread_send` only for concrete authorized follow-up on the same active job, never to ask for status. Comment the action and retry ID first. Preserve decisions and route actual user answers faithfully; never answer pending approvals on their behalf. Uncertain delivery must be reconciled before resend. Settled workers and separate jobs get new attempts. Inaccessible workers follow project-state's takeover and replacement rules.

## Settle safely

Only the owning coordinator settles a worker. An explicit takeover inherits coordination responsibility, but not control of inaccessible threads; recover and confirm control first. Read [settlement checks](../../cooper/references/settling.md). All must pass: the issue is closed or explicitly handed back, its report and follow-ups are recorded, no running turns/children, no pending questions/queues, all owned PRs merged/closed, clean and pushed work where applicable, preserved artifacts, and safe project settle actions. Repo/worktree verification comes from fresh Cooper evidence, not Dispatch running a validation job itself. Missing access is not a pass.

Use `t3_thread_organize` on the verified environment with the exact worker `threadId`; unsnooze first if necessary. Never omit the ID, settle this Dispatch, archive, or prune as part of this step. A merge-ready PR waiting on the user keeps ownership active. Status/digest skips all settlement. Workers retain authorized PR watches; Dispatch needs no polling loop or invented automatic wakeup.
