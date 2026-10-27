# Loadout conversion checks

Checked on 2026-10-27 against [loadout CLI commit bf2e2f4](https://github.com/dan-myles/loadout/tree/bf2e2f4e746c6039ef27c2e3b5cef0db36ef53c4). Its README, GLOSSARY.md, docs/architecture.md, and src/manifest schema were read before choosing the layout. Built with Rust 1.98.1 using `cargo build --locked --bin loadout`.

## CLI results

```text
$ loadout validate .
valid: . (3 layers, 49 items, 0 warnings)
exit 0

$ loadout plan --loadout . --json
machine: dans-mac-studio
49 adopt, 147 create, 0 blocked, 0 drifted, 0 unsupported
warnings: []
exit 0

$ loadout doctor --json
healthy: true
warning: existing duplicate skill names across native agent directories
exit 0
```

Plan and doctor were read-only on the Studio. No live apply, service install, or change to another machine was performed. Doctor checks the current machine, not whether every declared custom agent can discover skills. Its duplicate-name warning covers existing skills installed for several agents; it does not invalidate the manifest.

## Skill preservation and machine resolution

SHA-256 comparison against the starting checkout at `c6341db082c7d56ad679772d820ebf6381147ae1` confirmed all 283 files across 49 skill folders unchanged. Catalog coverage is exact, with 13 global skills and 36 Bob skills in `tags/coding.toml`. Every source remains its original folder name. The historical `.skills-manager/` registry is unchanged and is not used by Loadout.

A scratch integration test imported the checked CLI's actual library and resolved and materialized this loadout with synthetic machine facts and disposable homes:

| Machine / OS | Skill destinations | Agents | Unsupported |
| --- | --- | --- | --- |
| `dans-macbook-pro` / macOS | 196 | claude, codex, cursor, grok | 0 |
| `dans-mac-studio` / macOS | 196 | claude, codex, cursor, grok | 0 |
| `paperclip` / Linux | 196 | claude, codex, cursor, grok | 0 |
| `grokbot` / Linux | 13 | grok-bot | 0 |

The bot assertions require the exact global allowlist, no `bob` or `bob-*`, only the `grok-bot` agent, and `<home>/agent-data/workflows/<skill>` destinations. All machines have no files, programs, instructions, or MCP declarations. These are library checks with synthetic facts, not remote-machine CLI runs. Capy is pending a supported destination and is deliberately absent from the manifest.

## Ownership proof

Four additional scratch tests ran the real apply and state code in disposable homes. The custom destination was `~/agent-data/workflows` on the test OS, with a preexisting `fleet-control` and an undeclared bot-created `gs-crisp-support`.

```text
PASS background apply skips a differing unowned fleet-control
PASS foreground apply backs up and replaces only fleet-control
PASS old bot fleet-control content exists in the run's backups
PASS removing the declaration deletes only the unchanged owned fleet-control
PASS gs-crisp-support content survives every step and has no ownership record
PASS matching preexisting fleet-control is adopted, then removed if undeclared
PASS adopting a top-level symlink can later remove its library target
PASS undeploying the symlink before first apply preserves the old library
5 integration tests passed; 0 failed
```

The adoption assertions expose a limit, not a promise of permanent preservation. Loadout can adopt folders it did not create. A manifest cannot enforce "never delete anything originally created by someone else" once adopted or replaced. Undeclared, unowned siblings remain outside its removal set. Relevant CLI sources are [plan/compare.rs](https://github.com/dan-myles/loadout/blob/bf2e2f4e746c6039ef27c2e3b5cef0db36ef53c4/src/plan/compare.rs), [apply/mod.rs](https://github.com/dan-myles/loadout/blob/bf2e2f4e746c6039ef27c2e3b5cef0db36ef53c4/src/apply/mod.rs), and [state/run.rs](https://github.com/dan-myles/loadout/blob/bf2e2f4e746c6039ef27c2e3b5cef0db36ef53c4/src/state/run.rs).

## Machine discovery and remaining limits

Tailnet discovery found `dans-macbook-pro`, `dans-mac-studio`, `paperclip`, and `grokbot`. Read-only SSH confirmed MacBook user `dan`, home `/Users/dan`, OS hostname `Daniels-MacBook-Pro.local`; Paperclip user `paperclip`, home `/home/paperclip`, OS hostname `Ubuntu-2204-jammy-amd64-base`. The current Studio is user `dan`, home `/Users/dan`. Save the tailnet names as Loadout identities because OS hostname detection differs on two machines.

`grokbot` was offline and its DNS name failed to resolve. Its `/home/box` home and existing workflow content rely on Dan's supplied verification. No attempt was made to replace its fleet-control. Capy's current official and installed docs describe repository, Drive, and plugin skills, with no user-global path. Loadout rejects pathless custom agents, so Capy needs a verified destination or a separate distribution decision.

The README's fresh-machine setup explicitly clones and tracks `loadout`; `init` has no branch option and would clone the default branch. Git whitespace checks passed.

## Review corrections

Claude and GPT reviewed the manifests and rollout instructions. GPT returned no findings. Claude found four rollout issues, each corrected in its own commit:

- Loadout follows top-level symlinks, so manager-created Claude and legacy Codex links must be undeployed before the first apply. The README now gives concrete dry-run, undeploy, and replan steps. The two new lifecycle tests prove the hazard and the independent-copy migration. Local inspection confirmed the Studio's existing `bob` links point into the Skills Manager library. The manager's documented undeploy dry-runs succeeded for `bob` on both agents; no links were removed.
- The pasted fresh-machine setup now runs in a subshell with `set -eu`, uses `exit` for guards, and refuses to overwrite an identity file. Guard execution passed on zsh, bash, and sh for both existing-state and state-override cases. All six cases stopped before setup effects, preserved the identity, and left the parent shell alive.
- `bob-improve` still contains Skills Manager deployment instructions. README and PARKING_LOT explicitly flag that follow-up, while the skill body remains unchanged as requested.
- Fresh-machine clones and the saved remote use public HTTPS, so background reads need no GitHub SSH key on `paperclip` or `box`.

No findings were dismissed. The CLI manifest stayed unchanged during these documentation fixes. No comments or suppressions were added, so the comment-removal helper did not apply.
