# Maintain

Keep `verify-<app>` true to the app. Cover every feature file from source and drive every feature live at least once. The unit is the feature, not every sentence.

Only edit the verify skill's own folder: its `SKILL.md`, `features/`, and the scripts it owns.

1. **Check the index.** Read `features/README.md` and list the folder. Fix missing, extra, duplicate, or dead entries.
2. **Read the source.** Start one read-only subagent per feature file, all at once, on `bob-verify.readers` in `../bob-models/models.yaml`. Each explains how that feature works from the code, flags where the map has drifted (with `file:line`), and returns one recipe to drive it. Subagents never drive the app or edit files. Each returns: summary, source entry points, drift or "none", recipe.
3. **Reconcile.** Make sure every feature file got a summary. Merge recipes that share an app state. Spot-check the drift they cite; don't re-prove claims that came back clean. Look through recent commits for user-facing surfaces the map doesn't have, and add one only with a concrete source path.
4. **Drive it live.** Required even when the source looked clean. Follow the skill's own Launch: one long-lived instance driven in order for a server or UI, a fresh session per drive for a short-lived CLI. Drive every feature at least once. Throughout:
   - Run doctor before the first drive, on every fresh session, and after any failed drive. When doctor can't see the problem (a stuck UI on a healthy process), reset to a known state or relaunch.
   - Check captured evidence after every cleanup.
   - Clean up after every failed try. On a shared instance, clean what the drive left, not the instance.
   - When doctor fails because the skill drifted, fix the skill and retry once, restarting only what the fix touched. A second failure makes the run blocked.
   - A feature you can't reach is unreachable only with the missing prerequisite (auth, entitlement, OS, outside state) and the route you tried. If the map doesn't mention that prerequisite, that's drift.
   - Re-drive every harness fix before it ships. Tear down after the last drive.
5. **Sort what you found.**
   - The map describes the user's view wrong, or leaves something out: drift. Fix the map.
   - The app works but the harness can't drive it: a harness gap. Fix the harness, keeping helper scripts executable and documented.
   - The app is broken: a product bug. Report it to the user. It stays out of this PR.
6. **Finish with one outcome.**
   - **Clean.** Every feature covered from source and live, nothing to fix. No branch, no PR.
   - **Changed.** One PR of proven fixes to the skill folder. Reread every changed file before opening it.
   - **Blocked.** Coverage couldn't finish, or a fix couldn't ship safely. Say exactly what blocked it.

Keep run notes (features covered, unreachable prerequisites, drift found) in a scratch folder. Don't commit them.

**Reply:** the outcome, coverage per feature (source and live), drift fixed, harness gaps fixed, product bugs found, unreachable features with their prerequisites, and the PR link if any. **Show:** a grid of features against source and live coverage, drift and gaps marked.
