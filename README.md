# Dan's loadout

This repository is Dan's [loadout](https://github.com/dan-myles/loadout), the source his machines apply with the loadout CLI. The manifests declare skills, enabled agents, programs, and MCP servers. Standalone tools live under `tools/`, which Loadout ignores; each is installed by hand from its own README.

The deployment source is `main`. Dan reports that Loadout machine `grokbot` syncs it nightly around 3 AM America/Chicago. All 56 skill folders live under `skills/`, following [the starter loadout](https://github.com/dan-myles/loadout/tree/main/examples/starter). Manifest sources use `skills/<name>`. Changes still require Dan's merge approval; editing this checkout does not apply a machine.

## Profiles and layout

`loadout.toml` declares global agents, personal Executor, and 13 shared skills.
`tags/development.toml` adds Cooper, Dispatch, development tools, the persistent
browser helpers, and local Bitwarden MCP. Machines choose this profile locally;
normal machines need no name registration. Only `machines/grokbot.toml` remains
as an exception with its own agent destination and no personal Executor.

| Machine | Intended local profile |
| --- | --- |
| Paperclip | development |
| Stapler | development |
| MacBook Pro | none, base-only |
| Grokbot | none, exceptional machine configuration |

Paperclip and Stapler saved these local selections during the 2026-10-29 rollout. Read
[the migration procedure](docs/profile-migration.md) before publishing or applying
this change. Loadout 0.1.6 supports profiles; 0.1.5 cannot select them. Removing the old
mappings before local selections are ready removes managed development files.

All 56 skills live in `skills/`. Standalone tools in `tools/` and the historical
`.skills-manager/` registry are not deployed by Loadout.

## Agent destinations and limits

The automatic [personal-vaultwarden skill](skills/personal-vaultwarden/SKILL.md) guides credential discovery, secure unlock, and approved-task-only transfer. It uses private input tools before asking for manual terminal work.

The development profile also installs Bitwarden CLI and its official local stdio MCP,
pointed at Dan's Vaultwarden on Archie. Machines start logged out; an existing
authenticated vault is preserved. See [Bitwarden setup](docs/bitwarden.md) for
private per-machine login and headless unlocking.

Development machines also get agent-browser and a separate persistent personal
browser profile. Linux development machines get a loopback-only dashboard with optional local private HTTPS access. See [personal browser setup](docs/personal-browser.md) for the
one-time activation after sync, agent commands, and optional Bitwarden limits.

The global `executor-personal` MCP uses `https://mcp.executor.sh/mcp` for Claude, Codex, Cursor, and Grok. Select Dan's personal team when signing in to Executor in each client on each machine. Executor binds that authorization to the selected team; the server name is a local label. Loadout distributes the server configuration, not OAuth credentials. The custom `grok-bot` agent does not receive this MCP. See [Executor's sign-in documentation](https://executor.sh/docs/mcp#signing-in-from-the-browser).

| Loadout agent | Skill destination | T3 driver |
| --- | --- | --- |
| `claude` | `~/.claude/skills` or `$CLAUDE_CONFIG_DIR/skills` | `claudeAgent` |
| `codex` | `~/.agents/skills` | `codex` |
| `cursor` | `~/.cursor/skills` | `cursor` |
| `grok` | `~/.grok/skills` or `$GROK_HOME/skills` | `grok` |
| `grok-bot` | `~/agent-data/workflows`, Linux only | separate Grok Bots, not the T3 Grok driver |
| Capy, pending | no verified user-level path | separate Capy app on Studio |

T3 Code uses the native adapters; it needs no separate `t3` agent. Loadout's adapter evidence confirms native pickup for Claude, Codex, and Grok with the documented homes. Cursor pickup is inferred. T3 provider instances with custom homes need a separate pickup check; this loadout does not write into T3's private settings or profiles. Cursor also reads shared skill directories, so `doctor` may warn about duplicate skill names when several native agents receive copies.

Capy is pending on the Studio. [Its official skills documentation](https://docs.capy.ai/skills), also checked in the installed app's local docs, describes repository `.agents/skills` and `.claude/skills`, Drive, and plugins. It does not document a user-level destination. Its app-owned `~/.capy/system/skills` is not a documented user destination. Loadout rejects a custom agent with no concrete destination, so Capy is not declared or enabled yet. Dan must confirm a supported path or choose a repository/Drive/plugin workflow before Capy can receive these skills through Loadout.

## Grok Bot ownership

Dan verified that every Grok Bot reads one folder per skill, each containing `SKILL.md`, under `/home/box/agent-data/workflows`. The custom agent uses `~/agent-data/workflows` because the manifest rejects absolute destinations. Run as user `box` with home `/home/box` to reach the verified path.

The box receives the two `grokbot-*` skills, `ketchup`, `unslop`, and the globally declared `personal-*` skills. `personal-loadout-programs` and `personal-vaultwarden` are coding-only. Dispatch and its four modes now belong to the development profile and run in T3. Review any removal of previously owned bot Dispatch skill copies before a future Loadout apply; this port does not apply machines or migrate live bots. It receives no `cooper` or `cooper-*` folders. Support retains its own Executor worker reference on the box; Cooper loads its coding helpers on its T3 machine. See [the historical Grok Bot checks](docs/grokbot-validation.md).

Loadout owns each `<destination>/<skill-id>` separately, not the workflows parent. Bot-created legacy `fleet-control` and `gs-crisp-support` folders may still exist there. The new names are `grokbot-fleet-control` and `grokbot-gs-crisp-support`. This repository change does not rename live bots, update their prompts, or migrate live stores. Reconcile existing contents and update selected skill names with Dan before a live rollout. An undeclared, unowned old folder is left alone; an unchanged owned old target can be removed when undeclared, while a changed one can be released. Keep ownership records and backups.

A foreground apply can replace a differing destination without a confirmation prompt. Background sync skips a differing unowned target and reports it. A matching folder may be adopted. Review the actual plan, including the legacy names, before applying. Do not declare the workflows parent as a user file or skill source.

Ownership means recorded by Loadout, not necessarily created by Loadout. Adopted or replaced folders become owned. If later undeclared, an unchanged owned folder is backed up and removed; a changed folder is released and left in place. There is no manifest option to prohibit adopting matching folders. Thus the guarantee is that unrelated unowned folders survive, not that every folder originally made by a bot remains forever. Keep the local state and backups; `loadout rollback` can undo a run when later changes do not block restoration.

## Migrate an existing Skills Manager machine

Do this before the first Loadout apply on a machine with deployed Skills Manager skills. It is unnecessary on a fresh machine.

1. Back up the live library and reconcile any library-only edits with this repository before retiring its deployments. Leave the library itself in place during migration.
2. Inspect the deployed links for each of this loadout's skills. The usual locations are `~/.claude/skills/<name>` and the legacy `~/.codex/skills/<name>`; include any active custom Claude or Codex home. Inspect targets with `ls -ld` and `readlink`. Do not remove unrelated skills or regular folders.
3. Preview undeploying each managed skill with `~/.skills-manager/bin/skills-manager-cli skills undeploy --agent claude_code --dry-run <name>` and the same command with `--agent codex`. After reviewing the result, repeat without `--dry-run`. Repeat for every skill in this loadout that Skills Manager deployed. If a link is not registered with the manager, unlink only that inspected symlink, leaving its library target intact. Confirm the managed links are gone from both the Claude and legacy Codex destinations.
4. Run `loadout plan --loadout <loadout-checkout>` again. Claude destinations formerly linked into the library should now show `create`, not `adopt`. Review any remaining `adopt` or `replace` separately. Then apply. Legacy Codex links must also be gone, or they duplicate the new `~/.agents/skills` copies.

Loadout follows top-level skill symlinks. Applying while a link still points into Skills Manager can adopt the library folder; later updates write there, and undeclaring the skill can remove that library folder. A missing target with an ownership record becomes drift rather than a new create. Do not delete the library to repair an already-adopted link. If Loadout already owns these links, stop and inspect its records and backups before changing destinations.

## Apply on a machine

Use Loadout 0.1.6 or later, including the executable used by background sync.
Check actual capabilities with `loadout profile --help` before proceeding. Run setup as the normal user,
allowing individual package steps to request sudo.

On a new development machine, after this configuration is published:

```sh
loadout init https://github.com/dan-myles/skills --profile development
```

Interactive init offers a profile choice. A fresh noninteractive init without
`--profile` selects none and applies base/global and OS layers only. For an
existing installation, preserve its identity/state and follow the migration
procedure. `loadout profile set development` saves a choice but does not apply;
`loadout profile set --none` clears it. Review `loadout plan` before applying.
Background sync reuses that local choice without prompting.

The managed clone tracks `main`. `loadout update` upgrades the CLI; `loadout sync`
fetches and applies the loadout. Review changes before enabling background sync.
Start a new agent session after applying to refresh discovered skills.

## Fleet Control, Dispatch and Cooper

Cooper was previously named Bob. Use `$cooper` or `/cooper`, with helpers under `cooper-*`. Existing grills and Orchestrate state remain in `.bob-n-frank`. Models and effort are now hardcoded at each launch step. Legacy home/repo model YAML files are ignored and left untouched. Repo-local `bob-verify-*` skills remain supported. Loadout deploys the renamed folders; review ownership of old `bob*` copies and start a new agent session after sync. See [rename checks](docs/cooper-rename.md).

Dispatch and Cooper run inside [T3 Code](https://github.com/pingdotgg/t3code). Dispatch is a long-running pinned project thread scoped to one repository. Fleet Control and GameStock Support remain Grok Bots; their separate Executor transport is retained.

**Fleet Control** retains `grokbot-fleet-control` for its existing bot scopes and approved cadences. New T3 Dispatches do not register with it or depend on it; cross-project T3 Dispatch routing is outside this port.

**Dispatch** is the per-project engineering lead. Each repository uses the same `dispatch` skill with a separate Git-shareable `.dispatch/<id>/` store. Independent Dispatches can use separate stores; taking over another store requires explicit authorization and an exclusive-writer handoff. It decomposes approved work, launches Cooper, chases CI/reviews/stalls, and owns the item until completion, explicit abandonment, or handback. It never writes repo code or merges. A merge-ready PR stays owned while waiting on Dan.

**Cooper** is the engineer. Each worker runs the right playbook, performs repo work and verification, opens its authorized PR, and reports in its own T3 reply and notifies the exact owning Dispatch thread. Dispatch preserves a sanitized copy with source markers in Git. Coopers can use subagents. Only Dan approves merges.

**GameStock Support** uses `grokbot-gs-crisp-support`, imported from the content Dan supplied. Its interactive Crisp queue and exact production-write approvals remain separate from engineering auto-dispatch. It keeps its own Executor launch and thread-message report contract, plus the existing approval and settlement boundaries.

The workflows draw on these sources:

- **[pstack](https://github.com/cursor/plugins/tree/main/pstack)** by Lauren Tan: the playbooks, the principles, and the engineering bar (one job, verified, no slop).
- **[Matt Pocock's skills](https://github.com/mattpocock/skills)**: grilling, the round-by-round interview before complex work, and Wayfinder's durable maps for planning across sessions.
- **[Engineering Lead](https://x.ai/bot/marketplace/bots/engineering-lead)** by Lauren Tan: onboard, decompose, run, chase, and report; keep healthy work quiet and preserve active worker context. Its public listing exposes operating principles and skill summaries, not a complete runnable routine.
- **Custom workflows** use T3 worker threads, Cooper subagents, PR watches, persistent project ownership and sourced reports. Bot support retains Executor separately.

## What it feels like

```
you:   /cooper add a weekly leaderboard to the tournaments page

cooper:   [draws the plan: Feature → learn → design → build → check → review → PR]
       [draws a file map of where every new and changed file goes]
       [builds it with GPT workers, checks it in the real app, shows before/after screenshots]
       [Claude and GPT both try to break it; findings fixed in their own commits]
       PR #412 opened and babysat. Checks green, threads answered, merge-ready.
       Waiting on you to merge.
```

Small changes go straight through. Cooper only stops to ask when the work is complex and needs a call only you can make, and then he asks with option cards and his pick marked. Answer **Send it** to take his recommendation.

## The cast

| Skill | What it's for |
|---|---|
| `grokbot-fleet-control` | Grok Bot outer loop, routing, approved cadences, and fleet digest. |
| `/cooper <goal>` | The front door. Sorts the task into a playbook and runs it to a merge-ready PR. |
| `dispatch` | Shared per-project engineering-lead role and mode routing. |
| `dispatch-setup` | T3 identity, repo-local store, standing orders, pinning and explicit takeover. |
| `dispatch-decompose` | Bounded Cooper briefs, dependencies, and authorized launches. |
| `dispatch-chase` | Read known workers, drain reports, handle blockers, and continue approved work. |
| `dispatch-digest` | Repo-level brief or read-only status; no launches. |
| `grokbot-gs-crisp-support` | Interactive GameStock Crisp triage and direct Paperclip Cooper investigations. |
| `/cooper-grill` | Settles every open decision on complex work, round by round, with a recommended answer for each. |
| `/cooper-how`, `/cooper-why` | How code works, and why it ended up that way. Answers come back as interactive pages. |
| `/cooper-architect` | Two designers on two model families, a judge, one merged design. |
| `/cooper-adversarial-review` | Reviewers on different models try to break your diff. |
| `/cooper-sharpen <prompt>` | Rewrites a prompt to ask for a deeper version of the task, not a bigger one, before you send it to Cooper. |
| `/cooper-no-comments` | Comment Sicko, a reviewer who hates comments, strips the diff before review. The code a comment was excusing gets fixed instead. |
| `/cooper-blast-radius` | What a change breaks outside its diff, with the safety claim proven by running code. |
| `/cooper-verify` | Writes a repo's own `cooper-verify-<app>` skill so Cooper can drive the real app and prove things work. |
| `/cooper-models` | Review and upgrade model/effort declarations across skill source, checked against live T3 capabilities. |
| `/cooper-improve` | Cooper learns from real sessions: reflect, eval a skill change, recommend models, make repeated mistakes impossible. |
| `cooper-principle-*` | 24 short engineering principles Cooper reads when a step needs one. |

**Dispatch's modes** are shared skills under `dispatch-*`, like the focused modes in pstack. Other Grok Bot roles use `grokbot-*`; these are skill namespaces, not one skill per bot instance. The entrypoint keeps `/dispatch setup`, `event`, `brief`, `report`, `status`, `chase`, and `wayfinder` inputs. Event, Report, and user-invoked Wayfinder remain local playbooks. Wayfinder runs in the Dispatch thread, coordinates Cooper research/prototypes, and produces a spec; build approval remains separate. Fleet Control never starts Wayfinder or answers its human decisions.

**Cooper's playbooks:** Investigation (explain or diagnose), Bug, Feature, Refactor, Perf, Prototype, Open PR, Babysit, Orchestrate (a whole multi-day program), Cleanup.

## T3 Dispatch project state

In a T3 project thread for the repository, invoke `$dispatch setup` or `/dispatch setup`. Setup verifies the exact thread/project/repository identity, initializes or resumes its owned store, and pins the coordinator with the available `t3_thread_organize` pin action. A missing pin capability leaves an explicit manual step. Setup creates no schedules or workers.

```text
<repo>/.dispatch/t-<sha256 of exact initial thread ID>/
├── store.md          stable identity, current owner and generation, standing orders
├── board.md          Now, Backlog, What landed, Watch and links
├── journal.md        running history, source/report markers, ownership handoffs
├── decisions.md      human decisions with exact words and sources
├── briefs/           worker scope, authorization, exact launch identity
├── reports/          shareable evidence with source, attempt and head SHA
└── wayfinder/        explicitly invoked planning maps and resolutions
```

The ID is `t-` plus the full lowercase SHA-256 of the initial thread's exact UTF-8 ID, including prefixes and punctuation. `store.md` retains that exact original ID forever. The owner thread/user and ownership generation can change without renaming the store. Only the current owner edits it. A second independent Dispatch gets its own folder and must avoid overlapping jobs/branches.

Save board and journal updates together, review `git diff -- .dispatch/<id>`, and commit/push the selected store through the repository's normal branch and PR policy when authorized. Tell the recipient which branch/commit contains the latest state. Pulling an unshared local checkpoint is impossible. Store sanitized evidence and repo-relative paths, never secrets, credentials, private customer material, absolute machine paths, or connection tokens. Runtime access is verified again on each machine.

To transfer ownership, stop the old writer, save/share its final snapshot, pull that branch on the recipient's machine, start a new Dispatch in the same repo, and explicitly request `dispatch takeover <id>`. Preserve identity/history and increment the owner generation. Share the ownership transition before new worker actions. If the old thread is inaccessible, the operator must confirm it will no longer write. Git is not a lock; divergent ownership or offline uncertainty stops mutations until reconciled.

Takeover does not make another user's worker threads accessible. Keep inaccessible workers gated with their last verified report/time/head. Recover access and confirm control before retargeting or settling; a replacement requires explicit approval and evidence the prior worker is stopped or isolated. Never silently declare it finished or discard its provenance. See [the state and takeover contract](skills/dispatch/references/project-state.md) and [worker contract](skills/dispatch/references/cooper-workers.md).

Dispatch coordinates; Cooper investigates, implements and validates in T3 worker threads. Each worker reports its store/item/attempt/generation and notifies the exact current owner via `t3_thread_send`. Dispatch reads the full reply and preserves shareable evidence before advancing report markers. Lost/duplicate notifications are reconciled without duplicate launches. The worker model choices are preserved. Their source declarations are now direct launch settings rather than YAML lookups.

[`tools/t3-grokbot-bridge`](tools/t3-grokbot-bridge/README.md) remains a separate optional bot tool. T3 Dispatch does not require it, Fleet Control, Executor, a global instance registry, or an external Page. No actual CrabStock state, live bot configuration, or installed skill copies are migrated by this source change. Historical [Grok Bot validation](docs/grokbot-validation.md) records the previous port, not this Dispatch runtime. Current checks are recorded in [T3 Dispatch validation](docs/dispatch-t3-validation.md).

Cooper's grills and Orchestrate stores remain unchanged. Existing `~/.bob-n-frank/models.yaml` and repo model overrides remain on disk but are no longer consulted. Support customer details stay in its session queue and scoped worker threads, never tracked skill files.

## Models in skill source

Each launch step declares its exact model, effort and provider family. Cooper build subagents use GPT-6.1 Sol high; adversarial review uses Opus 5.5 high plus GPT-6.1 Sol high; readers use Sonnet 5.5 medium. Other roles keep their existing selections. T3 resolves a capable enabled provider instance at runtime rather than treating generic names or account-specific pool IDs as portable defaults. An unavailable model/setting is a visible gate, never an automatic substitute. Explicit user instructions can override a particular job.

`cooper-models` remains the upgrade tool. It inventories actual skill source and examples, checks live capabilities, proposes scoped changes, and edits approved declarations together. It does not create a YAML configuration, change running threads, or sync installed copies. Launch mechanics live in [Cooper's delegation reference](skills/cooper/references/delegation.md). See [model migration checks](docs/hardcoded-models-validation.md).

## House rules

- Cooper never merges, deploys, deletes data, or force-pushes shared branches without you.
- Everything Cooper says is backed by a run, a line of code, or flagged as a guess.
- Comments explain why. Prototypes never ship.
- If a session went sideways, run `/cooper-improve` and Cooper fixes his own skills.

## For agents working on this repo

Read [`PARKING_LOT.md`](./PARKING_LOT.md) first: the ground rules, how to add a skill, every decision so far, and where the work stopped.
