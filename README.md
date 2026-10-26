# Fleet Control, Dispatch & Bob

Three layers that run your software work inside [T3 Code](https://github.com/pingdotgg/t3code).

**Fleet Control** is the outer Grok Bot loop. It monitors the fleet across machines, routes fresh context to each project's Dispatch, and gives Dan one digest. It does not implement work or manage Dispatch's board.

**Bob** is the engineer. Hand him a goal and he picks the right playbook, learns the code, designs the change, builds it, proves it works on the real app, gets it reviewed by a second model family, opens the PR, and babysits it until it's ready to merge. He never merges without you.

**Dispatch** is Bob's chief of staff. He handles items Fleet Control routes through `/dispatch event ...`, triages within his assigned scope, sends small confirmed bugs straight to Bob threads, lines up everything else for you to pick, and briefs you on request. Fleet Control owns sweeps, scheduled intake, routing, and automations. He never writes code, never merges, and never messages anyone on your behalf.

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

## Install

You need [T3 Code](https://github.com/pingdotgg/t3code) with Claude Code and Codex, plus [Skills Manager](https://github.com/xingkongliang/skills-manager). Restore this backup into the manager's default library on a new machine with an empty library:

```sh
~/.skills-manager/bin/skills-manager-cli git clone https://github.com/dan-myles/skills.git
~/.skills-manager/bin/skills-manager-cli presets deploy Default --agent claude_code --agent codex
~/.skills-manager/bin/skills-manager-cli presets status Default
```

The app publishes that CLI when it starts. A CLI-only installation can use `skills-manager-cli` from PATH instead.

Installed skills live in `~/.skills-manager/skills/`. Keep your development checkout separate, such as `~/Developer/personal/skills`. Switching its branches will not change Claude or Codex skills. Updates reach the agents only when deliberately imported into the stable library through Skills Manager and deployed (see [Sync changes to a machine](#sync-changes-to-a-machine)). Do not deploy directly from a development checkout with `--skills-root`, or manually replace agent skill links.

Then, in a T3 thread you'll keep open:

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

## Sync changes to a machine

Pushing to this repo doesn't change what Claude and Codex see. Each machine's live library has to pull it:

```sh
CLI=~/.skills-manager/bin/skills-manager-cli
$CLI git pull                  # bring in the pushed commits
$CLI skills list               # every skill folder should be listed
$CLI presets status Default    # claude_code and codex should read N/N
```

Edits to existing skills are live once pulled, because the agents' skill folders are links into the library. Start a new session to pick them up.

A new skill folder arrives with the pull but isn't registered until it's installed. `skills adopt` can't do it, because it refuses to copy a folder onto itself, so move the folder aside and install it back:

```sh
L=~/.skills-manager/skills; T=$(mktemp -d)
mv $L/<name> $T/ && $CLI skills install --local --name <name> --sync-preset Default $T/<name>
diff -r $T/<name> $L/<name>    # prints nothing when the copy matches
```

`install` deploys to every enabled agent, so undeploy the extras to keep Default on Claude and Codex only:

```sh
for a in opencode amp pi; do $CLI skills undeploy --agent $a <name>; done
```

Then commit the registry files it wrote (`.skills-manager/skills/<uuid>.json` and the Default preset entry) and push them back to this repo:

```sh
$CLI git commit -m "register <name> in skills manager" && $CLI git push
```

On another machine, if `skills list` doesn't show the new skill after `git pull`, install it there the same way.

## House rules

- Bob never merges, deploys, deletes data, or force-pushes shared branches without you.
- Everything Bob says is backed by a run, a line of code, or flagged as a guess.
- Comments explain why. Prototypes never ship.
- If a session went sideways, run `/bob-improve` and Bob fixes his own skills.

## For agents working on this repo

Read [`PARKING_LOT.md`](./PARKING_LOT.md) first: the ground rules, how to add a skill, every decision so far, and where the work stopped.
