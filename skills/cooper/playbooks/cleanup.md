# Cleanup

Free disk by pruning worktrees and other leftovers. Deleting is the one thing here no review catches, so the checks below are the review.

1. **Audit.** Record `df -h /`. List worktrees from `git worktree list --porcelain` in each repo, never from paths you type by hand; T3 and Orchestrate put worktrees in places a guess misses. For each, collect:
   - size (`du -sh`) and the age of its last commit
   - its branch, whether that's merged into the base, and its PR state (`gh pr list --head <branch> --state all`)
   - tracked edits not committed (`git -C <path> status --porcelain`): these are **wip**; untracked files are **scratch**
   - the T3 thread bound to it (`t3_thread_list`, `t3_worktree_list`), when it last ran, and whether any `~/.bob-n-frank/orchestrate/*/units.tsv` lists it as running

   "The base" is the branch PRs target: resolve it from `git symbolic-ref refs/remotes/origin/HEAD` (falling back to `origin/main`, then `origin/master`), never a literal `origin/main`, and use the PRs' target instead when it differs. Fetch it first, and name the base in the audit's header.

   Write the audit as a script in `/tmp/cooper-cleanup/`, per `build-the-lever`, so it can be rerun after pruning.
2. **Bucket each one.** **Safe:** merged or closed PR, clean, no live thread. **Check:** a thread ran it recently, or nothing explains why it exists. **Hold:** wip, an open PR, a live or pinned thread, or a running Orchestrate unit. A bucket is advice, not permission.
3. **Checkpoint.** Show the audit per `references/visuals.md` (a table by bucket, with sizes and the reason for each) and ask per **How to ask**: a multi-select of what to prune, with "Send it" for the Safe set. For any wip worktree you'd prune, show its diff first; uncommitted work is gone for good once removed. Name the scratch files.
4. **Prune what was picked.** For each path: `git worktree remove --force <path>`; if the folder survives on ignored build output, `rm -rf` it; then `git worktree prune`. Branches survive, so commits aren't lost. Rerun the audit and `df -h /`.
5. **Other space,** only when the user wants more and only what they pick: unavailable simulators (`xcrun simctl delete unavailable`), test device clones (`xcrun simctl --set testing delete all`), old simulator runtimes, Xcode `DerivedData`, and package caches (pnpm, bun, uv, brew). Never clear a cache the user said to keep.

**Reply:** space before and after, what was pruned, and one line per item held back with the reason (which thread uses it, or what's uncommitted). **Show:** the audit table before and after, freed space as a bar.
