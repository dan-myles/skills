# Personal browser

The locally selected development profile installs agent-browser through Homebrew
on macOS and npm on x86_64 Linux. It deploys the personal wrapper, setup command,
and configuration; Linux also gets a systemd user dashboard service. Base-only
machines and Grokbot receive none of these declarations.

## Install and activate

After selecting development and syncing, run as the normal user:

```sh
agent-browser-personal-setup
```

On Linux this uses the official `agent-browser install --with-deps` installer to
choose browser libraries for its supported distro/version, then enables the
systemd user service. It can request sudo for dependencies. No browser or system
package installation runs implicitly from background sync. Unsupported Linux
distros require checking the upstream installer support before activation.
The managed Linux setup supports x86_64; ARM64 needs a separately verified browser
configuration. macOS setup downloads the browser and starts the dashboard for the
current login without installing a launchd service.

Chrome for Testing is agent-browser's supported Chromium distribution. Downloads
live in `~/.agent-browser/browsers`. Explicit setup is needed because Loadout has
no installation hooks for this download or service activation. Do not run setup
or restart services during another agent's active sign-in. Use the migration-only
command in [profile migration](profile-migration.md) to preserve the legacy origin
without installing anything or touching the live browser.

## Use the saved profile

```sh
agent-browser-personal open https://example.com
agent-browser-personal snapshot -i
agent-browser-personal click @e1
```

Read the version-matched upstream instructions with `agent-browser skills get
core --full`. For this shared personal browser, use the wrapper instead of the
core guide's per-task session creation. Agents must coordinate before navigating
it, especially while Dan is signing in. Parallel or untrusted tasks should use
ordinary agent-browser with their own temporary sessions, not this profile.

The wrapper fixes session `personal`, supplies an explicit config so repository
configs are not loaded, and uses these private directories:

- Profile: `~/.local/share/agent-browser/profiles/personal`
- Sockets and dashboard state: `~/.local/state/agent-browser-personal/run`

Both directories are created with mode 0700 and new files with umask 077.
Loadout owns neither directory's contents. Sync, setup, and dashboard restarts
do not delete logins or replace the profile. No cookies or credentials enter
Git. These files stay on each machine; Loadout does not copy logins between hosts.

An idle browser closes after agent-browser's default hour of inactivity.
Dashboard input resets that timer. The next wrapper command reopens the saved
profile; open tabs are not promised across browser restarts. Setup uses `get url`
to preserve an already open page. Only one browser process may own this profile.
Do not override the wrapper's session/profile or open the same profile elsewhere.

## Dan's live view and sign-in

On Paperclip, open the private tokenized dashboard URL directly in your browser,
outside T3 Preview. Its origin is <https://paperclip.tail156535.ts.net:8443>.
Nested dashboard input in T3 Preview did not work for Dan. The initial URL fragment
contains the private access token; the dashboard exchanges it for a secure cookie.
The plain origin alone does not establish access. Never commit or log the token.

Loadout deploys a generic drop-in that reads the optional, unmanaged local file
`~/.config/agent-browser-personal/dashboard.env`. Without it the dashboard stays
loopback-only. For private HTTPS access, set the exact approved origin locally:

```text
AGENT_BROWSER_DASHBOARD_ALLOWED_ORIGINS=https://YOUR-TAILSCALE-HOST:8443
```

Keep that file mode 0600. Do not copy Paperclip's hostname to another machine.
Configure private routing separately and restart only the dashboard at an agreed
idle time to activate a changed origin. `StandardOutput=null` keeps the tokenized
startup URL out of the journal. Tokens remain outside Loadout ownership.

The existing private Tailscale Serve route forwards HTTPS 8443 to loopback 4848.
Tailscale owns that route's persistent state; Loadout has no Serve adapter. To
recreate it on Paperclip after deploying and activating the service:

```sh
tailscale serve --bg --https=8443 http://127.0.0.1:4848
```

