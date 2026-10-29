# Cooper workers through Executor

Shared by engineering Dispatch, Fleet Control for read-only observation, and support. Read the calling workflow's authority first. Support keeps ownership and report markers in its session queue and worker replies, rather than persisting customer data in an engineering board; its case-specific rules govern that storage. Common launch mechanics do not grant engineering, customer-contact, production-write, or schedule permission.

## Route and launch

On Grok Bot, reach Executor connection `user-executor-dans-team`, also displayed as `executor-dans-team`. Use its `search` and `describe` to confirm tool paths and signatures. The Mac Studio app is `tools["t3-code-mac-studio"]`; Paperclip is `tools["t3-code-paperclip"]`. The instance configuration supplies the exact app and `projectId`. Do not guess a project from its name, confuse the two machines, or use a Grok Bot ID as a T3 thread ID.

Call through Executor `call` or `execute`. A writable repo job has this launch shape, after filling the known destination and a unique branch:

```javascript
await tools["t3-code-mac-studio"].t3_thread_launch({
  projectId: "<configured projectId>",
  title: "cooper: <plain description>",
  workspaceStrategy: {
    type: "worktree",
    baseRef: "main",
    startFromOrigin: true,
    branch: "<unique worker branch>"
  },
  modelSelection: {
    instanceId: "claudeAgent_claude_pool",
    model: "claude-opus-5-5",
    options: { effort: "medium" }
  },
  message: "$cooper <complete brief>"
});
```

`baseRef: "main"` with `startFromOrigin: true` binds the new checkout off `origin/main`; do not supply `origin/origin/main`. Paperclip uses the same shape under its configured app. Read-only investigations use `workspaceStrategy: {type: "root"}` and explicitly forbid repo or production writes. Production operations are not repo edits; support's exact-call rules govern them. Prototypes use isolated writable storage without touching product source.

Default worker model is Claude Opus 5.5 at medium effort, set by the user. Use another model only when the user names one for that job, and then pass it explicitly for that launch only. Do not silently replace the configured provider, model, or effort setting if unavailable. Surface the failure and request a decision. This launch setting is separate from the Cooper subagent roles loaded on the worker's machine. A different validation model requires an explicit, verified instance `validator_model` override; a same-family run does not satisfy a second-model check.

Before launching, save the brief and mark its item's note `launch pending`. `t3_thread_launch` has no retry key. Save the returned exact thread ID, link, title, project, app, and run ID immediately, then read the worker. After an error or lost reply, reconcile `t3_thread_list` and candidate thread briefs before any retry. An uncertain launch reserves capacity and is not permission to start another worker. If ownership cannot be established, stop that launch and report the uncertainty.

## Brief

Fill every field, scaled to the work:

```text
$cooper <bounded goal>
PLAYBOOK     Investigation, Bug, Feature, Refactor, Perf, Prototype, or Orchestrate
SCOPE        writable/forbidden paths, repo, worktree/base, or read-only/exact-write scope
CONTEXT      evidence and links; paste upstream findings and inaccessible source details
DECIDED      binding user decisions and sources, verbatim
ACCEPTANCE   checkable outcome
VERIFY       checks, expected evidence, and known environment limits
TIMEBOX      runtime cap; stop with findings and gates on expiry
RULES        attended or headless; never merge, deploy, contact people, or expand scope
REPORT       full report in the T3 reply: item ID, status, final yes/no, exact worker ID/title/link,
             branch, head SHA, PR, checks and output, new decisions, gates, follow-ups,
             artifacts accessible to the coordinator, and what the worker still owns
STANDING     the instance's applicable standing orders, verbatim
REPORT-BACK  grokbot:<bot id>; thread-message transport. No t3_thread_send to this ID.
             Dispatch reads the report through Executor and saves its own copy.
```

For an attended job, Cooper follows its playbook and asks Dan at genuine checkpoints in the worker thread. For a headless approved job, Cooper stops with a gate instead of making a reserved decision. Implementation workers follow their authorized PR workflow and stop merge-ready. Investigation and planning briefs explicitly forbid implementation, PRs, and production writes. Support exact-write briefs allow only Dan's approved call with pre/post-checks.

