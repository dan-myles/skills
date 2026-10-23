# Capy runtime

Read this before starting subagents, waiting on PRs, or reporting to a Captain.

## Delegation

Use Capy's native subagent lifecycle. Draft the title and complete prompt, then explicitly start it. Choose shared or fresh placement every time and check the returned placement and machine ID.

- Shared machine for read-only explorers, designers, reviewers, judges, and verifiers. They see the parent's uncommitted work. Do not let these children edit or drive the app.
- Fresh machine for writers. It checks out the upstream branch; it does not copy uncommitted parent edits or local-only commits. Before starting, verify the exact base is available upstream. If publishing it is not authorized, do the work in the parent rather than quietly pushing it. A child writing code does not imply permission to publish a PR.
- Parallel writers need disjoint files and separate branches and PRs. Stack overlapping work from the preceding PR branch. Never have two writers on the same checkout.
- The prompt alone is the child's context. Include the goal, scope, base branch, decisions, acceptance checks, repository instructions, required plugin reference contents, and expected report. Do not assume parent-local paths exist on a fresh machine.
- Parent checks the diff on the child's machine. Completion does not apply that diff to the parent's checkout. Report where the work lives and how it will reach the target branch.
- Final reports and blocked questions notify the parent. Interim messages do not wake it. Use native final/blocked reporting rather than timers or cross-thread polling. Stay within Capy's three-level subagent depth.
- Use sibling threads only when the user deliberately requests independent long-lived streams. Captains own program coordination.

Resolve models per `../bob-models/references/delegation.md`. If native delegation is unavailable, work directly and disclose which independent checks were not run.

## PR events and waits

Use Capy's GitHub integration and native PR association/watch capability when available. A PR opened elsewhere receives no events until the agent pushes to it or is asked to watch it. Do not manufacture a commit to establish ownership.

CI, human reviews, and merge/conflict events can wake the owning thread. Bot feedback is ignored by default. Inspect the effective event policy when available; do not change account or thread settings silently. Explicitly request a native watch for the needed events if supported. Otherwise use a bounded native background check with an explicit timeout, report missing bot feedback after ten minutes, and never claim an event wake is armed without evidence. If neither watch nor background checks are available, report the current status and the monitoring gap.

End the turn when a confirmed event subscription owns the wait. On wake re-read GitHub state. Stop requesting further work when merge-ready; cancel any temporary wait owned by this run. Never merge unless the user explicitly requests it in this thread.

## Captain and parent reports

For a native subagent, send the final summary or actual blocking question through the native parent-report capability. For Captain crew, use Capy's crew report flow; crew reports reach the Captain after each turn or question. Do not invent thread IDs or messaging APIs. Include status, branch, head SHA, PR, checks and evidence, decisions, gates, follow-ups, and remaining ownership. Ask the user when a decision is reserved for them; do not let another agent's guess replace approval.

Completion is a report, not permission to archive a thread, delete a machine, remove a worktree, or change a Captain. Preserve work and report outstanding PRs and questions. See `settling.md`.

## State and output

Optional project model overrides live at `.bob/capy/models.yaml`; agreed decisions can be saved under `.bob/capy/grills/`. These are project files, not a machine-wide home configuration. Do not commit them unless requested. For state that must survive machine changes, use the project's supplied Drive location and pass the location and contents to downstream workers. Never assume two machines share a home directory or a Drive mount path.

Use `visuals.md` for pages and evidence. Use the tools actually exposed in the Capy session; tool names and signatures come from that runtime, not this document.
