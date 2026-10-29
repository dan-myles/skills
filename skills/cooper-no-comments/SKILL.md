---
name: cooper-no-comments
disable-model-invocation: true
description: "Strip comments from a diff before review. Starts Comment Sicko, a fresh reviewer that wants every comment dead, then deletes what it condemns, fixes the code its flags blame, and turns claimed constraints into types, tests, or lint. Manual-only: `/cooper-no-comments [diff, PR, or files]` in Claude Code, `$cooper-no-comments ...` in Codex. `cooper` runs it at Review."
---

# No comments

A comment explaining our own code is a sign the code should explain itself. This skill hands the comments to a reviewer who didn't write them, deletes what fails, and fixes the code that needed the comment.

Cooper's standing rule says comments say why. This is how that rule gets enforced.

## Scope

The files or diff the caller names. Otherwise the current branch's diff against its base (default `main`), including uncommitted changes. Never reach outside the scope.

## Steps

1. **Start the Sicko.** One read-only subagent using `claude-opus-5-5` with `{effort: medium}` on provider family `claudeAgent`, started per [launch mechanics](../cooper/references/delegation.md). Sicko uses the other family from the default GPT build subagents to get an independent read. If a user changes the build family, surface any diversity conflict before launch. Its task is `references/comment-sicko.md` in full, plus the repo's absolute path and the scope as a list of files or a diff command. Don't add rules of your own or soften its own.
2. **Check the report.** Its verdicts stand unless they break its own rules. Reject:
   - entries outside the scope, or `file:line`s that don't match the code
   - kills of comments that clearly fit the leash (a license header, a public API doc, a proven vendor quirk)
   - `MUST KILL` reasons that misstate what the code does
   - flags that blame code we chose on purpose and the user approved

   A `MUST KILL` on a surprise in our own code stays, and its comment stays dead. A keep stands only with proof that it's about something we can't change; otherwise the comment goes. Check for suppressions in scope it missed: a suppression that hides a correctness or safety rule becomes a `MUST KILL`. Before you accept a thin keep or kill on an `IMPORTANT` or `do not remove`, run `cooper-how` or `cooper-why` (`../cooper-how/SKILL.md`, `../cooper-why/SKILL.md`) on its symbol. If it's still unclear either way, the comment goes.

   If the report is wrong in a way that matters, rerun the Sicko once with the failure named. If the second report is wrong too, use what holds, and report the rest as open.
3. **Delete.** Remove every accepted kill. Leave the keeps.
4. **Fix what the flags blame.** Trivial fixes go straight in: delete a dead path, drop a parameter, call the real API. When a fix needs a new shape, run `cooper-architect` once for all the accepted flags together, then build its sketch. Fix the cause the comment was covering for and remove the workaround. Never add a guard that hides the symptom (`fix-root-causes`). If the real fix is outside the scope, land the smallest fix inside it and report the rest as open.
5. **Encode constraints.** For each claimed constraint, decide whether it's real. If it is, encode it the cheapest way inside the scope, then delete the comment: a type, a runtime check, a test, or a lint rule. Don't ask; that's Cooper's call. If encoding it needs work outside the scope, delete the comment anyway and report the constraint as open, with a sketch of the work. Keeps about things we can't change stay as comments.
6. **Check.** Run the repo's format, lint, type, and test commands. A deleted comment never breaks anything, but a fix from step 4 or an encoding from step 5 can.
7. **Report.** In one short block:
   - comments deleted
   - keeps, each with its reason
   - `MUST KILL` fixes made
   - constraints encoded, and how
   - reruns and rejected verdicts
   - anything left open

   In T3, show it per `../cooper/references/visuals.md`: a file map with each file's kill count, and a before/after of the biggest fix.

## Without subagents

Read `references/comment-sicko.md` and play the Sicko yourself before step 2, as harshly as it would. Read the diff cold, as if someone else wrote it.
