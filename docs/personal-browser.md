# Personal browser

The coding tag installs agent-browser through Homebrew. Paperclip overrides that
entry with npm to adopt Dan's existing global installation without a second copy.
The two `agent-browser-personal*` commands and their config are Loadout-owned
files. Paperclip also gets Ubuntu browser libraries, fonts, and a systemd user
service for the dashboard. Grok Bot gets none of these declarations.

The browser is Chrome for Testing, agent-browser's supported Chromium-based
distribution. `agent-browser-personal-setup` downloads it with `agent-browser
install`, independently of npm postinstall. Loadout 0.1.5 cannot declare this
download as a native package or run installation hooks. It also cannot enable
user services, so a fresh machine needs the activation command below after sync.
Browser downloads live in `~/.agent-browser/browsers`. Re-running setup selects
the current stable browser and reuses an already downloaded version.

## Install and activate

On Paperclip, as `dan`, never as root:

```sh
loadout sync
loadout apply --elevated
~/.local/bin/agent-browser-personal-setup
```

The first sync can report blocked system packages. The elevated apply installs
those declared libraries through sudo; it does not run the browser as root.
Later syncs keep the installed packages and update managed files. After a service
file change, run `systemctl --user daemon-reload` and
`systemctl --user restart agent-browser-dashboard`.

On the MacBook and Studio:

```sh
loadout sync
~/.local/bin/agent-browser-personal-setup
```

Mac setup starts the dashboard for the current login; it does not install a
launchd service. The browser download supports Intel/Apple Silicon macOS and
x86_64 Linux. Linux ARM64 needs a separate system Chromium configuration.
Paperclip's library package names target its Ubuntu 22.04 installation and must
be reviewed when upgrading its OS.

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

From Dan's computer on the tailnet:

```sh
ssh -N -L 4848:127.0.0.1:4848 dan@paperclip.tail156535.ts.net
```

Open <http://localhost:4848>, select `personal`, and use the live viewport to
sign in and complete MFA. The agent can open the desired login page first.
Close the tunnel with Ctrl+C. If local port 4848 is in use, forward
`14848:127.0.0.1:4848` and open <http://localhost:14848> instead.

The dashboard and per-session stream ports bind loopback. Only the dashboard
port needs forwarding; it proxies session traffic internally. This deployment
does not enable Tailscale Serve, Funnel, a reverse proxy, or external allowed
origins. Loopback access relies on the local account and SSH tunnel; it needs no
dashboard token. Any future HTTPS proxy must use agent-browser's exact allowed
origin and private token flow, not just forward an unauthenticated public port.

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

Bitwarden is not installed or configured. agent-browser 0.41.0 supports unpacked
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

macOS installation, a real MFA sign-in, and Bitwarden have not been tested.

## Sources

- [Installation](https://agent-browser.dev/installation)
- [Dashboard and private access](https://agent-browser.dev/dashboard)
- [Configuration and profiles](https://agent-browser.dev/configuration)
- [Extensions](https://agent-browser.dev/init-scripts)
- [Inspected source, v0.41.0](https://github.com/vercel-labs/agent-browser/tree/v0.41.0)
