# Synara edition: audit, inventory, and migration

Branch `synara-edition` of `dan-myles/skills`, cut from `main` at `2a7d9f1` (pstack catch-up `99743e9`) on 2026-10-17. `main` stays the T3 Code edition. This file is the edition's record: what changed, what Synara has for each T3 feature, what it doesn't, and how the edition was checked. Synara mechanics live in [`bob/references/synara.md`](bob/references/synara.md); this file doesn't repeat them.

## Decisions

- **Branch name.** `synara` can't exist: Synara's temporary branches live under `synara/<id>`, and Git can't hold `refs/heads/synara` beside them. The edition is `synara-edition`. Never merge it into `main`; catch up by merging `main` in (see `PARKING_LOT.md`).
- **One state owner per role.** Hub coordinator: the Hub (work items for anything dispatched; Hub documents for Frank's board and Orchestrate's tables; the Library for reports). Hub worker: its own work item (checklist, result, Library files). Standalone: `~/.bob-n-frank/synara/`.
- **The T3 edition's home is read-only.** This edition writes only `~/.bob-n-frank/synara/`. The models file had to split anyway: every Claude id in the T3 file (`claude-opus-5-5`, `claude-sonnet-5-5`) is rejected by Synara, whose slugs are `opus` and `sonnet`.
- **Queued is not running.** Dispatches from a Hub coordinator are recorded `queued` until Synara shows a working worker.
- **Respawns need the user.** Synara forbids replacement threads without a new user request, so each Orchestrate respawn waits in `gates.md` for the user's yes, and the Hub's own retries are never doubled.
- **Programs get their own Hub.** A Hub worker can't coordinate, so Frank in a Hub proposes a big program as a new Hub instead of dispatching an Orchestrate worker.
- **Automations are proposed, not started,** unless the user asked or approved the step that creates them (`suggested: true` otherwise).

## T3 features and their Synara equivalents

| T3 feature | Synara | Status |
|---|---|---|
| `orchestrator_capabilities` | `synara_capabilities` | Equivalent. Checked by `bob-models/scripts/check_models.py`. |
| `t3_thread_launch` | `synara_create_threads` / `synara_create_thread` | Equivalent; from a Hub coordinator it queues work items. No branch-name parameter: the brief names the branch and the worker switches to it. |
| `delegate_task` (cross-provider child in a thread) | Native subagent (same family); child thread via `synara_create_threads` + `synara_wait_for_threads` (standalone); headless `codex exec` / `claude -p` (Hub roles) | **Partial.** No in-thread cross-provider child task. |
| `task_status`, `task_cancel` | `synara_wait_for_threads` (with `runIds`), `synara_interrupt_thread`, `synara_hub_cancel_work` | Equivalent. |
| `t3_thread_send` with `clientRequestId` | `synara_send_message` | **Partial.** No idempotency key; receivers dedupe. Hub workers report through the Hub instead. |
| Report-back wakes the coordinator | Hub wakes the coordinator on a worker's result; standalone uses `synara_send_message` | Equivalent in a Hub. |
| `t3_thread_list`, `t3_thread_read` | `synara_list_threads`, `synara_read_thread`, `synara_read_thread_activity`, `synara_diagnose_thread`, `synara_project_list_threads`, `synara_hub_list_work` | Equivalent. |
| `t3_pending_request_list` | Thread status `waiting-for-approval`, kanban attention flags, Hub `needsYou` | **Partial.** No single list. |
| `t3_thread_organize` settle/unsettle | `synara_set_thread_archived`; the Hub releases its workers' slots | Equivalent. |
| Snooze / unsnooze | None | Not needed. |
| `t3_project_read` settle actions | None advertised | Check dropped from `settling.md`. |
| `t3_project_list` | `synara_list_projects`, Hub linked repositories | Equivalent. |
| `t3_worktree_list` | `git worktree list` + `synara_read_kanban_board` (branch and worktree per card) | **Partial.** |
| `watch_pull_request` / `unwatch_pull_request` | `bob/scripts/pr_watch.py` under `Monitor` or as a background job; a heartbeat automation for long waits | **Gap.** No event-driven PR wake. |
| (none in T3) | `synara_set_thread_pull_request` | New: Bob ties his PR to his thread. |
| `schedule_task` interval / fixed time | `synara_create_automation` heartbeat with interval or cron; list, view, update, cancel | Equivalent, with `completionPolicy` and `maxIterations`. |
| `schedule_task` webhook, `request_secret` | None | **Gap.** `/frank event` was removed; sweeps and pasted items cover inbound events. |
| `html_preview` + `html_render` | `synara_show_visual` (blocks or HTML) | Equivalent, no preview step. Same theme variable names. |
| Mermaid from a CDN in pages | Nothing loads from the network | **Gap.** `bob/references/file-map.html` now draws its own graph, no dependencies. |
| Local screenshots inlined in pages | Markdown images in the reply; `browser_screenshot({kind: "proof"})` | Equivalent, outside the page. |
| `AskUserQuestion` | `AskUserQuestion` | Equivalent; questions now restate their context, since Synara folds progress away. |
| Todo list | `synara_hub_update_progress` (Hub worker); the harness's plan tool or a `steps` list visual otherwise | Equivalent. |
| `t3-thread://v1/<id>` links | `thread://<id>` | Equivalent. |

