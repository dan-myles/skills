# Running in Synara

This edition of Bob and Frank runs inside Synara. This page is the one place for Synara mechanics; other files link here instead of restating them. Synara's own policy for the session wins where it says more.

## Which role this thread has

Check once at the start of every run, from the turn's own message (a Hub packet settles it), else `synara_context` and `synara_project_get_overview`:

- **Hub worker.** The turn carries a Hub context packet saying this thread is a worker, with a work item id. It can't create threads or drive other threads. Its checklist, report, and artifacts go through the Hub (below).
- **Hub coordinator.** `synara_project_get_overview` names this thread as `coordinatorThreadId`. Frank and Orchestrate run here. Workers are Hub work items, not threads it drives.
- **Standalone.** Neither. It may create and read threads when `synara_context` reports `threadCreate`.

Say which in the plan line. When a step needs something this role can't do, use the fallback listed for it below and name the gap in the reply. Never borrow another role's tools.

## State: one owner per role

| Role | Authoritative state | Never |
|---|---|---|
| Hub coordinator | The Hub: work items (`synara_hub_list_work`) for anything dispatched; Hub documents for what the Hub doesn't track (Frank's `frank/board.tsv`, `frank/seen.tsv`, `frank/decisions.tsv`; Orchestrate's `orchestrate/<program>/…`); the Library for reports and evidence | Its own state in `~/.bob-n-frank/` |
| Hub worker | Its own work item: the progress checklist, its final reply, files it adds to the Library | Hub documents other than inbox entries |
| Standalone | `~/.bob-n-frank/synara/` | The legacy files in `~/.bob-n-frank/` outside `synara/` |

Every role reads the user's settings in `~/.bob-n-frank/synara/models.yaml`; that file is configuration, not state. Write documents with `synara_project_write_document` and the `expectedRevision` you last read; on a conflict, reread and merge, never overwrite. A row for dispatched work keeps its work item id and takes its state from the Hub on every run; never hand-edit a state the Hub owns.

`~/.bob-n-frank/` outside `synara/` belongs to the T3 edition. This edition only reads it: the user's grills, and the legacy Frank board for a migration they asked for (`../../frank/references/migration.md`). Its `models.yaml` uses T3 model ids that Synara rejects, so this edition keeps its own at `~/.bob-n-frank/synara/models.yaml`.

## Queued is not running

`synara_create_thread` and `synara_create_threads` from a Hub coordinator return work items. Accepted means queued: the worker thread id exists only after admission, and the work can wait for a slot. Record the row as `queued` with its work item id, and move it to `working` only when `synara_hub_list_work` shows a `workerThreadId` and state `working`. Report "queued (slot wait)" to the user, never "running".

The Hub owns retries. After a creation returned an `operationId`, a retry reuses the same `requestId` and the exact same plan; never create a replacement thread for queued, stuck, or failed work without a new request from the user. Report failures instead. Cancel queued or idle work with `synara_hub_cancel_work` only when the user or a standing order says to.

Each turn gets one creation plan (`limits.oneCreationPlanPerActiveTurn` in `synara_capabilities`). Put every thread a step starts into one `synara_create_threads` call, up to 20.

## Original context travels with the work

Every dispatch from a conversation passes `contextMessageIds`: the ids of the user's earlier messages the work comes from. Synara forwards their text and attachments verbatim, so the worker sees what the user actually said, not your paraphrase. The current human turn is forwarded on its own; leave its id out. Work a source raised, with no user message behind it, passes none. Still write the brief per `brief.md`; the forwarded messages are its source data, not a replacement for it.

## Tool map

What the T3 edition used, and what this edition uses instead. **Gap** means Synara advertises nothing equivalent.

