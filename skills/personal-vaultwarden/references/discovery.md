# Setup and discovery

## Verified installation and source of truth

The vault is Vaultwarden on Archie at
`https://archie.tail156535.ts.net:8443`, reachable over Tailscale. Archie's Serve
route forwards HTTPS to its loopback vault service on 4743. This is a vault
endpoint; never deploy the local Bitwarden MCP there.

The coding Loadout installs Homebrew `bitwarden-cli`, Node, and official npm
`@bitwarden/mcp-server`. It wires a `bitwarden` stdio MCP for Claude, Codex,
Cursor, and Grok. The executable provided by that npm package is
`mcp-server-bitwarden`. Node 22+ is required. File-based MCP tools are disabled
unless the user separately configures `BW_ALLOWED_DIRECTORIES`.

The maintained implementation is in Dan's `dan-myles/skills` repository:

- `files/bitwarden/bitwarden-local`: launcher shell and Homebrew PATH handling.
- `files/bitwarden/launcher.mjs`: endpoint checks, session-file loading, MCP start.
- `docs/bitwarden.md`: installation and per-machine authentication.
- `tags/coding.toml`: packages, files, and local MCP declarations.

Installed files are `~/.local/bin/bitwarden-local` and
`~/.local/lib/loadout/bitwarden/launcher.mjs`. If behavior changes, inspect these
sources rather than inventing a second server or modifying a project's MCP file.
`bitwarden-local configure` sets Archie only while unauthenticated; it preserves
an existing authenticated vault and refuses to switch that vault to another host.
`bitwarden-local mcp` does the same check before starting the official stdio
server. Its configuration check runs before it loads the optional session file,
so a printed `locked` there does not prove the saved session is invalid.

## State reported on Paperclip, 2026-10-29

Dan's other agent verified a saved vault login and a working unlocked session at:

```text
~/.local/state/bitwarden-mcp/session    regular file, owner dan, mode 0600
~/.local/state/bitwarden-mcp/           owner dan, mode 0700
```

No master password is saved. Dan accepts keeping this session locally. With its
token injected as `BW_SESSION`, `bw status` returned `unlocked`; without it,
plain `bw status` returned `locked`. This is historical successful state, not a
promise that today's token still works. Re-check through the helper before use.

The launcher's precedence is an inherited `BW_SESSION`, then the local session
file, then no token. A stale inherited token can shadow a good file. Diagnose
that without printing either token. Respect `BITWARDENCLI_APPDATA_DIR`; a session
for another data directory, account, or server may not work. Do not mix them.

## Discovery sequence

1. Establish the current machine and account with `hostname`, `whoami`, and the
   home directory. For remote work read the installed `personal-tailscale-ssh`
   skill and use the verified account. Do not assume `/home/dan` on every host.
2. Check executable paths and versions for `bw`, `node`, `bitwarden-local`, and
   `mcp-server-bitwarden`. Inspect only relevant MCP entries, not whole config or
   environment dumps. Check whether the local MCP is already connected.
3. Check tailnet reachability when the vault operation needs the server. Filter
   `tailscale status --json` to Archie, or use one bounded `tailscale ping archie`.
   Probe the verified HTTPS endpoint with a short timeout and discard its body.
   Do not disable certificate validation, change DNS, expose services, or reset
   Tailscale Serve. A 200 response confirms reachability, not authentication.
4. Locate this skill's installed directory and run:

   ```sh
   python3 /absolute/path/to/personal-vaultwarden/scripts/session.py status
   ```

   The output is only an auth state and where the token came from. The helper
   reads the session in-process, never through a shell `cat`, and fails closed on
   wrong endpoints, unknown state, invalid permissions, or malformed output.
5. If the CLI points elsewhere, preserve it. Ask which vault/account belongs to
   the task instead of running logout or changing config. If the launcher is
   missing, consult Loadout and its plan before installing another copy. Missing
   tooling is a setup issue, not a reason to ask for the master password.

Do not read `data.json`, keychains, historical password files, unrelated accounts,
or browser databases looking for a workaround. No broad home-directory secret
search. Item discovery is a narrow domain/account query described in transfer.md.

## Other machines

MacBook, Studio, and Paperclip use their own CLI login, local session, and process
environment. Do not copy Paperclip's session to another host, assume a remote
secret file is local, or change Archie's vault service as part of a client login.
The coding tag distributes this skill alongside its tools. Using it from a coding
machine for a task on another host does not authorize installing tools on that
host without the relevant task scope.
