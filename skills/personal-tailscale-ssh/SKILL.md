---
name: personal-tailscale-ssh
description: "Run work on Dan's other machines through passwordless Tailscale SSH. Invoke automatically when Dan asks to check, run, fix, install, or change something on another computer, Mac Studio, MacBook, Archie, or Paperclip, or asks about his cross-machine SSH setup."
---

# Work on Dan's other machines

When Dan asks for work on another machine, connect and do the requested work over Tailscale SSH. The request authorizes the remote work within its stated scope. Discover the target and try the existing connection before asking Dan to run commands himself.

## Existing setup

Verified from Dan's MacBook Pro on 2026-10-29:

- Mac Studio: `dan@stapler.tail156535.ts.net`, macOS, home `/Users/dan`. Passwordless Tailscale SSH verified. Renamed from `dans-mac-studio` on 2026-10-29; the old name and its `dans-mac-studio-ssh` endpoint no longer resolve. It runs the CLIProxyAPI hub at `https://stapler.tail156535.ts.net`.
- Archie: `root@archie.tail156535.ts.net`, Linux, home `/root`. Passwordless Tailscale SSH verified. `dan@archie` is rejected by tailnet policy; use the verified account.
- Paperclip: `dan@paperclip.tail156535.ts.net`, Linux, home `/home/paperclip`. Passwordless Tailscale SSH and passwordless sudo verified. The account was renamed from `paperclip` on 2026-10-29, so `paperclip@paperclip` is rejected; the home folder kept the old name.
- MacBook Pro: `dans-macbook-pro.tail156535.ts.net`, macOS, user `dan`. Its SSH server support has not been verified.

Treat these names as discovery hints. Refresh `tailscale status --json` for current names, IPs, and online state. A device being online does not prove it accepts SSH. Dan renames machines and accounts: when a verified destination is suddenly rejected, check `tailscale status` for a new name, and ask which account replaced the old one, before concluding policy changed.

Tailscale SSH authenticates with tailnet identity and authorizes the destination account through tailnet policy. It does not need a copied private key or a password. The MacBook's `paperclip` alias in `~/.ssh/config` (user `dan`) also names an SSH key, but the Tailscale SSH connection above was verified independently.

## Connect and work

1. Run `hostname`, `whoami`, and `tailscale status --json` locally. Resolve the machine Dan meant and identify whether it is already the current host. If the target is ambiguous after discovery, ask which machine.
2. Prefer the `tailscale` CLI on PATH. On the Macs it is `/opt/homebrew/bin/tailscale`. Check `tailscale ssh --help` if another client installation behaves differently.
3. Verify the remote identity with a bounded, noninteractive command:

   ```sh
   tailscale ssh dan@stapler.tail156535.ts.net -oBatchMode=yes -oConnectTimeout=10 'hostname; whoami; uname -s; printf "HOME=%s\n" "$HOME"'
   ```

   Substitute the verified destination account and hostname. Set an overall execution timeout as well, so a policy check or unreachable host cannot leave the agent waiting indefinitely. The wrapper handles MagicDNS, userspace transport, and host-key verification through Tailscale.
4. Run the requested commands remotely. Discover paths and read the target repo's `AGENTS.md` before editing. Inspect its working tree before changing files. Quote remote commands so local `$HOME`, variables, and command substitutions do not expand accidentally. For scripts, pass a literal script on stdin to an explicitly chosen remote shell.
5. Verify the result on the target machine. Report the machine, what changed, and the result. Remote SSH commands do not change the current T3 thread's workspace binding.

## If the connection fails

- Offline or timeout: check fresh Tailscale status and try one bounded `tailscale ping`. Report an unreachable machine instead of retrying forever.
- Policy denial: check the destination account against the verified list. Do not guess through account names or change tailnet policy to get access.
- Browser authentication or a check URL: give Dan the returned action and resume after he completes it. Passwordless access can still require a policy reauthentication check.
- Missing client or unsupported server: inspect the installed variant before proposing a change. Tailscale's SSH server supports Linux and the open-source macOS `tailscale` plus `tailscaled` variant. A macOS GUI client alone does not provide that server.
- For a target already configured for ordinary SSH over Tailscale, use its existing noninteractive key-based connection if needed. Distinguish that from Tailscale-managed SSH. Never disable host-key verification, enable password login, or copy private keys to make a connection work.

Adding a new SSH endpoint requires the target to join the tailnet, a supported server with `tailscale set --ssh`, and tailnet rules allowing network access and SSH to the chosen OS account. Change that setup only when Dan asks for setup or repair; otherwise use the existing configuration.

See the official [Tailscale SSH documentation](https://tailscale.com/docs/features/tailscale-ssh) and [CLI reference](https://tailscale.com/docs/reference/tailscale-cli) when setup details need checking.
