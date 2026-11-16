# Agent notes

## Cooper has two copies

Cooper lives in two places:

- `skills/cooper*` (and `skills/unslop`): the loadout copy, for T3 and Claude Code. Loadout syncs it to Dan's machines.
- `amp/skills/`: the Amp copy, bundled into the Cooper Amp plugin (`amp/cooper-plugin/`) when it's published by hand; see `amp/README.md`.

When you change Cooper's general behavior (playbooks, rules, principles, checkpoints, what a PR contains), make the same change in both copies, in the same commit. Each copy keeps its own harness parts. Don't copy those across:

- Loadout copy: T3 tools, `delegate_task`, `AskUserQuestion`, `html_preview` and `html_render` pages, T3 thread links, `~/.cooper/grills/`, `personal-vaultwarden`, and the Orchestrate playbook (T3 worktree threads, `delegate_task` verifiers).
- Amp copy: `cooper_subagent`, `cooper_checkpoint`, `creating-views` visual artifacts (Mermaid only in PR bodies), artifacts, Amp thread links, GitHub subscriptions, Amp secrets, archiving each subagent thread when it returns, and no Orchestrate playbook (Amp Spaces coordinate big jobs instead). The harness parts live in `amp/skills/cooper/references/delegation.md`, `amp/skills/cooper/references/visuals.md`, and the matching lines of `cooper/SKILL.md`, the playbooks, `cooper-grill`, `cooper-how`, `cooper-why`, and `cooper-no-comments`.

`cooper-improve` and `cooper-models` maintain this loadout and exist only in the loadout copy. See `amp/README.md` for the plugin itself.
