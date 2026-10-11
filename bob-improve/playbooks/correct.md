# Correct

Agents in a repo keep making the same mistakes. Change the repo so the next agent can't.

Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. A change that looks right from one file should be right for the whole repo.

This playbook edits the target repo, not the bob- skills. Work on a branch and follow the repo's AGENTS.md.

1. **Collect mistakes.** Read:
   - recent commits and reverts, and PR review comments (`gh pr view <n> --comments`)
   - AGENTS.md, CLAUDE.md, and any rule table they hold
   - code comments that explain a workaround
   - this repo's own agent sessions, for the user's corrections: Claude Code's `~/.claude/projects/<slug>/`, and Codex sessions whose `cwd` is this repo
   - Reflect Backlog rows the user passes in
2. **Group them into classes.** A class counts once it has happened twice. Each class names what goes wrong and cites at least two instances.
3. **Pick a level for each class:** the highest that works, per `../bob-principle-encode-lessons-in-structure/SKILL.md`.
   1. **Architecture removes it.** One owner per piece of state and one supported way per task. Hide internals so the wrong import fails. Replace hand-synced lists with one source of truth. Delete old ways and dead code an agent would copy.
   2. **Types make the bad state unwritable**, per `../bob-principle-type-system-discipline/SKILL.md`.
   3. **A lint or CI check fails** when bad code still compiles. Its error names the file, type, or function to use instead. When the pattern is already common, fail only on new occurrences.
   4. **A test catches it**, per `../bob-principle-test-behavior-not-implementation/SKILL.md`. Fix or delete tests that would pass if every function they call returned nothing.
   5. **Docs or agent rules**, last and only for judgment calls. Nothing fails when an agent skips them.
4. **Checkpoint:** show every class, most frequent first, with its evidence, the level you picked, and why a higher level didn't work. Wait. The user picks which to fix.
5. **Fix** the picked classes, most frequent first, one commit each.
6. **Prove each check.** Reapply a real past mistake (from the commit or the transcript) on a scratch branch and show the new check failing with its message. Then show it passing on the fixed code. The check runs from the same command locally and in CI. An exception sits on the offending line with a reason, an expiry date, and who approved it.
7. **Update the rule table** in AGENTS.md: each rule next to what enforces it (the type, the lint rule, the test, or "judgment"). Drop a rule once its mistake can't happen anymore.
8. **Open the PR** per **Opening the PR** in `../bob/SKILL.md`. Correct ends at a merge-ready PR, unmerged.

After this, the table does the work. When the user corrects an agent in this repo, fix the mistake and add the rule. If the rule was already in the table with nothing enforcing it, that's a repeat: fix it at the highest level that works, in the same change.

**Reply:** each class with its evidence, the level picked and why a higher one didn't work, the proof each check fails on a past mistake, the rule table changes, the PR link, and the classes left for later. **Show:** the classes by frequency, each with its level and proof.
