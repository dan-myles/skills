# Operating the loadout

How machines apply this loadout and where each agent gets its skills.

This repository is Dan's [loadout](https://github.com/dan-myles/loadout), the source his machines apply with the loadout CLI. The manifests declare skills, enabled agents, programs, and MCP servers. The deployment source is `main`; editing this checkout does not apply a machine.

## Profiles and layout

All 55 skills live in `skills/<name>`, following [the starter loadout](https://github.com/dan-myles/loadout/tree/main/examples/starter).

- `loadout.toml` declares the global agents, personal Executor, Claude instructions, and 12 shared skills for every machine.
- `tags/development.toml` adds Cooper, Dispatch, development programs, the persistent browser helpers, local Bitwarden MCP, and the other coding skills.

Machines choose a profile locally; no machine needs registering by name.

| Machine | Local profile |
| --- | --- |
| Paperclip | development |
| Stapler | development |
| MacBook Pro | none, base only |

## Agent destinations

| Loadout agent | Skill destination | T3 driver |
| --- | --- | --- |
| `claude` | `~/.claude/skills` or `$CLAUDE_CONFIG_DIR/skills` | `claudeAgent` |
| `codex` | `~/.agents/skills` | `codex` |
| `cursor` | `~/.cursor/skills` | `cursor` |
| `grok` | `~/.grok/skills` or `$GROK_HOME/skills` | `grok` |

T3 Code uses these native adapters; it needs no separate `t3` agent. Claude, Codex, and Grok pickup is confirmed for the documented homes; Cursor pickup is inferred. T3 provider instances with custom homes need their own pickup check. Cursor also reads shared skill directories, so `doctor` may warn about duplicate names when several agents get copies.

Capy has no documented user-level skills folder, so it isn't declared. Its docs only cover repository `.agents/skills` and `.claude/skills`, Drive, and plugins.

## Shared services

The global `executor-personal` MCP uses `https://mcp.executor.sh/mcp` for Claude, Codex, Cursor, and Grok. Select Dan's personal team when signing in to Executor in each client on each machine; Loadout distributes the server configuration, not OAuth credentials. See [Executor's sign-in documentation](https://executor.sh/docs/mcp#signing-in-from-the-browser).

The automatic [personal-messaging skill](../skills/personal-messaging/SKILL.md) keeps messages to other people concise and needs Dan's instruction before sending. The automatic [personal-vaultwarden skill](../skills/personal-vaultwarden/SKILL.md) handles credential discovery, secure unlock, and approved-task-only transfer.

The development profile installs Bitwarden CLI and its official local stdio MCP, pointed at Dan's Vaultwarden on Archie. Machines start logged out; see [Bitwarden setup](bitwarden.md). It also installs agent-browser and a separate persistent personal browser profile; see [personal browser setup](personal-browser.md).

## Apply on a machine

Use Loadout 0.1.6 or later, including the executable background sync uses. Run setup as the normal user, letting individual package steps ask for sudo.

On a new development machine:

```sh
loadout init https://github.com/dan-myles/skills --profile development
```

A noninteractive init without `--profile` selects none and applies only the base and OS layers. `loadout profile set development` saves a choice without applying; `loadout profile set --none` clears it. Review `loadout plan` before applying.

The managed clone tracks `main`. `loadout update` upgrades the CLI; `loadout sync` fetches and applies the loadout. Start a new agent session after applying to pick up changed skills.

## Checks

Before committing skill changes, run `loadout validate .` and the link and header check:

```sh
uv run --with pyyaml python -I docs/check-skills.py
```

It copies every declared skill into a temporary folder, follows every relative link, and checks that each Cooper and Dispatch skill is manual-only with a matching name.