Use sudo only if the account is not a Tailscale operator. This command changes
port 8443 only. Preserve the existing HTTPS 443 root route to T3 on port 3773;
never run `tailscale serve reset` or replace the whole Serve configuration for
this setup. Do not enable Funnel. A dashboard restart can rotate its access
token, so avoid restarting it during an active sign-in and obtain the current
private URL through a secure handoff when needed.

An SSH tunnel remains an alternative from Dan's computer on the tailnet:

```sh
ssh -N -L 4848:127.0.0.1:4848 dan@paperclip.tail156535.ts.net
```

Open <http://localhost:4848>, select `personal`, and use the live viewport to
sign in and complete MFA. The agent can open the desired login page first.
Close the tunnel with Ctrl+C. If local port 4848 is in use, forward
`14848:127.0.0.1:4848` and open <http://localhost:14848> instead.

The dashboard and per-session stream ports still bind loopback. Only the dashboard
port needs proxying or forwarding; it proxies session traffic internally.
HTTPS access requires both tailnet access and dashboard authorization. Loopback
access relies on the local account and SSH tunnel; it needs no dashboard token.

The dashboard is a web-page viewport, not a full desktop. Browser chrome,
native OS dialogs, hardware security keys, and some anti-automation login flows
may need a different workflow. No real account or MFA flow is exercised by the
setup checks.

## Service and recovery

```sh
systemctl --user status agent-browser-dashboard
journalctl --user -u agent-browser-dashboard -n 50
agent-browser-personal session info --json
agent-browser-personal close
systemctl --user restart agent-browser-dashboard
```

Paperclip already has user lingering enabled, so its enabled dashboard service
can run after logout and start at boot. A replacement machine needs that set
separately with `sudo loginctl enable-linger dan`. The browser itself starts on
demand, and its profile persists independently of the dashboard service.

To disable the dashboard, run `systemctl --user disable --now
agent-browser-dashboard` before removing its Loadout declaration. Close the
personal browser separately. Neither action removes the saved profile.

## Bitwarden later

The Bitwarden CLI and local MCP are declared in development; see [Bitwarden setup](bitwarden.md). The browser extension is not installed. agent-browser 0.41.0 supports unpacked
extensions via `--extension`, but extensions make Chrome run headed. Paperclip
would then need an `xvfb` package declaration; this agent-browser version can
start its own authenticated private Xvfb display when no DISPLAY is present.
No noVNC service is required for page viewing. Extension popup UI and the actual
Bitwarden unlock/autofill flow still need verification before deployment.

## Verification

Verified on Paperclip on 2026-10-29 with Loadout 0.1.5, agent-browser 0.41.0,
and Chrome for Testing 156.0.8078.80:

- `loadout validate .` passed with 124 items and zero warnings.
- `loadout apply --loadout . --elevated` installed the missing declared libraries
  and deployed the helpers/config/service. The existing npm CLI was unchanged.
- The setup command installed Chrome and enabled the dashboard user service.
  Re-running setup preserved the active page.
- A disposable loopback test page received dashboard WebSocket mouse and keyboard
  events, and the dashboard delivered live image frames through its proxy route.
- A test cookie and localStorage value survived browser close/reopen. The test
  values were then removed and the browser returned to `about:blank`.
- Restarting the dashboard service left the browser and current page intact.
- `ss` showed only loopback listeners for the dashboard, session stream, and CDP.
  Profile and runtime directories had mode 0700.

The later Paperclip access update was checked against the installed drop-in and
Tailscale Serve state: HTTPS 8443 proxies loopback 4848 and HTTPS 443 still proxies
T3 on 3773. Adopting the matching drop-in requires no service restart. The active
personal sign-in session was not navigated or closed during that update.

These are historical browser checks, not verification of the profile migration. macOS browser activation and extension autofill remain unverified.

## Sources

- [Installation](https://agent-browser.dev/installation)
- [Dashboard and private access](https://agent-browser.dev/dashboard)
- [Configuration and profiles](https://agent-browser.dev/configuration)
- [Extensions](https://agent-browser.dev/init-scripts)
- [Inspected source, v0.41.0](https://github.com/vercel-labs/agent-browser/tree/v0.41.0)