## Inventory

**Adapted** (behavior changed for Synara):

- `bob`: `SKILL.md` (role check, checklist, questions, PR association, reply), `references/synara.md` (new), `visuals.md`, `file-map.html` (CDN-free), `brief.md`, `settling.md`, `playbooks/babysit.md`, `cleanup.md`, `investigation.md`, `orchestrate.md`, `scripts/pr_watch.py` (new).
- `bob-models`: `SKILL.md`, `references/delegation.md`, `models.example.yaml` (Synara slugs, no `serviceTier`), `agents/openai.yaml`, `scripts/check_models.py` (new).
- `frank`: `SKILL.md` (Hub coordinator, Hub-owned state, queued vs working, no replacements, `/frank migrate`, no `/frank event`), `references/config.example.yaml`, `references/migration.md` (new), `scripts/legacy_board.py` (new), `agents/openai.yaml`.
- `bob-improve`: transcript sources in `playbooks/reflect.md`, `models.md`, `correct.md`.
- `bob-grill`: where grills are saved.
- `bob-how`, `bob-why`, `bob-no-comments`: visuals through Synara. `bob-no-comments` also gains the `agents/openai.yaml` it lacked on `main`, so Codex no longer invokes it implicitly.
- Every `bob-*` helper: invocation wording (Claude and Codex threads) and the `~/.bob-n-frank/synara/models.yaml` path. Five descriptions dropped angle brackets so they pass the skill validator.
- `README.md`, `PARKING_LOT.md`: the edition, its home, install, and how to keep it in step.

**Reviewed, portable, unchanged:**

