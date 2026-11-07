# Cooper for Amp

An Amp directory plugin that runs Cooper in Amp threads and orbs: start an orb in Cooper mode, hand it a task, and get back a ready-for-review PR babysat through CI and AI review. Loadout doesn't manage it; publish it by hand.

## What it adds

| Piece | What it does |
| --- | --- |
| **Cooper mode** | A mode in Amp's picker (Opus 5.5 high, built on Amp's `high` mode). It loads the `cooper:cooper` skill on every new task. |
| **Bundled skills** | `cooper` is listed. Its helpers, principles, and `unslop` are registered with `listed: false`, so they never load on their own but resolve by path. |
| **`cooper_subagent`** | Runs a subagent on the exact model and effort a Cooper step declares (Opus 5.5, Sonnet 5.5, GPT-6.1 Sol), in the same orb and checkout. Amp's `Task` always uses the thread's model. |
| **`cooper_checkpoint`** | Every checkpoint and question as a dialog only a person can answer: the catch-up as Markdown, your pick preselected, an "Other" box. Labels the thread `cooper-checkpoint` while it waits. |
| **Guardrails** | In Cooper threads and their subagents: blocks `gh pr create --draft`, `gh pr ready --undo`, and `gh stack submit --auto` without `--open`. Asks you before `gh pr merge` or any push to `main`, `master`, `trunk`, `develop`, `production`, `staging`, or `release/*`. |
| **Thread label** | Cooper threads get the `cooper` label. |
| **Orchestrate** | Big jobs run as Cooper-mode worker threads, one orb each, at most four at a time, started with Amp's thread tools. Only an Orchestrate job starts extra orbs. |

Not built yet: auto-continue after a turn, status labels and quick actions, the Ship-button prompt.

## Layout

| Path | What it is |
| --- | --- |
| `cooper-plugin/index.ts` | The plugin. |
| `skills/` | Amp's copy of Cooper, its helpers and principles, and `unslop`. Publishing bundles them into the plugin as `skills/`. |

The skills are a second copy of the repo's `skills/`, kept in step by hand; see `AGENTS.md` at the repo root. This copy's Amp-only parts:

- Questions go through `cooper_checkpoint`; subagents through `cooper_subagent` (`skills/cooper/references/delegation.md`).
- Visuals are Mermaid, Markdown tables, and text trees, with a thread artifact for long ones (`skills/cooper/references/visuals.md`). No HTML pages.
- Grills are saved as thread artifacts, since an orb keeps no home folder.
- Babysit waits on Amp's GitHub subscriptions. PR bodies end with the thread URL; handoffs link `https://ampcode.com/threads/<T-id>`.
- Credentials come from the project's Amp secrets.
- Orchestrate starts workers with `create_thread` in Cooper mode, one orb each, and its verifier checks out the PR head in a temporary worktree.
- No `disable-model-invocation`, no `agents/openai.yaml`, no `cooper-improve` or `cooper-models`.

A new or renamed skill also goes in `LISTED` or `UNLISTED` at the top of `cooper-plugin/index.ts`.

## Check

```sh
npx -y esbuild@0.24.0 amp/cooper-plugin/index.ts --format=esm --log-level=warning > /dev/null
find amp/cooper-plugin amp/skills -type f | wc -l   # Amp loads at most 500 files and 25 MiB per plugin
```

For a full typecheck, install `@ampcode/plugin` and `typescript` in a scratch folder and run `tsc --noEmit --strict` on a copy of `index.ts`.

## Publish

It's installed as a workspace plugin, so it loads for everyone in the workspace. From a machine signed in to Amp, at a checkout of this repo:

```sh
amp clone workspace-plugins /tmp/amp-workspace-plugins
rm -rf /tmp/amp-workspace-plugins/cooper
mkdir -p /tmp/amp-workspace-plugins/cooper
cp amp/cooper-plugin/index.ts /tmp/amp-workspace-plugins/cooper/
cp -R amp/skills /tmp/amp-workspace-plugins/cooper/skills
cd /tmp/amp-workspace-plugins && git add -A && git commit -m "cooper: <what changed>" && git push
```

The folder name `cooper` is the plugin's name, so its skills show up as `cooper:cooper`, `cooper:cooper-grill`, and so on. New threads load the pushed version; an open thread needs "reload plugins". For a personal plugin instead, use `amp clone user-plugins`.
