# Development profile migration

This checkout is the final target, not a safe first commit to publish to the old
fleet. Do not sync/apply it with 0.1.5 or publish the mapping removal before the
steps below. Editing it does not migrate installed machines.

Dan selected development for Paperclip and Stapler. MacBook Pro is base-only;
Grokbot retains its declared exception and must not select development. Only
`tags/development.toml` remains. Parsec and BetterDisplay are manual choices;
removing their declarations does not uninstall programs or delete their data.

## Rollout order

1. Obtain authorization for release/upgrade and rollout. Verify a published
   profile-capable CLI exists. At the audit, latest release, Paperclip, and Stapler
   were all 0.1.5. No Loadout command was found on the MacBook's checked PATH.
2. Prepare a compatibility commit BEFORE this final layout reaches main: rename
   coding to development and change all existing coding mappings to development,
   leaving their machine layers and target files intact. Update path references.
   Review plans to confirm no lost destinations. Do not maintain two divergent
   copies of the profile: duplicate IDs patch each other silently.
3. Upgrade both Paperclip and Stapler foreground and service executables. Their
   services currently use ~/.local/bin/loadout. Verify `loadout profile --help`
   through the actual executable path in each service. Save local selections
   with `loadout profile set development` after the compatibility tag is present
   in the managed clone. Check `loadout profile list --json` and a read-only plan.
   Do not hand-overwrite machine.toml or copy it between machines.
4. BEFORE applying the final dashboard drop-in on Paperclip, run from this checkout:

   ```sh
   sh files/agent-browser/agent-browser-personal-setup --migrate-dashboard-origin-only
   ```

   This copies the existing non-secret allowed origin into the unmanaged
   ~/.config/agent-browser-personal/dashboard.env only if absent. It does not
   invoke agent-browser, systemctl, or Tailscale. Existing local settings win;
   inspect them privately for the intended origin if already present. The final
   managed access.conf reads this file. No restart is required during migration;
   schedule daemon-reload and any dashboard restart after the active sign-in.
5. Review the final plans on Paperclip and Stapler with their selections active.
   Browser wrapper/config, Linux unit/drop-in, Bitwarden launcher/MCP and all
   development skills must remain present. Review the MacBook base-only plan
   separately if it has managed state; it intentionally loses development-owned
   files/MCP keys, but not programs or private data. Account for any other old
   consumers before publishing. Hold scheduled sync during the authorized
   transition if needed, and restore its prior schedule afterwards.
6. Only then publish this final layout, apply reviewed plans and verify subsequent
   foreground/background sync. No normal machine registration remains. Do not
   add a Paperclip hostname condition to shared browser packages or services.

The generic Linux setup uses `agent-browser install --with-deps` at explicit
activation, avoiding Ubuntu 22 package names on Ubuntu 24. Loadout has no distro
version condition. An unsupported distro must fail visibly; do not invent a
version selector or silently install unrelated packages.

## Preservation and rollback

Keep local ownership records and backups. Target paths, rather than declaration
IDs, determine managed file removals. Programs are never uninstalled by Loadout.
The browser profile/runtime, Bitwarden login/session, Executor authentication,
and Tailscale Serve state are outside this migration. Do not inspect or copy
secret values. Preserve Paperclip HTTPS 443 to T3 and HTTPS 8443 to the dashboard.

If profile selection fails, keep compatibility mappings in place. To roll back a
completed mapping removal, restore compatibility mappings before clearing local
selection. Restore affected files through reviewed Loadout backups if needed.
Do not downgrade the executable while machine.toml has a nonempty profiles list:
0.1.5 rejects that state. A removed selected tag stops sync with exit 3; do not
clear profiles merely to bypass that protection.
