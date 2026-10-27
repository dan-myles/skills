# Dan's loadout

This repository is Dan's [loadout](https://github.com/dan-myles/loadout), the source his machines apply with the loadout CLI. It declares skills and enabled agents only. It does not install programs, configure MCP servers, or manage other user files.

The deployment branch is `loadout`. `main` stays unchanged until Dan reviews. All 49 skill folders live under `skills/`, following [the starter loadout](https://github.com/dan-myles/loadout/tree/main/examples/starter). Their contents stay intact, including scripts, references, assets, and licenses. Manifest sources use `skills/<name>`.

## Layout and machines

```text
loadout.toml                     global agents, 13 non-coding skills, machine tags
tags/coding.toml                 bob and all bob-* skills, 36 total
machines/grokbot.toml            replaces enabled agents with the custom grok-bot
skills/                         skill sources, matching the starter
  bob/, bob-*/, personal-*/, ... unchanged skill folders
.skills-manager/                 historical registry, ignored by the loadout CLI
PARKING_LOT.md                   repo rules and history
```

| Machine name | OS / account | Tags | Enabled agents | Skills |
| --- | --- | --- | --- | --- |
| `dans-macbook-pro` | macOS / Dan | `coding` | `claude`, `codex`, `cursor`, `grok` | all 49 |
| `dans-mac-studio` | macOS / `dan` | `coding` | `claude`, `codex`, `cursor`, `grok` | all 49; Capy pending |
| `paperclip` | Linux / `paperclip` | `coding` | `claude`, `codex`, `cursor`, `grok` | all 49 |
| `grokbot` | Linux / `box` | none | `grok-bot` only | 13 non-coding skills |

Machine names follow the tailnet names, checked on 2026-10-27. The MacBook's OS hostname is `Daniels-MacBook-Pro.local`, and Paperclip's is `Ubuntu-2204-jammy-amd64-base`, so save the table's names explicitly instead of relying on hostname detection. SSH confirmed user `dan` with home `/Users/dan` on the MacBook and user `paperclip` with home `/home/paperclip` on Paperclip. The Grok Bot machine is `grokbot`, not the account name `box`. It was offline and its tailnet DNS name did not resolve, so its account and workflow copies could not be checked remotely. The Studio is the current machine, user `dan`, home `/Users/dan`. Its machine name is `dans-mac-studio`, not its separate SSH endpoint `dans-mac-studio-ssh`.

The global layer enables the four native agents. An unlisted machine gets those agents and the 13 non-coding skills, but no Bob skills. The `coding` tag adds Bob only on the three coding machines. The box machine layer replaces the enabled list, so it receives no native-agent copies and no `bob` or `bob-*` skills.

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

The box receives `dispatch`, `fleet-control`, `ketchup`, `unslop`, and every `personal-*` skill. This is the requested allowlist, even where a personal skill contains coding or macOS instructions. The folder already contains bot-created `fleet-control` and `gs-crisp-support`.

Loadout owns each `<destination>/<skill-id>` separately, not the workflows parent. It plans only declared targets and targets in its local ownership state. An undeclared, unowned sibling such as `gs-crisp-support` is never copied, adopted, or removed by this loadout. Do not declare the workflows parent as a user file or skill source.

**A foreground apply will replace the box's existing `fleet-control` if it differs.** Loadout backs up the entire old skill folder, then copies this repository's folder. There is no confirmation prompt. Review or reconcile that copy before applying. A matching copy is adopted without a content write. Background sync skips a differing unowned target and reports it instead.

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

Until this branch is reviewed, do not run plain `loadout init` on the GitHub URL. It clones the default branch and immediately applies it; the CLI currently has no branch flag. Use a branch-tracking clone and the documented local identity file instead. The repository is public, so the HTTPS read-only remote needs no GitHub SSH key on the machine account.

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
  git clone --branch loadout --single-branch https://github.com/dan-myles/skills.git "$loadout_state/loadout"
  (umask 077; set -C; printf 'name = "%s"\nremote = "https://github.com/dan-myles/skills.git"\n' "$machine_name" > "$loadout_state/machine.toml")
  loadout validate "$loadout_state/loadout"
  loadout plan --loadout "$loadout_state/loadout"
)
```

Run the following only after reviewing the plan, especially every `replace`, `adopt`, `remove`, `drifted`, `blocked`, and `unsupported` action. On the box, reconcile the existing `fleet-control` before this step. Complete the Skills Manager migration above first. Loadout follows existing top-level symlinks, so leaving a library link in place can transfer ownership of its target.

```sh
loadout apply
loadout doctor
loadout status
```

For an existing Loadout installation, preserve its identity and state. Inspect its managed clone's current branch and local changes, then switch its tracked branch to `loadout` only after resolving any local work. `loadout plan --loadout <clone>` previews the result before applying. Never discard changes or overwrite `machine.toml` to make setup pass.

Subsequent `loadout sync` fetches and fast-forwards the managed clone's tracked `origin/loadout` branch, then applies it. `loadout update` updates the CLI itself. It does not sync skills. A background service is optional setup after review via `loadout service install`; no service is installed by the commands above. Start a new agent session after applying to refresh discovered skills. The old `.skills-manager/` registry remains for migration reference and is not an input to Loadout.

## Confirm before rollout

- Verify the offline `grokbot` machine as user `box` once reachable. Save the tailnet machine names explicitly; MacBook and Paperclip OS hostnames differ from them.
- `/home/box` is the bot account's home, and which version of `fleet-control` to keep before its first foreground apply.
- Which agents are used on each coding machine. All four native agents are enabled there for the stated Claude/Codex/Cursor/Grok driver setup.
- Capy's supported destination or alternate skill distribution method, and pickup by T3 instances with custom homes and by Cursor.
- Which Skills Manager links or live edits need migration before Loadout takes ownership. No machine was applied as part of this conversion.
- `bob-improve` still contains the old Skills Manager import and deploy instructions. Skill bodies were frozen for this conversion. Before using it to publish skill changes after migration, approve a separate skill-content update; use this README as the deployment procedure in the meantime.

## Fleet Control, Dispatch and Bob

Three layers that run your software work inside [T3 Code](https://github.com/pingdotgg/t3code).

**Fleet Control** is the outer Grok Bot loop. It monitors the fleet across machines, routes fresh context to each project's Dispatch, and gives Dan one digest. It does not implement work or manage Dispatch's board.

**Bob** is the engineer. Hand him a goal and he picks the right playbook, learns the code, designs the change, builds it, proves it works on the real app, gets it reviewed by a second model family, opens the PR, and babysits it until it's ready to merge. He never merges without you.

**Dispatch** is Bob's chief of staff. He handles items Fleet Control routes through `/dispatch event ...`, triages within his assigned scope, sends small confirmed bugs straight to Bob threads, lines up everything else for you to pick, and briefs you on request. Fleet Control owns sweeps, scheduled intake, routing, and automations. He never writes code, never merges, never messages anyone on your behalf, and never starts subagents: every bit of work, even a quick validation or code read, goes to a Bob thread. Bobs can use subagents.

It's a remix of three things:

- **[pstack](https://github.com/cursor/plugins/tree/main/pstack)** by Lauren Tan: the playbooks, the principles, and the engineering bar (one job, verified, no slop).
- **[Matt Pocock's skills](https://github.com/mattpocock/skills)**: grilling, the round-by-round interview before complex work, and Wayfinder's durable maps for planning across sessions.
- **Custom workflows** built for T3 Code: cross-provider subagents, worktree threads, report-backs that wake the coordinator, outer-loop events, PR watching, and replies that are drawn, not written.

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
| `fleet-control` | The outer loop. Cross-machine intake, routing, stalls, and a digest for Dan. |
| `/bob <goal>` | The front door. Sorts the task into a playbook and runs it to a merge-ready PR. |
| `/dispatch` | The chief of staff. `setup`, `event`, `brief`, `report`, `status`, or just talk to him. User-invoked `wayfinder` coordinates planning toward a larger goal. |
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

**Dispatch's playbooks:** Setup, Event, Brief, Report, Status, and Wayfinder. `/dispatch wayfinder <goal or map>` runs in your Dispatch thread only when you ask for it. Dispatch keeps a decision map and coordinates Bob research and prototype workers; your choices return to Dispatch. A finished map becomes a spec and implementation briefs, with build approval kept separate from planning. Fleet Control events never start Wayfinder.

**Bob's playbooks:** Investigation (explain or diagnose), Bug, Feature, Refactor, Perf, Prototype, Open PR, Babysit, Orchestrate (a whole multi-day program), Cleanup.

## Built for T3 Code

- **Every role has the right model.** Opus 5.5 runs Bob threads, GPT-6.1-Sol writes the code, Sonnet reads, and every check comes from the other model family than the work it checks. Set it all in one file.
- **Threads, not tabs.** Dispatch and Orchestrate launch Bob threads in their own git worktrees, titled `bob: <what it does>`.
- **Nobody waits on a timer.** When a Bob thread finishes it reports back to Dispatch and wakes him instantly. Fleet Control handles outer-loop intake and missed-event recovery.
- **Finished work gets cleaned up.** Dispatch settles a worker thread once its report is final, nothing's running, and no PR is waiting on anyone.
- **You see it, you don't read it.** Plans, decisions, file maps, proof screenshots, status boards: drawn as live T3 pages, with a few lines of text underneath.

## After applying

In a T3 thread you'll keep open:

```
/dispatch setup
```

Dispatch records his assigned repo and role as `Dispatch: General` or `Dispatch: Support` and gives Fleet Control the event destination. Setup creates no automations. Set that thread's model by hand in T3 (a fast one: GPT-6.1-Sol at medium with the Fast tier works well).

Bob works with zero config. To change anything, it lives in your home folder:

```
~/.bob-n-frank/
├── models.yaml     the model for every role (run /bob-models to change it)
├── config.yaml     Dispatch scopes, stores, evidence sources, auto-dispatch rules
├── dispatch/       Dispatch's board, briefs, and reports
├── grills/         decisions settled by /bob-grill
└── orchestrate/    one folder per Orchestrate program
```

A repo can override any of it in `<repo>/.bob-n-frank/`.

## House rules

- Bob never merges, deploys, deletes data, or force-pushes shared branches without you.
- Everything Bob says is backed by a run, a line of code, or flagged as a guess.
- Comments explain why. Prototypes never ship.
- If a session went sideways, run `/bob-improve` and Bob fixes his own skills.

## For agents working on this repo

Read [`PARKING_LOT.md`](./PARKING_LOT.md) first: the ground rules, how to add a skill, every decision so far, and where the work stopped.
