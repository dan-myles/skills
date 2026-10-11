# Models

Find subagents that would do better on a different model. Recommendations only: never edit `../bob-models/models.yaml` here. Each one becomes a `/bob-models <change>` the user can run.

1. Pick the sessions: the one Reflect is reading, or the ones the user names. Find transcripts as in Reflect step 1.
2. List every subagent that ran: its job (designer, reviewer, judge, explorer, build worker), its model (a `models.yaml` line, or Bob's own), and where its output is.
   - Claude Code native subagents: `<session-id>/subagents/`.
   - T3 delegated tasks: the child thread, read with `t3_thread_read`.
   - Headless runs: the output files the transcript names.
3. Look for signs a model was wrong for its job.
   - **Fell short.** Bob or the user had to redo or correct its work, it missed something plain that another subagent or the user caught, or its output was shallow or off-brief.
   - **Added nothing.** One reviewer or designer raised nothing the others didn't, or a panel agreed on everything about a change the user then contested.
   - **Overkill.** A top model at max effort on a job that would have gone the same way for less, or a run so long it held up the step.
   - **Substituted.** A line failed against the catalog and Bob used a stand-in, or a provider wouldn't run.
   - **Bob itself.** The main thread struggled in a way a stronger model would fix.
4. Separate the model from the brief. A weak result from a vague brief, missing context, or a wrong skill step is a Reflect lesson, not a model change.
5. Write each recommendation: the subagent, the evidence (what happened, with transcript lines), the change as a ready-to-run `/bob-models <change>`, and how strong the evidence is. One session is weak evidence; say so. For Bob itself, recommend a model for the Bob thread in T3's composer, since `models.yaml` doesn't set it.

**Reply:** **Models.** One line per recommendation, strongest evidence first. When nothing points at a model, say "no model changes".
