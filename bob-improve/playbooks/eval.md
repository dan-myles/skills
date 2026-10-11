# Eval

Find out whether a skill change changes what an agent does, before keeping it. You design the experiment. The agents being tested never learn they're in one.

## Blinding

- Nothing a candidate sees says eval, test, judge, experiment, rubric, score, compare, benchmark, candidate, or variant: no folder, file, or prompt.
- The prompt reads like a real request. It states the goal, not the experiment.
- Never ask candidates which skills or rules they followed. Grade that from what they read and what they produced.
- Folder and project names look like something a user would pick.
- Candidates don't know other candidates exist.
- The judge knows it's judging, but sees outputs only under neutral labels (A, B, C…). It never learns model names or which side is old and which is new. One judge scores every output in one pass, on one scale.

## Steps

1. **Frame.** Name the change (old against new, as a diff), what success looks like, and a rubric of three to six concrete criteria. Only the judge sees the rubric. Say how many agent runs this will take before starting.
2. **Build sandboxes.** One temp folder per candidate, holding a small project the task makes sense in. Install the skill version where the harness loads project skills: `.claude/skills/<name>/` for Claude Code, `.agents/skills/<name>/` for Codex. Half the sandboxes get the old version, half the new.
3. **Write one prompt**, the way the user would type it, for example `/bob <task>`.
4. **Run the candidates** in parallel, headless, from inside each sandbox with each entry of `bob-improve.eval-candidates` in `../bob-models/models.yaml`, per the headless commands in `../bob-models/references/delegation.md`. Allow edits inside the sandbox. Run at least two per side.
5. **Judge.** One judge, on `bob-improve.eval-judge`, gets the rubric and the outputs under neutral labels.
6. **Check what each candidate actually read**, from its transcript (for Claude Code, `~/.claude/projects/<sandbox slug>/`). A user-level copy of the skill can shadow the sandbox's copy. A run that loaded the wrong version doesn't count; run it again.
7. **Read every output yourself.** Where you disagree with the judge, decide whether the rubric was unclear or the judge was biased, and say which.
8. **Delete the sandboxes.**

**Reply:** the change, the rubric, notes on each candidate, the judge's verdict, your own read, and whether to keep the change.