The report is in the worker reply at each handoff, gate, or completion. A worker-local file may be supplemental but cannot be the only report. Never instruct a worker on Mac Studio or Paperclip to write the box's `state_dir`. Put small findings inline. Put larger required artifacts somewhere both sides can actually read; a local path alone is not shared storage. If there is no shared destination, report the access gap and keep the worker active until the evidence is preserved.

## PR ownership

Cooper owns the PR for its job. Include the repo's actual PR template and identity requirements in its brief. Use verified co-author details only when repo policy calls for them; never invent identities or change credentials as an incidental fix. Dispatch does not open the PR or post comments on Cooper's behalf.

Cooper calls `link_pull_request` for each PR it creates or pushes to as the next tool call and reports any failure. Keep every PR or stack layer attached to its owning T3 worker. Every review handoff includes the exact worker title/ID/link, branch, current head SHA, and full PR URL. Verification follows that head, not a previous green check. These instructions grant no additional posting or merge permission.

## Read and process

Read known workers with `t3_thread_read` through their saved Executor app. Consume pages and truncated text until the complete report is read. Preserve source message/item ID or position and last processed report marker in the board note. Read pending questions and current PR/check state as well; an idle run or `final: yes` is not proof that an open PR is finished.

Dispatch copies the report to its box-local `reports/<id>.md`, retaining its source and timestamp, before updating the row and cursor. On a crash between those writes, reread and reconcile that same report. A repeated message or routed notice changes no decision and starts no duplicate worker. Multiple reports for an item supersede older evidence only when their worker ownership and head SHA match the current job. Check a late result from a replaced worker before accepting it.

No direct T3 notification wakes a Grok Bot. Read reports during a user-triggered run or a delivered Fleet Control chase. Fleet Control may arrange an approved native Grok Bot cadence, but only after verifying its delivery tool and bot ID. Missing routing stays visibly pending; do not invent a webhook, T3 coordinator thread, or cross-machine filesystem. T3 `watch_pull_request` wakes its owning T3 worker, not Dispatch. Workers own their PR watches when authorized.

## Follow-ups

Read status without messaging a worker just to ask whether it finished. Reuse the same active Cooper for the same job when it needs a concrete authorized next action, such as fixing its failed check or addressing review findings. Pass Dan's answer faithfully; never answer an approval for him. Record the follow-up and expected result before `t3_thread_send`, using a stable `clientRequestId` for retryable delivery. Re-read after an uncertain delivery before resending. Do not steer a running worker into conflicting work. A separate scope or a settled thread gets a fresh brief and worker.

## Settle safely

Only the owning coordinator settles a worker, after reading its complete final report. All of these must be evidenced:

- It launched this worker for the item, owns its brief, and no other work still depends on that thread.
- Acceptance is satisfied or Dan explicitly abandoned/took back the job; follow-ups and the report are recorded.
- Fresh activity, queue, pending-request, and child-task reads show nothing running or waiting. Use the current exposed tools, such as `t3_queue` and `t3_pending_request`; do not infer this from an idle turn alone.
- Every owned PR is merged or closed. A merge-ready PR waiting on Dan keeps ownership active.
- The worker's checkout is clean and pushed where applicable, and required artifacts are accessible and preserved. Obtain fresh worker-side evidence if the box cannot inspect that checkout; inaccessible state is not a pass.
- `t3_project_read` shows any settle actions act only on this worker's resources and nothing still needs them. Never settle a delegated child with a live parent when the project has settle hooks.

Use the saved environment's `t3_thread_organize`, explicitly passing the worker ID. Unsnooze first if needed, then settle and record the result. Never omit the ID, settle an orchestrator or a bot, archive, or prune the worktree as part of this step. If a check is unavailable, leave the worker active with the precise reason. A completed support investigation should be settled promptly once these checks pass, even while its customer case stays open.
