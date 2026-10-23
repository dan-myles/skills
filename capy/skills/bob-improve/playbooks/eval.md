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
2. **Build sandboxes.** One temp folder per candidate, holding a small project the task makes sense in. Install the version under `.agents/skills/<name>/` on the candidate's own machine. Disable any overlapping installed plugin only with user approval, or use an isolated test project where it is absent. Half the sandboxes get the old version, half the new.
3. **Write one prompt**, the way the user would type it, for example `/bob <task>`.
4. **Run the candidates** as native Capy children, each on a fresh isolated machine with its sandbox staged there, with each entry of `bob-improve.eval-candidates` in `.bob/capy/models.yaml`, per `../bob-models/references/delegation.md`. Allow edits inside the sandbox. Run at least two per side.
5. **Judge.** One judge, on `bob-improve.eval-judge`, gets the rubric and the outputs under neutral labels.
6. **Check what each candidate actually read**, from the actual native child activity and file-read evidence. An installed plugin or another skill copy can shadow the intended version. A run that loaded the wrong version doesn't count; run it again.
7. **Read every output yourself.** Where you disagree with the judge, decide whether the rubric was unclear or the judge was biased, and say which.
8. **Cleanup.** Preserve outputs and transcripts. Remove only scratch files created by this experiment; ask before deleting machines or threads.

**Reply:** the change, the rubric, notes on each candidate, the judge's verdict, your own read, and whether to keep the change. **Show:** the candidates scored against the rubric, old and new side by side.
