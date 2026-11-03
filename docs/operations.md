# Operating the loadout

How machines apply this loadout, where each agent gets its skills, and the Grok Bot and Skills Manager edge cases. Moved out of the README on 2026-11-03.

This repository is Dan's [loadout](https://github.com/dan-myles/loadout), the source his machines apply with the loadout CLI. The manifests declare skills, enabled agents, programs, and MCP servers. Standalone tools live under `tools/`, which Loadout ignores; each is installed by hand from its own README.

The deployment source is `main`. Dan reports that Loadout machine `grokbot` syncs it nightly around 3 AM America/Chicago. All 57 skill folders live under `skills/`, following [the starter loadout](https://github.com/dan-myles/loadout/tree/main/examples/starter). Manifest sources use `skills/<name>`. Changes still require Dan's merge approval; editing this checkout does not apply a machine.

## Profiles and layout

`loadout.toml` declares global agents, personal Executor, and 14 shared skills.
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
[the migration procedure](profile-migration.md) before publishing or applying
this change. Loadout 0.1.6 supports profiles; 0.1.5 cannot select them. Removing the old
mappings before local selections are ready removes managed development files.

All 57 skills live in `skills/`. Standalone tools in `tools/` and the historical
`.skills-manager/` registry are not deployed by Loadout.

## Agent destinations and limits

The automatic [personal-messaging skill](../skills/personal-messaging/SKILL.md) keeps messages to other people concise, distinguishes agent-sent messages from drafts for Dan, and requires Dan's instruction before sending. It is shared across profiles.

The automatic [personal-vaultwarden skill](../skills/personal-vaultwarden/SKILL.md) guides credential discovery, secure unlock, and approved-task-only transfer. It uses private input tools before asking for manual terminal work.

The development profile also installs Bitwarden CLI and its official local stdio MCP,
pointed at Dan's Vaultwarden on Archie. Machines start logged out; an existing
authenticated vault is preserved. See [Bitwarden setup](bitwarden.md) for
private per-machine login and headless unlocking.

Development machines also get agent-browser and a separate persistent personal
browser profile. Linux development machines get a loopback-only dashboard with optional local private HTTPS access. See [personal browser setup](personal-browser.md) for the
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

The box receives the two `grokbot-*` skills, `ketchup`, `unslop`, and the globally declared `personal-*` skills. `personal-loadout-programs` and `personal-vaultwarden` are coding-only. Dispatch and its four modes now belong to the development profile and run in T3. Review any removal of previously owned bot Dispatch skill copies before a future Loadout apply; this port does not apply machines or migrate live bots. It receives no `cooper` or `cooper-*` folders. Support retains its own Executor worker reference on the box; Cooper loads its coding helpers on its T3 machine. See [the historical Grok Bot checks](grokbot-validation.md).

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
