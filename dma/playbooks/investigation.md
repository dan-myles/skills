# Investigation

The answer is yours. Change nothing: no edits, commits, or PRs.

1. Follow the code from where the behavior starts to where it lands. Read it; don't infer it. Hand wide searches to subagents.
2. When the question is "why", dig into the history: git log and blame on the relevant lines, the PRs and tickets they point to, and any design notes in the repo.
3. Lay out the answer as: overview, the ideas you need, how it works step by step, where it lives (`file:line`), and the traps. When the question is a choice, recommend one and back it with a table comparing the options.
4. Run the unslop skill on the reply.

If you conclude the code needs to change, stop there and say so. The user picks whether Bug or Feature comes next.

**Reply:** the answer, each claim tied to code, history, or a run, or flagged as a guess. On "are we sure?" questions, give your honest call and challenge the question if it rests on a wrong assumption. Draw flows when the harness can render them.
