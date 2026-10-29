# Dan's loadout

This repository is Dan's [loadout](https://github.com/dan-myles/loadout), the source his machines apply with the loadout CLI. The manifest declares skills and enabled agents only. It does not install programs, configure MCP servers, or manage other user files. Standalone tools live under `tools/`, which Loadout ignores; each is installed by hand from its own README.

The deployment source is `main`. Dan reports that Loadout machine `grokbot` syncs it nightly around 3 AM America/Chicago. All 55 skill folders live under `skills/`, following [the starter loadout](https://github.com/dan-myles/loadout/tree/main/examples/starter). Manifest sources use `skills/<name>`. Changes still require Dan's merge approval; editing this checkout does not apply a machine.

## Layout and machines

```text
loadout.toml                     global agents, 13 shared skills, machine tags
tags/coding.toml                 cooper and all cooper-* skills, 41 total
machines/grokbot.toml            replaces enabled agents with the custom grok-bot
skills/                         skill sources, matching the starter
  cooper/, cooper-*/, personal-*/, ... skill folders, with dispatch-* and grokbot-* roles
tools/t3-grokbot-bridge/         T3 → Grok Bot update bridge, run per T3 environment; not deployed by Loadout
.skills-manager/                 historical registry, ignored by the loadout CLI
PARKING_LOT.md                   repo rules and history
```

| Machine name | OS / account | Tags | Enabled agents | Skills |
| --- | --- | --- | --- | --- |
| `dans-macbook-pro` | macOS / Dan | `coding` | `claude`, `codex`, `cursor`, `grok` | all 55 |
| `stapler` (Mac Studio) | macOS / `dan` | `coding` | `claude`, `codex`, `cursor`, `grok` | all 55; Capy pending |
| `paperclip` | Linux / `dan` | `coding` | `claude`, `codex`, `cursor`, `grok` | all 55 |
| `grokbot` | Linux / `box` | none | `grok-bot` only | 13 shared skills |

Machine names follow the tailnet names, checked on 2026-10-29. The MacBook's OS hostname is `Daniels-MacBook-Pro.local`, so save the table's names explicitly instead of relying on hostname detection. SSH confirmed user `dan` with home `/Users/dan` on the MacBook, and user `dan` with home `/home/paperclip` on Paperclip (the account was renamed from `paperclip`; its home kept the old name). The Grok Bot machine is `grokbot`, not the account name `box`. It was offline and its tailnet DNS name did not resolve, so its account and workflow copies could not be checked remotely. The Mac Studio is `stapler` on the tailnet (renamed from `dans-mac-studio` on 2026-10-29), user `dan`, home `/Users/dan`. It has one Tailscale identity; the old `dans-mac-studio-ssh` endpoint is gone.

The global layer enables the four native agents. An unlisted machine gets those agents and the 13 shared skills, but no Cooper or Dispatch skills. The `coding` tag adds Cooper, Dispatch, and `personal-loadout-programs` only on the three coding machines. The box machine layer replaces the enabled list, so it receives no native-agent copies and no `cooper` or `cooper-*` skills.

## Agent destinations and limits

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

The box receives the two `grokbot-*` skills, `ketchup`, `unslop`, and every `personal-*` skill. Dispatch and its four modes now belong to the coding tag and run in T3. Review any removal of previously owned bot Dispatch skill copies before a future Loadout apply; this port does not apply machines or migrate live bots. It receives no `cooper` or `cooper-*` folders. Support retains its own Executor worker reference on the box; Cooper loads its coding helpers on its T3 machine. See [the historical Grok Bot checks](docs/grokbot-validation.md).

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

Install the CLI from [dan-myles/loadout](https://github.com/dan-myles/loadout). Use a version compatible with manifest version 1, 0.1.5 or later (`apt-repo` and `github` in `tags/coding.toml` need it; older CLIs reject those keys). This conversion was checked against CLI commit `bf2e2f4e746c6039ef27c2e3b5cef0db36ef53c4`. See [validation results](docs/loadout-validation.md) for command output, machine resolution, skill preservation, and ownership proof.

For a read-only rollout review, use a branch-tracking clone and the documented local identity file below. Plain `loadout init` on the GitHub URL clones the default branch and immediately applies it; the CLI currently has no branch flag. The repository is public, so the HTTPS read-only remote needs no GitHub SSH key on the machine account.

On a fresh machine with no existing Loadout state, choose `machine_name` from the table above. On Paperclip, run as `dan`; on the bot server, run as `box`. On either Mac, run as Dan. These commands run in a subshell, prepare the clone and identity only, then show a read-only plan. A failed guard stops the block without closing the parent shell:

```sh
(
  set -eu
  machine_name=stapler
  case "$(uname -s)" in
    Darwin) loadout_state="$HOME/Library/Application Support/loadout" ;;
    Linux) loadout_state="${XDG_STATE_HOME:-$HOME/.local/state}/loadout" ;;
    *) exit 1 ;;
  esac
  if test -n "${LOADOUT_HOME:-}${LOADOUT_STATE_DIR:-}"; then
    echo 'Unset Loadout isolation/state overrides before this fresh-machine setup.' >&2
    exit 1
  fi
  if test -e "$loadout_state" || test -L "$loadout_state"; then
    echo 'Existing Loadout state: inspect it instead of overwriting it.' >&2
    exit 1
  fi
  (umask 077; mkdir -p "$loadout_state")
  git clone --branch main --single-branch https://github.com/dan-myles/skills.git "$loadout_state/loadout"
  (umask 077; set -C; printf 'name = "%s"\nremote = "https://github.com/dan-myles/skills.git"\n' "$machine_name" > "$loadout_state/machine.toml")
  loadout validate "$loadout_state/loadout"
  loadout plan --loadout "$loadout_state/loadout"
)
```

Run the following only after reviewing the plan, especially every `replace`, `adopt`, `remove`, `drifted`, `blocked`, and `unsupported` action. On the box, reconcile legacy coordinator skill names and existing contents before this step. Complete the Skills Manager migration above first. Loadout follows existing top-level symlinks, so leaving a library link in place can transfer ownership of its target.

```sh
loadout apply
loadout doctor
loadout status
```

For an existing Loadout installation, preserve its identity and state. Inspect its managed clone's current branch and local changes, then switch its tracked branch to `main` only after resolving any local work. `loadout plan --loadout <clone>` previews the result before applying. Never discard changes or overwrite `machine.toml` to make setup pass.

Subsequent `loadout sync` fetches and fast-forwards the managed clone's tracked `origin/main` branch, then applies it. `loadout update` updates the CLI itself. It does not sync skills. A background service is optional setup after review via `loadout service install`; no service is installed by the commands above. Start a new agent session after applying to refresh discovered skills. The old `.skills-manager/` registry remains for migration reference and is not an input to Loadout.

## Confirm before rollout

- Verify the offline `grokbot` machine as user `box` once reachable. Save the tailnet machine names explicitly; MacBook and Paperclip OS hostnames differ from them.
- `/home/box` is the bot account's home, and which legacy coordinator copies and bot startup references need migration before an apply.
- Which agents are used on each coding machine. All four native agents are enabled there for the stated Claude/Codex/Cursor/Grok driver setup.
- Capy's supported destination or alternate skill distribution method, and pickup by T3 instances with custom homes and by Cursor.
- Which Skills Manager links or live edits need migration before Loadout takes ownership. No machine was applied as part of this conversion.
- `cooper-improve` still contains the old Skills Manager import and deploy instructions. Skill bodies were frozen for this conversion. Before using it to publish skill changes after migration, approve a separate skill-content update; use this README as the deployment procedure in the meantime.

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
