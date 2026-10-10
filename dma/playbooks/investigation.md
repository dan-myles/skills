# Investigation

The answer is yours. Change nothing: no edits, commits, or PRs.

1. Run `how` on the area in question. It follows the code from where the behavior starts to where it lands, reading it rather than inferring it.
2. When the question is "why", run `why` on the target. It works through the history and every other evidence source the session can reach.
3. Lay out the answer in `how`'s sections: overview, the ideas you need, how it works step by step, where it lives (`file:line`), and the traps. Add `why`'s findings with their confidence levels. When the question is a choice, recommend one and back it with a table comparing the options.
4. Run the unslop skill on the reply.

If you conclude the code needs to change, stop there and say so. The user picks whether Bug or Feature comes next.

**Reply:** the answer, each claim tied to code, history, or a run, or flagged as a guess. On "are we sure?" questions, give your honest call and challenge the question if it rests on a wrong assumption. Draw flows when the harness can render them.
