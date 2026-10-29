---
name: personal-loadout-programs
description: "Suggest declaring a program in Dan's loadout when it should live on more than one machine. Invoke automatically whenever Dan or the agent installs, or is about to install, a program, CLI, app, or package manager on any of Dan's machines (brew, cask, apt, npm -g, pnpm/bun global, cargo install, uv tool, pipx, go install, a GitHub release, or a curl install script)."
---

# Programs belong in the loadout

Dan's machines get their programs from his loadout, the `dan-myles/skills` repo, applied by the `loadout` CLI. A program installed by hand on one machine is missing on the next. When an install comes up, decide whether it is cross-machine, and if it is, offer to declare it.

## When to suggest it

Suggest it when the program is something Dan would want wherever he codes: a dev CLI, a language toolchain, an agent, an editor, a daemon he relies on. Skip the suggestion for a one-off (a dependency for one repo's build, a tool tried once), something a project already pins (its `package.json`, `Cargo.toml`, `mise.toml`), or a program already declared.

Check first: `grep -n "programs\.<id>\|\"<package>\"" loadout.toml tags/*.toml machines/*.toml` in the loadout checkout. If it is declared but missing on this machine, the fix is `loadout sync`, not a new entry.

Ask once, in one line, after doing what Dan asked: "This looks cross-machine. Add `<id>` to the loadout's coding tag?" Do the install he asked for either way. Never edit the loadout without a yes.

## Where it goes

- `tags/coding.toml`: every coding machine (MacBook, Studio, Paperclip). The default.
- `machines/<name>.toml`: one machine only, such as the Studio's display apps.
- `loadout.toml`: every machine, including the Grok Bot box. Rare.

## How to declare it

Each OS takes the first declared manager it knows, and only that manager decides whether the program is installed:

| OS | Order |
| --- | --- |
| macOS | `brew`, `cask`, then `cargo`, `uv`, `pipx`, `npm`, `pnpm`, `bun`, `go`, then `github` |
| Linux | `apt`, `dnf`, `pacman`, `zypper`, `flatpak`, `snap`, `brew`, then the same language managers, then `github` |

Dan wants Homebrew wherever it works. Rules learned the hard way:

- **Check the package exists before declaring it.** `brew info --formula <name>`: a cask-only app has no formula, and casks don't exist on Linux. A cask-only program needs a Linux route (npm, `github`), or stays macOS-only on purpose.
- **Never pin a version.** `npm = "t3@nightly"` is refused. Follow a channel with `github`'s `tag` instead.
- **npm, pnpm, and bun come from `node`** (`brew = "node"` in the coding tag). An npm program installs on the sync after node does.
- **A system package that is already installed** (Tailscale on Linux) gets `apt` too, so dpkg sees it and brew doesn't add a second copy:

  ```toml
  [programs.tailscaled]
  brew = "tailscale"
  apt = "tailscale"
  apt-repo = { url = "https://pkgs.tailscale.com/stable/ubuntu", key = "https://pkgs.tailscale.com/stable/ubuntu/{codename}.noarmor.gpg" }
  ```

  `apt-repo` adds a vendor's repository on a machine that lacks the package; take the URL and key from the vendor's install docs. apt installs need `loadout apply --elevated`.
- **Self-updating apps and CLIs shipped as release assets** use `github`, which installs once and leaves updates to the program:

  ```toml
  [programs.t3]
  github = { repo = "pingdotgg/t3code", tag = "v*-nightly.*", prerelease = true, bin = "t3", asset = { macos-aarch64 = "t3-*-darwin-arm64.tar.gz", linux-x86_64 = "t3-*-linux-x64.tar.gz" } }
  ```

  Asset suffixes: `.AppImage` (Linux), `.tar.gz` with `bin`, macOS `.zip` with `app`. Read the real asset names with `gh release view <tag> -R <repo>`.
- A comment above the entry says why it is declared that way when the reason isn't obvious.

The full format is in `docs/loadout-format.md` of `dan-myles/loadout`.

## Ship it

1. Edit the loadout checkout, then `loadout validate .` until it exits 0.
2. A new key needs a CLI that knows it. If the entry uses a feature newer than a machine's `loadout --version`, run `loadout update` there first, or that machine's sync fails on the whole loadout.
3. Commit (`loadout: <what and why>`) and push to `main`.
4. On the current machine, `loadout sync`, and check the program's line says `installed` or `unchanged`. `unsupported` means no declared manager is on PATH for that OS: read its reason before shrugging it off.
5. If Dan installed it by hand earlier with a different manager, say so: loadout never uninstalls, so the old copy stays until he removes it.
