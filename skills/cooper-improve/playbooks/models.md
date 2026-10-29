# Models

Find subagents that would do better on a different model. Recommendations only: do not edit skill source or user settings here. Each one becomes a `/cooper-models <change>` the user can run.

1. Pick the sessions: the one Reflect is reading, or the ones the user names. Find transcripts as in Reflect step 1.
2. List every subagent that ran: its job (designer, reviewer, judge, explorer, build worker), its actual model/options and the launching skill path, or Cooper's own T3 selection, and where its output is.
   - Claude Code native subagents: `<session-id>/subagents/`.
   - T3 delegated tasks: the child thread, read with `t3_thread_read`.
   - Headless runs: the output files the transcript names.
3. Look for signs a model was wrong for its job.
   - **Fell short.** Cooper or the user had to redo or correct its work, it missed something plain that another subagent or the user caught, or its output was shallow or off-brief.
   - **Added nothing.** One reviewer or designer raised nothing the others didn't, or a panel agreed on everything about a change the user then contested.
   - **Overkill.** A top model at max effort on a job that would have gone the same way for less, or a run so long it held up the step.
   - **Substituted.** A declared selection could not run, an explicit user override was needed, or provider access failed. Do not mistake a disabled provider instance for a bad model choice.
   - **Cooper itself.** The main thread struggled in a way a stronger model would fix.
4. Separate the model from the brief. A weak result from a vague brief, missing context, or a wrong skill step is a Reflect lesson, not a model change.
5. Write each recommendation: the subagent, the evidence (what happened, with transcript lines), the change as a ready-to-run `/cooper-models <change>`, and how strong the evidence is. One session is weak evidence; say so. For Cooper itself, recommend a model for the Cooper thread in T3's composer, since skill launch declarations do not change the current thread.

**Reply:** **Models.** One line per recommendation, strongest evidence first. When nothing points at a model, say "no model changes".
