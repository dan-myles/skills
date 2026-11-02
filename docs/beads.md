# Beads clients

The development profile installs the Homebrew formula `beads`, providing `bd`
on Linux and macOS. It supplies the client; it does not initialize projects,
install agent hooks or provision a database service.

## Current verified baseline

- Beads client: 1.3.2 on Paperclip and Stapler.
- Shared server: independently provisioned Dolt 2.2.0 on Stapler.
- Endpoint: stapler.tail156535.ts.net:3307, private Tailscale TCP.
- Access: one account, `beads`, with no password and full privileges (Dan's call, 2026-11-02). Dolt listens only on Stapler's loopback and Tailscale Serve forwards the tailnet port, so the tailnet is the only gate. Never expose it with Funnel or bind it to another interface. The earlier admin and probe accounts and their password files were removed; the nightly backup connects as `beads` over the local socket.
- No real Beads project is onboarded yet. `dispatch setup` onboards one; see Dispatch below.

Homebrew also installs its current Dolt dependency. This is a separate executable
from Stapler's pinned service at
`~/.local/share/beads-infra/bin/dolt`. Do not replace that service path with
Homebrew's executable or assume the two version numbers must match.

## Compatibility checks

Before joining an existing project, inspect `bd version` and use the project's
native Beads configuration. Do not initialize an empty local graph to bypass a
failed shared-server connection. Check `bd where` and the native project
diagnostics after the project has been onboarded.

Beads 1.3.2 already implements native compatibility gates:

- An older client refuses a database whose schema is newer than it supports.
- For an existing shared-server database with pending schema migrations,
  ordinary client writes refuse instead of silently upgrading every client.
  Reads can continue as documented by upstream.
- An operator first upgrades and checks every client's version, backs up the
  database, then performs the explicit migration once. Shared databases with
  Dolt remotes require the stronger designated-migrator procedure.

Do not set `BD_IGNORE_SCHEMA_SKEW`, use `--ignore-schema-skew`, grant standing
`BD_ALLOW_REMOTE_MIGRATE`, or run forced migration/bootstrap/doctor fixes merely
to make a worker proceed. A compatibility refusal is a coordination stop.

These are Beads' native protections, not a custom wrapper or an exact-version
lock imposed by loadout. Homebrew follows its formula release. Recheck fleet
compatibility before upgrading a project schema.

This stage validates client installation and isolated schema refusal. Actual
project discovery, two-machine task claims and shared-server
migration behavior must be verified in the pilot project stage.

## Dispatch and Cooper

Dispatch and Cooper use Beads as the project tracker. The policy lives in the skills:

- [Dispatch project state](../skills/dispatch/references/project-state.md): the root issue, item shape, labels, metadata, who writes what, decisions, takeover.
- [Dispatch worker contract](../skills/dispatch/references/cooper-workers.md): launch, brief and merge policy.
- [Cooper's Beads rules](../skills/cooper/references/beads.md): what a worker or standalone Cooper writes.
- [Dispatch setup](../skills/dispatch-setup/SKILL.md): per-repository onboarding.

`bd init` commits its own files; setup amends that commit to add `[skip ci]` before pushing. `bd create --parent` copies the parent's labels, so the skills always pass `--no-inherit-labels`. `bd init` creates the server database itself, and reuses one that already exists, so setup checks the name is unused first. bd 1.3.2 warns that `dolt_server_port` in `metadata.json` is deprecated; that targets local servers and is ignored. `bd init` runs with `--skip-agents --skip-hooks`, so bd's generated `AGENTS.md`, `CLAUDE.md`, agent settings and git hooks stay out of repositories; only `.beads/` configuration is committed.

Upstream lessons adopted: commands come from `bd prime` and `--help`, not copied into skills; a coordinator assigns and the worker claims; only the assignee can close, so a worker closes its issue when its PR merges and Dispatch closes everything else after a guarded reassign; notes hold current state and comments the log; `discovered-from` marks follow-ups; decisions are `decision` issues. Not adopted: leases and `bd reclaim` as liveness (workers idle for hours on PR watches; T3 runtime is liveness), and `bd remember` memories.

## Rollout

`loadout sync` uses the published loadout clone. To review/apply an unpublished
checkout explicitly, use `loadout plan --loadout /path/to/checkout` followed by
`loadout sync --loadout /path/to/checkout`. Do not apply unrelated pending
manifest changes just to install one program.

No Dolt server setup belongs in the development profile.

Sources:
- [Beads v1.3.2 shared-server upgrade procedure](https://github.com/gastownhall/beads/blob/v1.3.2/docs/getting-started/upgrading.md#shared-servers)
- [Beads v1.3.2 storage and schema guard](https://github.com/gastownhall/beads/blob/v1.3.2/README.md)

