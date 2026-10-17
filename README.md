# Bob & Frank, Synara edition

Two agents that run your software work inside Synara. This branch, `synara-edition`, is the Synara edition. The T3 Code edition stays on `main`; see [`SYNARA.md`](./SYNARA.md) for what differs and how the two stay in step.

**Bob** is the engineer. Hand him a goal and he picks the right playbook, learns the code, designs the change, builds it, proves it works on the real app, gets it reviewed by a second model family, opens the PR, and babysits it until it's ready to merge. He never merges without you.

**Frank** is Bob's chief of staff. He runs as a Synara Hub coordinator, watches the Hub's work, GitHub, Linear, and Slack, triages what comes in, sends small confirmed bugs straight to Bob threads, lines up everything else for you to pick, and briefs you at 8:30 and 4:30. He never writes code, never merges, and never messages anyone on your behalf.

It's a remix of three things:

- **[pstack](https://github.com/cursor/plugins/tree/main/pstack)** by Lauren Tan: the playbooks, the principles, and the engineering bar (one job, verified, no slop).
- **[Matt Pocock's skills](https://github.com/mattpocock/skills)**: grilling, the round-by-round interview that settles every decision before complex work starts.
- **Custom workflows** first built for [T3 Code](https://github.com/pingdotgg/t3code), now on Synara: cross-provider subagents, worktree threads, Hub work that wakes the coordinator, scheduled briefs, PR watching, and replies that are drawn, not written.

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
| `/bob <goal>` | The front door. Sorts the task into a playbook and runs it to a merge-ready PR. |
| `/frank` | The chief of staff. `setup`, `brief`, `sweep`, `status` ("what are my bobs doing"), or just talk to him. |
| `/bob-grill` | Settles every open decision on complex work, round by round, with a recommended answer for each. |
| `/bob-how`, `/bob-why` | How code works, and why it ended up that way. Answers come back as interactive pages. |
| `/bob-architect` | Two designers on two model families, a judge, one merged design. |
| `/bob-adversarial-review` | Reviewers on different models try to break your diff. |
| `/bob-no-comments` | Comment Sicko, a reviewer who hates comments, strips the diff before review. The code a comment was excusing gets fixed instead. |
| `/bob-blast-radius` | What a change breaks outside its diff, with the safety claim proven by running code. |
| `/bob-verify` | Writes a repo's own `bob-verify-<app>` skill so Bob can drive the real app and prove things work. |
| `/bob-models` | Pick the model for every role, checked against Synara's live catalog. |
| `/bob-improve` | Bob learns from real sessions: reflect, eval a skill change, recommend models, make repeated mistakes impossible. |
| `bob-principle-*` | 24 short engineering principles Bob reads when a step needs one. |

**Bob's playbooks:** Investigation (explain or diagnose), Bug, Feature, Refactor, Perf, Prototype, Babysit, Orchestrate (a whole multi-day program), Cleanup.

## Built for Synara

- **Every role has the right model.** Opus 5.5 runs Bob threads, GPT-6.1-Sol writes the code, Sonnet reads, and every check comes from the other model family than the work it checks. Set it all in one file, checked against `synara_capabilities`.
- **Hub work, not tabs.** Frank and Orchestrate run as Hub coordinators and hand out Bob threads as Hub work in their own worktrees, titled `bob: <what it does>`. Queued work is shown as queued, and the Hub owns retries.
- **Nobody waits on a timer.** When a Bob thread finishes, the Hub wakes Frank. Sweeps are only the safety net.
- **Finished work gets cleaned up.** Frank settles a worker once its report is final, nothing's running, and no PR is waiting on anyone.
- **You see it, you don't read it.** Plans, decisions, file maps, proof screenshots, and status boards are Synara visuals, with a few lines of text underneath.

## Install

You need Synara with its Claude and Codex providers, plus [skills-manager](https://github.com/xingkongliang/skills-manager). Synara and T3 Code read the same skill folders (`~/.claude/skills`, `~/.codex/skills`), so one edition is live at a time. Keep this edition in its own clone, next to the T3 one, and switch with each library's skills-manager preset:

```sh
git clone -b synara-edition https://github.com/dan-myles/skills ~/Developer/personal/skills-synara
~/Developer/personal/skills-synara/scripts/switch-edition.sh synara   # Synara edition live
~/Developer/personal/skills-synara/scripts/switch-edition.sh t3       # back to the T3 edition
~/Developer/personal/skills-synara/scripts/switch-edition.sh status
```

The switch undeploys one library's `Default` preset from Claude Code and Codex and deploys the other's; it restores the old one if the deploy fails.

Then, in a Synara Hub's coordinator thread:

```
/frank setup
```

Frank finds your repos and sources, asks which ones to watch, and schedules his briefs as automations. Set the coordinator's model in the Hub's settings (a strong model at medium effort works well). If you used the T3 edition, `/frank migrate` brings its board over without touching it.

Bob works with zero config. To change anything, it lives in your home folder, apart from the T3 edition's files:

```
~/.bob-n-frank/synara/
├── models.yaml     the model for every role (run /bob-models to change it)
├── config.yaml     Frank's settings when he runs outside a Hub
├── frank/          Frank's board, briefs, and reports outside a Hub
├── grills/         decisions settled by /bob-grill
└── orchestrate/    one folder per Orchestrate program outside a Hub
```

Inside a Hub, Frank's and Orchestrate's state is Hub documents and Library files instead. A repo can override any of it in `<repo>/.bob-n-frank/synara/`.

## House rules

- Bob never merges, deploys, deletes data, or force-pushes shared branches without you.
- Everything Bob says is backed by a run, a line of code, or flagged as a guess.
- Comments explain why. Prototypes never ship.
- If a session went sideways, run `/bob-improve` and Bob fixes his own skills.

## For agents working on this repo

Read [`PARKING_LOT.md`](./PARKING_LOT.md) first: the ground rules, how to add a skill, every decision so far, and where the work stopped.
