# Investigation

The answer is yours. Change nothing: no edits, commits, or PRs.

**The answer is a picture, not prose.** Every investigation answers with diagrams per `../references/visuals.md` before any text, in the reply or, when it's long, as a thread artifact. The text after it is a few lines at most. A text-only answer to an investigation is a failed answer. Make the diagrams do the explaining:

- the flow as a diagram (Mermaid), `file:line` on every node, numbered in the order things happen
- a file map of the area: where each piece lives and how the pieces connect
- the key ideas, each with the code that shows it
- for "why", a timeline of the decisions and their evidence, confidence marked
- for a choice, a comparison table with your pick marked
- the real evidence inline: code excerpts, command output, screenshots

Two modes. Pick one, say which, and put only its steps on the todo list.

- **Explain.** The default: how something works, why it's built that way, which option is better.
- **Diagnose.** A running app misbehaves (a leak, a CPU spin, a hang, a glitch, a slow path) and the user wants the cause, or hands you a capture: a CPU profile, a trace, a heap snapshot, a spindump.

If you conclude the code needs to change, stop there and say so. The user picks whether Bug, Perf, or Feature comes next.

## Explain

1. Run `cooper-how` on the area in question. It follows the code from where the behavior starts to where it lands, reading it rather than inferring it.
2. When the question is "why", run `cooper-why` on the target. It works through the history and every other evidence source the session can reach.
3. Lay out the answer in `cooper-how`'s sections: overview, the ideas you need, how it works step by step, where it lives (`file:line`), and the traps. Add `cooper-why`'s findings with their confidence levels. When the question is a choice, recommend one and back it with a table comparing the options. When the answer rests on a measured number, apply `explain-the-number` first.
4. Verify what the answer rests on. For each claim the conclusion depends on, run something that shows it: a request, a test, a script, a log line, the app through the repo's verify skill. Put the output next to the claim. A claim you couldn't run stays marked as read from code.
5. Draw the answer, check that each Mermaid block parses, then write the few lines it doesn't say. Run `unslop` on those.

**Reply:** the answer, each claim tied to code, history, or a run, or flagged as a guess. On "are we sure?" questions, give your honest call and challenge the question if it rests on a wrong assumption. **Show:** the diagrams above: the numbered flow, file map, key ideas, plus the timeline for "why" or the comparison for a choice.

## Diagnose

Work from a real capture, never a theory from reading source.

1. **Get the capture.** Live: record the signal on the surface where it happens, through the repo's verify skill when it has one: a CPU profile for a spin, a heap snapshot for a leak, a trace for a glitch or a slow path. Handed to you: identify the format and treat it as fixed data; don't rerun it.
2. **Make it queryable.** Load it with the right tool (a DevTools or trace parser, heap tooling, a text editor for a spindump) and dump it into something you can query, like sqlite with one row per sample, frame, or node. Do this in a subagent, per `guard-the-context-window`; the main thread keeps the reduced finding.
3. **Narrow to the cause.**
   - Slow or spinning: the frames holding the most time, then the call tree down to the hot path.
   - Leak: the retainer chain from the leaked object to a GC root.
   - Hang: the stuck or blocked thread and what it waits on.
   - Glitch: the work that fires without input, and what schedules it.
4. **Prove the mechanism.** Live: inject logging or instrumentation into the running process (a debugger, CDP eval) to confirm it cheaply. From a capture: diff it against a paired before-and-after capture. Without either, call it the strongest hypothesis the capture supports, not a confirmed cause.
5. **Map it to source:** file, symbol, and the line that allocates, schedules, or blocks. A frame with no source mapping isn't a diagnosis yet; resolve the symbols or say the capture doesn't carry them.
6. **Draw it:** the finding, the source lines it lands on, and the proof, then a few lines of text.

**Reply:** the capture and its format, the reduced finding, how you proved the mechanism (or "hypothesis"), the source location, the artifact paths, and which playbook should fix it. **Show:** the page: flame-style bars of where the time or memory goes, the hot path, retainer chain, or blocked thread as a graph down to the source line, and the before-and-after capture or the instrumentation output that proves it.
