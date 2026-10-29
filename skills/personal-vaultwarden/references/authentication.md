# Authentication, secure input, and recovery

## Interpret status with the session loaded

| Result | Meaning | Next step |
| --- | --- | --- |
| `unauthenticated` | This CLI data directory has no saved login | Establish a login on this machine if the task needs it |
| `locked`, no token | Saved login, no unlock session supplied | Request a private unlock only when needed |
| `locked` or rejection with a token | Token may be stale, revoked, shadowed, or for another vault | Check endpoint/data directory and token precedence before one fresh unlock |
| `unlocked` | This process can use the vault | Match the item and use only the authorized fields |
| Error/unknown | Cannot establish a trustworthy state | Diagnose installation/connectivity/permissions without dumping output |

A successful MCP connection only proves the process started, not that its vault
is unlocked. A saved CLI login is not a saved master password. A login may expire;
a session file's existence is not proof its token remains usable.

## Prefer secure input

When a password is actually needed, discover and call T3's `request_secret`
tool yourself with `delivery: "file"`, a specific label, and a reason naming the
machine and operation. The exposed tool may be named `mcp__t3_code__request_secret`.
Use its current schema. It returns a private path; do not read that file into
model context or paste its contents into another tool argument. A `secretRef`
is not a file path. Request file delivery for a CLI operation.

For a saved login on this machine, run the helper with the returned one-use path:

```sh
python3 /absolute/path/to/personal-vaultwarden/scripts/session.py unlock \
  --password-file /private/path/returned/by/request_secret
```

The path itself is not the password. Pass it with correct shell quoting or a
subprocess argument array. The helper checks the endpoint, captures
`bw unlock --passwordfile <path> --raw` entirely inside a subprocess, tests the
new token with `bw status`, then atomically writes the local session with 0600
permissions inside a 0700 directory. It prints only success metadata. It deletes
the password file and unfinished temporary session file in `finally`, including
failed unlocks and errors. Its only persistent output is the session Dan approved.
Never point it at a reusable password file; its input is deliberately consumed.

Do not request a password or run unlock when the saved session already works.
Unlocking can invalidate older session keys, so coordinate with agents using the
same vault before replacing its token. After replacement, reconnect/restart only
the relevant local Bitwarden MCP processes. They read the session at launch;
they do not watch the file. Do not restart a browser or the whole agent service
just to refresh this MCP.

If operating on a remote machine, the secure file must be delivered to that
machine through the environment's supported secure mechanism. Otherwise transfer
it over the existing authorized SSH connection through process stdin into an
owned 0600 temporary file, without printing it, then delete both copies in
`finally`. Do not send a file path from one host as if it existed on another.
Never copy persistent session keys between machines.

## A machine with no saved login

First verify the vault endpoint with the existing launcher and identify Dan's
intended vault account. Ask for a missing account identifier as ordinary text;
ask for the master password through secure input. A controlled runner can call
`bw login <email> --passwordfile <private-file> --raw` with captured stdout and
stderr, then validate and save the resulting token as above. The email argument
is an account identifier; passwords, session keys, and OTPs are never arguments.
Do not print the CLI login response: it can contain the session key and an
`export BW_SESSION=...` example.

The bundled helper handles unlock only. Do not feed a logged-out vault to it
repeatedly. For first login, use a task-scoped runner whose exception handling,
cleanup, and output suppression match the helper. Avoid changing login methods,
creating API keys, or disabling MFA just to make automation easier.

If login requires MFA, request any one-use code through secure input too. CLI
`--code <otp>` would expose it in process arguments. Use a supported secure-input
flow or an in-process PTY driver that reads private files and supplies responses
without recording the transcript. Validate the prompt sequence and stop on an
unexpected prompt instead of guessing. If no reliable private automated path is
available, let Dan complete just that interactive step. Do not claim the existence
of `request_secret` alone makes every MFA/browser flow automatable.

If secure-input tools are genuinely unavailable, a private unrecorded terminal
or the official MCP's native secure password dialog on a GUI machine is the
fallback. The headless official MCP unlock tool refuses to open such a dialog.
Do not demand manual terminal entry while a secure file input and the unlock
helper can do the work. Never ask for secrets in chat. No master password file
is retained after an attempt.

## Invalid-session recovery

1. Capture a fresh status with the selected token. Keep stdout/stderr private
   except for a sanitized state. Check tailnet connectivity separately; a timeout
   is not an invalid password.
2. If an inherited `BW_SESSION` is present, re-check in a child environment with
   that variable removed so the helper can use the saved file. Do not unset it
   globally or print its value. Preserve another agent's environment.
3. Confirm the endpoint, CLI data directory, and account context. Do not replace
   an authenticated different vault. A rejected item lookup may mean a wrong
   item or insufficient access rather than an expired session.
4. If still locked, coordinate one fresh unlock via secure input. Stop after one
   failed attempt and report only the failure category. Do not silently retry
   passwords, delete the cache, or log out to clear an error.
5. Validate `unlocked` with the new token, replace the session atomically, and
   reconnect the MCP. Never promise the session will remain valid forever.

If a helper process is forcibly killed, `finally` cannot run. On recovery, remove
only the known one-use private file or temporary file from that interrupted
attempt. Do not sweep unrelated secrets or delete the working session.

## Lock and revoke, only when requested

Coordinate with current users. Stop or disconnect all affected local Bitwarden
MCP processes so none retains a session in memory. In one controlled process,
load the relevant session, run `bw lock` with output captured, remove
`~/.local/state/bitwarden-mcp/session`, and discard `BW_SESSION` from that process.
Verify status without a token. Removing the file by itself does not revoke an
already-running MCP's in-memory session.

Use `bw logout` only when Dan requests removing this machine's login. Account-wide
session revocation and credential rotation are broader actions requiring that
scope. Do not change the vault password, delete items, clear browser logins, or
close another agent's session as incidental cleanup. Dan accepts the persistent
session file; ordinary task completion is not permission to remove it.
