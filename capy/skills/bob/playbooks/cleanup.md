# Cleanup

Free disk by pruning worktrees and other leftovers. Deleting is the one thing here no review catches, so the checks below are the review.

1. **Audit.** Record `df -h /`. List worktrees from `git worktree list --porcelain` in each repo, never from paths you type by hand; Capy manages its own machines and checkouts; paths alone do not establish ownership. For each, collect:
   - size (`du -sh`) and the age of its last commit
   - its branch, whether that's merged into the base, and its PR state (`gh pr list --head <branch> --state all`)
   - tracked edits not committed (`git -C <path> status --porcelain`): these are **wip**; untracked files are **scratch**
   - whether Capy owns the machine or checkout, which thread or child uses it, and whether it is active; unknown ownership means Hold

   "The base" is the branch PRs target: resolve it from `git symbolic-ref refs/remotes/origin/HEAD` (falling back to `origin/main`, then `origin/master`), never a literal `origin/main`, and use the PRs' target instead when it differs. Fetch it first, and name the base in the audit's header.

   Write the audit as a script in `/tmp/bob-cleanup/`, per `build-the-lever`, so it can be rerun after pruning.
2. **Bucket each one.** **Safe:** merged or closed PR, clean, no live thread. **Check:** a thread ran it recently, or nothing explains why it exists. **Hold:** wip, an open PR, a live or pinned thread, or an active Capy machine or child. A bucket is advice, not permission.
3. **Checkpoint.** Show the audit per `references/visuals.md` (a table by bucket, with sizes and the reason for each) and ask per **How to ask**: a multi-select of what to prune, with "Send it" for the Safe set. For any wip worktree you'd prune, show its diff first; uncommitted work is gone for good once removed. Name the scratch files.
4. **Prune what was picked.** Never manually prune a Capy-managed checkout. For an ordinary unmanaged worktree the user selected, recheck its status immediately before `git worktree remove <path>`. Stop if it is dirty; forcing removal requires explicit approval of the displayed losses. Use native lifecycle controls for managed machines only when explicitly authorized. Branches survive, so commits aren't lost. Rerun the audit and `df -h /`.
5. **Other space,** only when the user wants more and only what they pick: unavailable simulators (`xcrun simctl delete unavailable`), test device clones (`xcrun simctl --set testing delete all`), old simulator runtimes, Xcode `DerivedData`, and package caches (pnpm, bun, uv, brew). Never clear a cache the user said to keep.

**Reply:** space before and after, what was pruned, and one line per item held back with the reason (which thread uses it, or what's uncommitted). **Show:** the audit table before and after, freed space as a bar.
