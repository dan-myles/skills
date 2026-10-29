---
name: personal-vaultwarden
description: "Use Dan's Vaultwarden safely whenever an agent needs a password, login, API credential, vault unlock, or Bitwarden/Vaultwarden access on his machines. Automatically discover existing access and matching accounts before asking Dan for credentials. Use secrets only for the task he authorized."
---

# Personal Vaultwarden

Get the right credential to the authorized destination without putting its value
in chat, tool output, logs, or source files. This skill is automatic. It supports
an existing task; it does not authorize browsing the vault or taking unrelated
actions merely because credentials are available.

## Start with discovery

1. Identify the task, target machine, intended service/domain, and personal or
   project account. Reuse an existing authorized app login when it works. Do not
   switch accounts, touch a shared browser, or unlock a vault unnecessarily.
2. Read [setup and discovery](references/discovery.md). Locate `bw`, the local
   `bitwarden` MCP, and `bitwarden-local`; check the relevant machine and its
   tailnet connection. Do this before asking Dan to install, log in, or provide
   a password. For another machine, use `personal-tailscale-ssh` if available.
3. Run this skill's `scripts/session.py status` on the machine holding the vault
   session. It captures `bw status` with the local session injected and reports
   only status and session source. Plain `bw status` without `BW_SESSION` can say
   `locked` even when the saved session works. Never `cat` the session file.
4. If the session is missing, expired, or rejected, read
   [authentication and recovery](references/authentication.md). Use the available
   secure-input tool before falling back to a private terminal. Do not request
   a master password until discovery shows it is needed.
5. Read [credential matching and transfer](references/transfer.md) before looking
   up an item or supplying a secret. Match domain, account, and project context;
   resolve ambiguity before retrieving or submitting the credential.

## Boundaries that matter

- Use only the items and fields needed for the approved task. No vault export,
  bulk dumping, unfiltered item output, or password/TOTP/API-token printing.
  Never expose master passwords or session keys, even for troubleshooting.
- Personal vault access does not select a project identity. A GameStock, Expo,
  work, or personal account must match the user's task. Finding a credential is
  not permission to change it, create an account, reset MFA, edit an item, delete
  anything, or grant broader access.
- Prefer CLI capture and direct process/browser transfer for secrets. The official
  MCP's `get`/`list` tools can return secret values to the model. Do not call them
  expecting metadata-only output. A local MCP is not inherently a redaction layer.
- Use argument arrays and pipes, or the destination's supported private-input
  mechanism. Secret values must not appear in command arguments, URLs, generated
  scripts, visible tool arguments, screenshots, snapshots, or debug traces.
  Suppress both success and failure output from secret-bearing subprocesses.
- Use `request_secret` with `delivery: "file"` for CLI private input when the
  tool exists. Read the returned file only inside a process; delete it in
  `finally`. Never ask Dan to paste a secret into chat. Do not force terminal
  work when a secure-input tool can complete the flow.
- Do not reconfigure an authenticated vault. Keep the official MCP local stdio,
  never hosted Executor, HTTP, Tailscale Serve, or a public listener. The vault's
  HTTPS endpoint is a different service from its local MCP.
- Coordinate the shared `agent-browser-personal` session before using it. Check
  the current domain immediately before autofill and submission. Do not snapshot
  filled credentials. Honor another agent's active login or MFA ownership.
- Stop after one rejected credential submission or failed unlock; diagnose the
  state and matching before retrying. Do not cycle through accounts or passwords.

## Finish

Verify only non-secret evidence, such as successful auth status or the expected
account label. Report the outcome and any needed MCP reconnect, not the credential.
Delete one-use passwords and transfer files in `finally`, including on failure.
Dan accepts the local persistent session file; do not lock, log out, erase it, or
close a shared browser at task end unless requested. Lock/revoke instructions are
in the authentication reference. Keep all credentials out of skills, Loadout,
Git, task summaries, and shared backups.