- The 24 `bob-principle-*` skills.
- `bob/playbooks/bug.md`, `feature.md`, `perf.md`, `prototype.md`, `refactor.md`, `bob/references/benchmark-checklist.md`.
- Helper references: `bob-how/references/*`, `bob-why/references/**`, `bob-architect/references/*`, `bob-adversarial-review/references/*`, `bob-no-comments/references/comment-sicko.md`, `bob-improve/references/*`, `bob-improve/playbooks/eval.md` (its headless CLIs and `.claude/skills` / `.agents/skills` sandboxes are the CLIs' own), `bob-verify/playbooks/*` and its feature-map example, `bob-blast-radius`.
- `unslop`.
- `personal-dan-review` (its `Monitor` exists in Synara's Claude threads), `personal-paper-comment-watch` (`Monitor` or a background process), `personal-mercury-receipts` and `personal-taste` (they drive Dan's own agent Chrome over CDP, not Synara's browser), `personal-takeone` (CLI works anywhere; its `claude mcp add` / `codex mcp add` setup registers the MCP server for those CLIs, and whether Synara threads pick it up is unverified), `personal-anatomy` (its `T3_` names are code identifiers).
- `.skills-manager/` registry: no skills were added, renamed, or removed.

## Migrating from the T3 edition

Nothing was migrated. `/frank migrate` does it on request, per [`frank/references/migration.md`](frank/references/migration.md): it checks that only one Frank reads each source, converts the board read-only with `frank/scripts/legacy_board.py`, shows a dry run, and imports on "Send it". `approved` rows come back as `proposed` and T3-bound rows as `legacy-t3`, so a migration never dispatches anything.

Dry run against the live board on 2026-10-17 (output deleted afterwards): 137 rows and 471 seen items; 45 done, 56 triaged, 7 dropped, 7 proposed (5 + 2 formerly approved), 22 `legacy-t3` across 10 PRs. A `.sweep.lock` is present, so the T3 Frank may still be live. A hash of every file under `~/.bob-n-frank/` was identical before and after.

## Validation

All on 2026-10-17, on this branch's final tree.

| Check | Result |
|---|---|
| skill-creator `quick_validate.py` on all 43 skills | 43 pass. It rejects `disable-model-invocation`, the repo's manual-only key, so it ran on copies with only that line removed; the key stays on purpose. |
| Manual-only intent | 37 `SKILL.md` carry `disable-model-invocation: true` and 37 `agents/openai.yaml` carry `allow_implicit_invocation: false` (`bob-no-comments` was missing its file on `main`). Names match folders. |
| YAML | Every `agents/openai.yaml`, `models.example.yaml`, and `config.example.yaml` parses. |
| References | Every relative path a skill follows (157 skill links) resolves. |
| Leftover T3 calls | No operational `t3_*`, `delegate_task`, `html_render`, `watch_pull_request`, `schedule_task`, or `request_secret` outside the docs that explain the mapping. |
| `check_models.py` against live `synara_capabilities` | Edition default: 0 errors. `main`'s default and the live `~/.bob-n-frank/models.yaml`: 16 errors each (`claude-opus-5-5`, `claude-sonnet-5-5` aren't slugs). A bad override is caught (unknown effort, `serviceTier`, unavailable provider) with exit 1. |
| `pr_watch.py` on real PRs | Merged PR: state and checks, exit 0. Open PR with no change: `TIMEOUT`, exit 2. Multi-page inline comments: 4 pages, 10 comments. |
| `legacy_board.py` on the live board | 137 rows and 471 seen items converted; a hash of every file under `~/.bob-n-frank/` was identical before and after. It refuses an output inside `~/.bob-n-frank/` or the legacy folder, a reused folder, and a symlinked one, and writes a header-only seen list when there are no rows. |
| `file-map.html` in Synara's browser, under the visual sandbox's exact CSP and theme variables | Renders with no script errors: tree, badges, module boxes, cross-module and in-module edges, the red boundary edge. |
| Forward-test: Frank as a Hub coordinator, two approved items (Opus, blind) | One `synara_create_threads` with the user's message attached, `opus` from the default, `runtimeMode` inherited, rows `queued` with no thread id, reply says "queued, not running". Its 11 notes led to fixes in report paths, `projectId`, context ids, and approval order. |
| Forward-test: Bob as a headless Hub worker on an auth bug (Opus, blind) | Checklist through `synara_hub_update_progress`; the Claude reviewer as a native `Agent`, the GPT reviewer headless `codex exec` read-only; `Monitor` on `pr_watch.py`; `synara_set_thread_pull_request`; report to the Library; no messages to other threads. Its notes led to fixes in interim reports, the TIMEBOX, writer folders, and automations. |
| Cross-family adversarial review of the diff (GPT-6.1-Sol, headless, read-only: the edition's own Hub-worker route) | 11 findings. Fixed: Frank sending Orchestrate to a Hub worker, setup resetting state, standing respawn approval, one creation plan per turn, pinned models swapped for aliases, writer children assuming dirty-tree copies, migration output via symlinks or stale files, `--slurp` pagination. Already fixed: interim reports, report paths. Dismissed: `requestId` on `synara_project_library_add` (the live schema has it). |

## Known gaps and limits

- **No PR wake.** Babysit polls with `pr_watch.py` under `Monitor` (Claude threads) or as a background job (Codex threads), at 60-second intervals and 30-minute arms. Longer waits need an automation the user accepts. A Hub worker never creates one; it stops at its TIMEBOX and Frank tracks the PR.
- **No in-thread cross-provider child.** Standalone threads start child threads, which show up in Synara's thread list; Hub roles run headless `codex exec` / `claude -p`, which doesn't get Synara's progress view.
- **No webhooks or secrets.** `/frank event` is gone; fires wait for the next sweep.
- **No idempotency key on `synara_send_message`.** Coordinators treat repeat report-backs as no-ops.
- **Visual pages can't load anything.** No Mermaid or CDN libraries, no file images. The file map's built-in graph is simple: modules as boxes in a row, no automatic layering beyond the order given.
- **Hub semantics not exercised end to end.** No Hub dispatch, automation, document write, archive, or Hub slot release was run; this worker can't create work, and the brief forbade starting automations. Those paths follow the live tool schemas and were checked by forward-tests, not by real runs. In particular, whether the Hub ends a worker's work item on its first turn end, and what `settledAt` waits for, are unverified.
- **Codex threads in Synara.** The skills name Codex's native subagent and question tools generically; nothing was run in a Codex-provider thread.
- **`personal-takeone`'s MCP setup** registers with the Claude and Codex CLIs; whether Synara threads see that server is unverified.
- **The live Hub coordinator still follows `main`'s Frank.** Hub memory points it at `frank/SKILL.md` in `~/Developer/personal/skills`, the T3 edition, whose `t3_*` tools don't exist in Synara. The T3 board's `.sweep.lock` suggests a T3 Frank may also be live. Nothing was changed; switching is the user's call.
- **One edition live at a time.** Synara and T3 Code read the same `~/.claude/skills` and `~/.codex/skills`, which link into `~/Developer/personal/skills`; the branch checked out there is the live edition. Real side-by-side isolation would need Synara's Claude binary path pointed at a launcher (`--setting-sources project,local --plugin-dir <edition>`, tested: 0 user skills, 43 edition skills) and Synara's Codex overlay `skills` link replaced by a real folder; both were declined.
