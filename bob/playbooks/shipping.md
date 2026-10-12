# Shipping

Land PRs only after someone other than their author verified them, bottom of the stack first, one at a time. This is the step after Babysit, and it runs only when the user says to land, ship, or merge.

Merge with the repo's merge method from its AGENTS.md, squash when it doesn't say.

1. **Verify each PR on its own.** One verifier per PR, started per `../bob-models/references/delegation.md` on `bob.verifier` in `../bob-models/models.yaml`, so it's a different model from the one that wrote the code. It drives the real product through the repo's verify skill when there is one, comparing the PR's base with its head, and returns PASS, PASS with notes, or FAIL, posted as a comment on that PR. CI green and an approving bot aren't verdicts. Record each verdict with its head SHA, base SHA, and `git patch-id` of the base-to-head diff.
2. **Find the landable run.** Walk up from the lowest unmerged PR and stop at the first one without a pass. A passing PR above an unverified one can't land. Report that ceiling and what breaks the chain.
3. **Check the verdict still matches.** Before landing a PR, compare its current patch-id with the recorded one. A rebase or retarget rewrites SHAs and can quietly invalidate a verdict. A different patch gets verified again. The same patch keeps its verdict, but mergeability and CI get rechecked at the current head.
4. **Prepare only the bottom PR.** Fetch the base branch. If the bottom PR needs it, rebase its branch onto the exact tip and push with `--force-with-lease`; that branch is the only one you may force-push, and only here. Retarget it to the base branch if it pointed elsewhere. Run step 3 again. Don't touch the PRs above it yet.
5. **Merge one PR.** When it's mergeable, merge it with `gh pr merge <n>` and the repo's method. If checks are still running and the user asked for merge-when-ready, arm only this one with `--auto`. Wait for the merge before going on.
6. **Recompute after every merge.** Fetch, confirm the merged commit is on the base branch, drop the PR from the list, and look at the new bottom PR's base, head, checks, and patch-id. Don't assume GitHub retargeted it. Repeat from step 3. Wait with `watch_pull_request`; don't change the queue while a merge is pending, and diagnose a stall before acting.
7. **Stop at the ceiling.** Report what landed, the next unverified PR, and what verifying it would take. Going further is a new pass from step 1.

**Reply:** the verified run and its ceiling, each PR's verdict and which model gave it, what was armed or merged, and what the next gap needs. **Show:** the stack bottom to top, each PR marked landed, verified, failed, or unverified, with the ceiling line.
