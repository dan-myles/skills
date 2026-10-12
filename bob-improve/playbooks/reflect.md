# Reflect

Turn one session into approved edits.

1. Find the transcript. Use the current session unless the user names another (a path, a session ID, "my last /bob run in crabstock").
   - **Claude Code.** `~/.claude/projects/<slug>/<session-id>.jsonl`. The slug is the working directory's absolute path with every `/` and `.` turned into `-`. Subagent transcripts sit in `<session-id>/subagents/`.
   - **Codex.** `~/.codex/sessions/<yyyy>/<mm>/<dd>/rollout-*.jsonl`. The first line's `payload.cwd` names the working directory.
   - Confirm the match: the transcript's first user message is the session's opening request. Check the newest few files.
   - If the current session has no work in it yet, take the newest earlier transcript for this working directory and name it at the top of the reply.
   - If nothing matches, write a tight digest instead: the task, what was done, every correction from the user, and what went wrong.
2. Decide whether there's anything to learn. A trivial session, or one that followed the skills without friction, has no lessons. Say so and stop.
3. List the skills the session used: `Skill` tool calls, slash commands like `/bob`, reads of any `SKILL.md` or `playbooks/*.md`, and `$bob` mentions in Codex. Reviewers get this list.
4. Run three reviewers in parallel, each on its line under `bob-improve` in `../bob-models/models.yaml` (`reflect-judgment`, `reflect-tooling`, `reflect-divergent`). Pass each its prompt verbatim, with the transcript path (or the digest) and the skills list filled in.

   | Lens | Looks for | Prompt |
   |---|---|---|
   | Judgment | The rule behind a mistake, a correction, or a preference | `references/judgment-reviewer.md` |
   | Tooling | Commands, flags, and quirks, and context the user had to hand over | `references/tooling-reviewer.md` |
   | Divergent | The lesson under the obvious one, second-order misses, skipped checks | `references/divergent-reviewer.md` |

5. Synthesize. One subagent on `bob-improve.reflect-synthesizer` gets `references/synthesizer.md` with all three reviewers' output pasted in full.
6. Check the Accepted rows yourself. Read each target before keeping its row. Move a row to Backlog when a mechanism would enforce it better. Move a row to the repo's AGENTS.md when it's about one codebase.
7. **Checkpoint:** show the full Accepted, Rejected, and Backlog lists and wait. The user picks rows.
8. Apply the picked rows per **Editing a skill**. Commit and push each one in the skills repo. For AGENTS.md rows, make the edit in that repo's working tree and leave it for the user's next change, unless they ask for a PR. When a row changes behavior you can't judge by reading it, offer Eval before committing.
9. Check models per `playbooks/models.md`, on this session. It only recommends; nothing to approve.

**Reply:** no preamble. Show the Checkpoint's lists, and the final result, per `../bob/references/visuals.md`.

- **Applied.** Skill path, what changed, and the commit, one line each.
- **Repo notes.** AGENTS.md edits left in the working tree, one line each.
- **Backlog.** One line each. A mechanism in a repo is written as a ready-to-run `/bob-improve correct <class>`.
- **Dropped.** One line each, with the reason.
- **Models.** From step 9, one line each, or "no model changes".
