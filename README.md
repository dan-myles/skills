# Dan's loadout

This repository is Dan's [loadout](https://github.com/dan-myles/loadout), the source his machines apply with the loadout CLI. It declares skills and enabled agents only. It does not install programs, configure MCP servers, or manage other user files.

The deployment source is `main`. Dan reports that Loadout machine `grokbot` syncs it nightly around 3 AM America/Chicago. All 54 skill folders live under `skills/`, following [the starter loadout](https://github.com/dan-myles/loadout/tree/main/examples/starter). Manifest sources use `skills/<name>`. Changes still require Dan's merge approval; editing this checkout does not apply a machine.

## Layout and machines

```text
loadout.toml                     global agents, 18 shared skills, machine tags
tags/coding.toml                 bob and all bob-* skills, 36 total
machines/grokbot.toml            replaces enabled agents with the custom grok-bot
skills/                         skill sources, matching the starter
  bob/, bob-*/, personal-*/, ... skill folders, with dispatch-* and grokbot-* roles
.skills-manager/                 historical registry, ignored by the loadout CLI
PARKING_LOT.md                   repo rules and history
```

| Machine name | OS / account | Tags | Enabled agents | Skills |
| --- | --- | --- | --- | --- |
| `dans-macbook-pro` | macOS / Dan | `coding` | `claude`, `codex`, `cursor`, `grok` | all 54 |
| `dans-mac-studio` | macOS / `dan` | `coding` | `claude`, `codex`, `cursor`, `grok` | all 54; Capy pending |
| `paperclip` | Linux / `paperclip` | `coding` | `claude`, `codex`, `cursor`, `grok` | all 54 |
| `grokbot` | Linux / `box` | none | `grok-bot` only | 18 shared skills |

Machine names follow the tailnet names, checked on 2026-10-27. The MacBook's OS hostname is `Daniels-MacBook-Pro.local`, and Paperclip's is `Ubuntu-2204-jammy-amd64-base`, so save the table's names explicitly instead of relying on hostname detection. SSH confirmed user `dan` with home `/Users/dan` on the MacBook and user `paperclip` with home `/home/paperclip` on Paperclip. The Grok Bot machine is `grokbot`, not the account name `box`. It was offline and its tailnet DNS name did not resolve, so its account and workflow copies could not be checked remotely. The Studio is the current machine, user `dan`, home `/Users/dan`. Its machine name is `dans-mac-studio`, not its separate SSH endpoint `dans-mac-studio-ssh`.

The global layer enables the four native agents. An unlisted machine gets those agents and the 18 shared skills, but no Bob skills. The `coding` tag adds Bob only on the three coding machines. The box machine layer replaces the enabled list, so it receives no native-agent copies and no `bob` or `bob-*` skills.

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

The box receives `dispatch`, its four `dispatch-*` modes, the two `grokbot-*` skills, `ketchup`, `unslop`, and every `personal-*` skill. It receives no `bob` or `bob-*` folders. The Dispatch role and its mode skills contain the coordination rules needed on the box; Bob loads its own coding helpers on its T3 machine. See [the current Grok Bot checks](docs/grokbot-validation.md).

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

Install the CLI from [dan-myles/loadout](https://github.com/dan-myles/loadout). Use a version compatible with manifest version 1. This conversion was checked against CLI commit `bf2e2f4e746c6039ef27c2e3b5cef0db36ef53c4`. See [validation results](docs/loadout-validation.md) for command output, machine resolution, skill preservation, and ownership proof.

For a read-only rollout review, use a branch-tracking clone and the documented local identity file below. Plain `loadout init` on the GitHub URL clones the default branch and immediately applies it; the CLI currently has no branch flag. The repository is public, so the HTTPS read-only remote needs no GitHub SSH key on the machine account.

On a fresh machine with no existing Loadout state, choose `machine_name` from the table above. On Paperclip, run as `paperclip`; on the bot server, run as `box`. On either Mac, run as Dan. These commands run in a subshell, prepare the clone and identity only, then show a read-only plan. A failed guard stops the block without closing the parent shell:

```sh
(
  set -eu
  machine_name=dans-mac-studio
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
- `bob-improve` still contains the old Skills Manager import and deploy instructions. Skill bodies were frozen for this conversion. Before using it to publish skill changes after migration, approve a separate skill-content update; use this README as the deployment procedure in the meantime.

## Fleet Control, Dispatch and Bob

Fleet Control and Dispatch run as Grok Bots. Bob workers run inside [T3 Code](https://github.com/pingdotgg/t3code) on Mac Studio or Paperclip, reached through Executor.

**Fleet Control** uses `grokbot-fleet-control` for scoped intake, approved cadence management, routing, missed-cycle detection, and one cross-project digest. It does not implement work or write Dispatch's board.

**Dispatch** is the per-project engineering lead. Skills, CrabStock, and GameStock use the same `dispatch` skill with separate config and state. It decomposes approved work, launches Bob, chases CI/reviews/stalls, and owns the item until completion, explicit abandonment, or handback. It never writes repo code or merges. A merge-ready PR stays owned while waiting on Dan.

**Bob** is the engineer. Each worker runs the right playbook, performs repo work and verification, opens its authorized PR, and reports in its own T3 reply. Bobs can use subagents. Only Dan approves merges.

**GameStock Support** uses `grokbot-gs-crisp-support`, imported from the content Dan supplied. Its interactive Crisp queue and exact production-write approvals remain separate from engineering auto-dispatch. It shares Bob launch, tracking, report, and settlement mechanics with Dispatch.

The workflows draw on these sources:

- **[pstack](https://github.com/cursor/plugins/tree/main/pstack)** by Lauren Tan: the playbooks, the principles, and the engineering bar (one job, verified, no slop).
- **[Matt Pocock's skills](https://github.com/mattpocock/skills)**: grilling, the round-by-round interview before complex work, and Wayfinder's durable maps for planning across sessions.
- **[Engineering Lead](https://x.ai/bot/marketplace/bots/engineering-lead)** by Lauren Tan: onboard, decompose, run, chase, and report; keep healthy work quiet and preserve active worker context. Its public listing exposes operating principles and skill summaries, not a complete runnable routine.
- **Custom workflows** connect Grok Bot coordination to Executor and T3 workers, with cross-provider Bob subagents, worker PR watches, persistent ownership, and read-and-copy reports.

## What it feels like

```
you:   /bob add a weekly leaderboard to the tournaments page

bob:   [draws the plan: Feature → learn → design → build → check → review → PR]
       [draws a file map of where every new and changed file goes]
       [builds it with GPT workers, checks it in the real app, shows before/after screenshots]
       [Claude and GPT both try to break it; findings fixed in their own commits]
       PR #412 opened and babysat. Checks green, threads answered, merge-ready.
       Waiting on you to merge.
```

Small changes go straight through. Bob only stops to ask when the work is complex and needs a call only you can make, and then he asks with option cards and his pick marked. Answer **Send it** to take his recommendation.

## The cast

| Skill | What it's for |
|---|---|
| `grokbot-fleet-control` | Grok Bot outer loop, routing, approved cadences, and fleet digest. |
| `/bob <goal>` | The front door. Sorts the task into a playbook and runs it to a merge-ready PR. |
| `dispatch` | Shared per-project engineering-lead role and mode routing. |
| `dispatch-setup` | Bot identity, repo, T3 destination, standing orders, and state setup. |
| `dispatch-decompose` | Bounded Bob briefs, dependencies, and authorized launches. |
| `dispatch-chase` | Read known workers, drain reports, handle blockers, and continue approved work. |
| `dispatch-digest` | Repo-level brief or read-only status; no launches. |
| `grokbot-gs-crisp-support` | Interactive GameStock Crisp triage and direct Paperclip Bob investigations. |
| `/bob-grill` | Settles every open decision on complex work, round by round, with a recommended answer for each. |
| `/bob-how`, `/bob-why` | How code works, and why it ended up that way. Answers come back as interactive pages. |
| `/bob-architect` | Two designers on two model families, a judge, one merged design. |
| `/bob-adversarial-review` | Reviewers on different models try to break your diff. |
| `/bob-sharpen <prompt>` | Rewrites a prompt to ask for a deeper version of the task, not a bigger one, before you send it to Bob. |
| `/bob-no-comments` | Comment Sicko, a reviewer who hates comments, strips the diff before review. The code a comment was excusing gets fixed instead. |
| `/bob-blast-radius` | What a change breaks outside its diff, with the safety claim proven by running code. |
| `/bob-verify` | Writes a repo's own `bob-verify-<app>` skill so Bob can drive the real app and prove things work. |
| `/bob-models` | Pick the model for every role, checked against T3's live catalog. |
| `/bob-improve` | Bob learns from real sessions: reflect, eval a skill change, recommend models, make repeated mistakes impossible. |
| `bob-principle-*` | 24 short engineering principles Bob reads when a step needs one. |

**Dispatch's modes** are shared skills under `dispatch-*`, like the focused modes in pstack. Other Grok Bot roles use `grokbot-*`; these are skill namespaces, not one skill per bot instance. The entrypoint keeps `/dispatch setup`, `event`, `brief`, `report`, `status`, `chase`, and `wayfinder` inputs. Event, Report, and user-invoked Wayfinder remain local playbooks. Wayfinder runs in the bot conversation, coordinates Bob research/prototypes, and produces a spec; build approval remains separate. Fleet Control never starts Wayfinder or answers its human decisions.

**Bob's playbooks:** Investigation (explain or diagnose), Bug, Feature, Refactor, Perf, Prototype, Open PR, Babysit, Orchestrate (a whole multi-day program), Cleanup.

## Grok Bot coordination and T3 execution

Grok Bots load `/home/box/agent-data/workflows/<skill>/SKILL.md`. A shared role skill describes the job; `instances["grokbot:<actual bot id>"]` in the box's `~/.bob-n-frank/config.yaml` selects the repo, role, T3 destination, standing orders, and absolute state directory. Bot startup identifies the role and exact instance key. The shared directory is not an access-control boundary.

Executor connection `user-executor-dans-team` exposes `tools["t3-code-mac-studio"]` and `tools["t3-code-paperclip"]`. Dispatch verifies the configured project and launches Bob with `codex_codex_pool_v2`, `gpt-6.1-sol`, high reasoning. Writable repo jobs get a worktree off `origin/main`; read-only investigations do not. Bob's T3 subagent defaults remain separate from this Grok Bot launch selection.

Bob puts the complete report in its worker reply. Dispatch reads it through Executor, copies it into its box-local store, and records the source marker before any new launch. A T3 coordinator such as Orchestrate still uses `t3_thread_send`; a Grok Bot has no T3 thread ID and cannot receive that notification. A worker-local report path is not a shared artifact.

A user request or a delivered Fleet Control chase runs the same reconciliation. Fleet Control manages only approved native bot routines and verified bot delivery routes. No instant wakeup, webhook, or default weekday timer is invented by these skills. Missing delivery remains pending and visible, with user-triggered chase available. This change configures no live sync or routine.

## After applying

In the intended Grok Bot conversation, run `dispatch setup` or invoke `dispatch-setup`. Record the actual bot ID and assigned repo/role, verify the Executor destination, and give Fleet Control its configured bot route. Update live startup skill names only during an approved migration. Setup creates no schedules or bots.

On the Grok Bot box:

```text
~/.bob-n-frank/
├── config.yaml     instances keyed grokbot:<bot id>, destinations and standing orders
└── dispatch/
    └── <repo>/<role>/
        ├── board.tsv, seen.tsv, decisions.tsv
        ├── briefs/       exact briefs and launch ownership
        ├── reports/      Dispatch's copies read from T3 replies
        └── wayfinder/    explicitly invoked planning maps
```

On each coding machine, Bob keeps its own `~/.bob-n-frank/models.yaml`, grills, and Orchestrate stores. A remote repo override applies only when actually available from that repo; the box does not treat a Mac Studio path as local. Support customer details stay in the session queue and scoped worker threads, never in tracked skill files.

## House rules

- Bob never merges, deploys, deletes data, or force-pushes shared branches without you.
- Everything Bob says is backed by a run, a line of code, or flagged as a guess.
- Comments explain why. Prototypes never ship.
- If a session went sideways, run `/bob-improve` and Bob fixes his own skills.

## For agents working on this repo

Read [`PARKING_LOT.md`](./PARKING_LOT.md) first: the ground rules, how to add a skill, every decision so far, and where the work stopped.
