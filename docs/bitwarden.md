# Local Bitwarden for coding agents

The coding tag installs Homebrew `bitwarden-cli` and the official npm package
`@bitwarden/mcp-server`. It adds the `bitwarden` stdio MCP to Claude, Codex,
Cursor, and Grok on the coding machines. Grok Bot receives none of it. The
existing Node declaration supplies Node; the launcher requires version 22+.

The vault is Dan's Vaultwarden at <https://archie.tail156535.ts.net:8443>.
Each machine must be on the tailnet to reach it. This HTTPS endpoint is the
vault server, not an MCP endpoint. The MCP is a local child process communicating
over stdin/stdout. There is no MCP listener, service, proxy, hosted Executor
connection, or GameStock configuration.

## Sync and configure

```sh
loadout sync
~/.local/bin/bitwarden-local configure
```

On a fresh machine, a second sync may be needed after Node is installed so npm
can install the MCP package. The MCP launches the same endpoint check itself,
so configuration also happens on its first start.

The launcher reads `bw status`. If the endpoint already matches Archie, it
leaves the CLI configuration and authentication alone. If the CLI is logged out,
it can set the server with `bw config server`. If it is locked or unlocked on
another server, it refuses to change servers or launch the MCP. It never logs
out an account, logs in, unlocks, or replaces the CLI data directory. Unknown
status and failed CLI commands also stop startup without changing configuration.
An existing `BITWARDENCLI_APPDATA_DIR` is respected.

The launcher sets the MCP API and identity endpoints to Archie's `/api` and
`/identity`. It provides no organization credentials. The official server lists
organization administration tools too, but this setup does not establish that
Vaultwarden supports them. `BW_ALLOWED_DIRECTORIES` is not set, so upstream
file-based tools remain disabled by default.

## Sign in privately on each machine

Installation leaves a new vault logged out. Authentication and unlocking are
per machine. Use your own terminal, not an agent tool call, chat message,
recorded terminal, shell trace, or an argument containing your password.

For Paperclip, open an interactive SSH terminal from your computer:

```sh
ssh -t dan@paperclip.tail156535.ts.net
```

In that private terminal:

```sh
set +x
bitwarden-local configure
bw login --raw > /dev/null
```

Enter the email, master password, and MFA through the CLI's interactive prompts.
The redirected login output keeps the resulting session key off the screen.
No login is performed by Loadout.

On a desktop, the official MCP's `unlock` tool can use a native secure password
dialog after login. On headless Paperclip, upstream refuses that dialog flow.
For headless clients, the launcher accepts an optional local session file so
GUI apps and long-running agent hosts need not inherit a token from your shell.
Create it only when you intend to grant those coding agents vault access:

```sh
(
  set +x
  set -eu
  umask 077
  session_dir="$HOME/.local/state/bitwarden-mcp"
  mkdir -p "$session_dir"
  chmod 700 "$session_dir"
  session_tmp=$(mktemp "$session_dir/session.XXXXXX")
  trap 'rm -f "$session_tmp"' EXIT HUP INT TERM
  bw unlock --raw > "$session_tmp"
  chmod 600 "$session_tmp"
  mv "$session_tmp" "$session_dir/session"
)
```

Enter the master password at the hidden prompt. The token is captured directly,
not printed or placed in shell history. The launcher requires an owned, regular
0600 file and rejects symlinks. The parent directory is private. Neither this
directory nor the file is declared in Loadout, synced, or committed. It is a
plaintext local credential, so remove it when finished and exclude it from any
shared backups. No file is created by installation or validation.

Restart/reconnect the agent's Bitwarden MCP after unlocking: an already running
MCP does not reread this file. An explicitly inherited `BW_SESSION` takes
precedence over the file, but clients differ in which environment variables they
forward. Do not put a literal session key into an MCP config. The file route
works without adding any token or missing-variable reference to those configs.

Unlocking provides the agent access to vault contents, including secrets, as
well as modification and deletion tools. Do not ask it to display passwords in
chat. This is separate from the browser profile and browser extension; neither
is changed by the CLI/MCP setup.

## Finish or revoke access

Stop/disconnect the Bitwarden MCP in all agent clients, then in your private
terminal:

```sh
rm -f "$HOME/.local/state/bitwarden-mcp/session"
unset BW_SESSION
bw lock
```

Use `bw logout` instead if you also want to remove this machine's login. Removing
the file alone does not erase a token already held by a running MCP. Future
syncs preserve existing authentication; they do not re-unlock or copy it to
another machine.

## Verification

Checked on Paperclip on 2026-10-29 with Bitwarden CLI 2026.10.1 and official MCP
2026.7.0. `loadout validate .` passed with zero warnings. The test suite
`python3 tests/bitwarden-launcher.py` uses fake CLI/server processes to verify
endpoint changes only while unauthenticated, preservation of existing logins,
refusal of unknown status, token-free startup, endpoint environment settings,
and rejection of symlink or non-private session files.

A real official MCP stdio handshake and discovery returned 59 tools without
invoking vault operations. Paperclip's CLI was initially unauthenticated and
later became locked during concurrent setup; this implementation performed no
login, unlock, lock, or logout and preserved that existing login. macOS runtime
and authenticated vault operations have not been tested.

## Sources

- [Official local-only MCP and authentication requirements](https://github.com/bitwarden/mcp-server)
- [Bitwarden CLI](https://bitwarden.com/help/cli/)
- [Homebrew CLI formula](https://formulae.brew.sh/formula/bitwarden-cli)