| Need | Synara | Notes |
|---|---|---|
| Model catalog | `synara_capabilities` | The only source of slugs and option keys. See `../../bob-models/references/delegation.md`. |
| Start a Bob thread | `synara_create_threads` (`synara_create_thread` for one) | `projectId` is the repo's own Synara project (a Hub lists its linked repositories in `synara_project_get_overview`). From a Hub coordinator these are queued work items. |
| Same-family subagent | The native subagent tool | Claude Agent: `Agent` with `model` and a `worker-<tier>` type for effort. |
| Cross-family subagent | Standalone: a child thread through `synara_create_threads`. Hub worker: headless CLI | **Gap:** no in-thread cross-provider child task like T3's `delegate_task`. |
| Wait for a child | `synara_wait_for_threads` with the returned `runIds`, repeated until `allTerminal` | A timeout is progress, not failure. |
| Stop a child | `synara_interrupt_thread`, then archive it | Hub work: `synara_hub_cancel_work`. |
| Message a thread | `synara_send_message`, `mode: "queue"` | **Gap:** no idempotency key, so receivers must treat repeats as no-ops. |
| Report to a coordinator | Hub worker: progress checklist, Library file, final reply. Standalone: `synara_send_message` | See `brief.md`. |
| Read threads | `synara_list_threads`, `synara_read_thread`, `synara_read_thread_activity`, `synara_diagnose_thread`; coordinators also `synara_project_list_threads` | |
| Waiting on the user | `synara_list_threads` status `waiting-for-approval`, `synara_read_kanban_board` attention flags, Hub `workers[].needsYou` | Partial: no single pending-request list. |
| Settle a worker | `synara_set_thread_archived` | Hub workers' slots are released by the Hub. See `settling.md`. |
| Thread worktrees | `git worktree list --porcelain`, plus `synara_read_kanban_board` (each card's branch and worktree) | Partial: no worktree listing tool. |
| Watch a PR | Claude Agent: `Monitor` on a poll script, or a backgrounded `gh pr checks --watch`. Durable: a heartbeat automation | **Gap:** no event-driven PR wake. See `../playbooks/babysit.md`. |
| Tie a PR to its thread | `synara_set_thread_pull_request` | After opening the thread's own PR only. |
| Schedules | `synara_create_automation`, `synara_list_automations`, `synara_view_automation`, `synara_update_automation`, `synara_cancel_automation` | See **Automations**. |
| Webhooks, secrets | None | **Gap.** Sweeps cover inbound events. |
| Visuals | `synara_show_visual` | See `visuals.md`. No preview step. |
| Screenshots in a reply | Markdown image with an absolute path; `browser_screenshot({kind: "proof"})` for Synara's browser | Visual pages can't load files. |
| Questions | `AskUserQuestion` | See **How to ask** in `../SKILL.md`. |
| The todo list | Hub worker: `synara_hub_update_progress`. Otherwise the harness's todo or plan tool, or a `list` visual with `style: "steps"` | |
| Thread links | `[title](thread://<threadId>)` | |
| Shared notes and files | `synara_project_remember`, Hub documents, `synara_project_library_add` | Hub roles only. |

## Automations

A Hub worker never creates one; its coordinator watches what outlives the worker's turn. Elsewhere, create one only when the user asked for it, or a playbook step names it and the user approved that step. Otherwise pass `suggested: true`, which shows an Accept card and runs nothing until they accept. Give every automation a `completionPolicy` with `stopWhen` for its natural end (a PR merge-ready, a program closed) and a `maxIterations` backstop. Use `heartbeat` mode to wake this same thread, `dedicated` for ongoing tracking in a thread the automation owns. Before `synara_update_automation`, call `synara_view_automation` and resend every mutable field. A run started by an automation ends with `synara_report_automation_result`; a later manual "continue" doesn't.

## The final reply

Synara folds tool calls and progress under "Worked for…", so the user may only read the last message. The final reply restates every decision, result, caveat, and question it needs. Never ask for approval with "this" or "the above". Link files as `[name](file:///absolute/path)`, threads as `thread://`, PRs in full.
