# Visuals

The user is a visual learner. Show it first, every time there's something to show, then say only what the picture doesn't. Text around a picture is a few short lines, never paragraphs that retell it.

## When to draw

Draw by default. Text alone is the exception: a yes or no, one fact, or a one-line confirmation. When unsure, draw.

Draw at each of these moments, not just at the end:

- **The plan.** Right after sorting a task, show the playbook's steps as a pipeline, with the helpers each step will run and where the checkpoints are.
- **Every checkpoint.** Show the thing being decided: the draft design, the target shape, the variants, the lists to pick from.
- **Every question to the user.** Show the options as cards side by side, the one you'd pick marked, each with its cost.
- **Progress on long work.** When a step finishes something the user should see (a reproduction, a profile, a design comparison, a review), show it then, not only at the end. Mark where you are in the plan.
- **Explanations.** Any "how", "why", or "what is" answer: draw the mental model first, then zoom into the part that matters.
- **The final reply.** The result, with the evidence in the picture.

More than one page in a reply is fine when they show different things, such as the result and the evidence.

## What to draw

| Content | Shape |
|---|---|
| A flow or call path | Flowchart, `file:line` on each node |
| Calls between parts over time | Sequence diagram |
| States and what moves between them | State diagram |
| Data shapes and types | Boxes with fields, arrows for references |
| Structure, ownership, dependencies | Module map or dependency graph, owners marked |
| A change | Before and after side by side, what moved highlighted |
| A code change that matters | The snippet, annotated: changed lines marked, a note on each |
| Options | Comparison cards or table, your pick marked |
| Numbers | Bar or line chart with units, run count, and range |
| Where time or memory goes | Flame-style bars or a heat map |
| Status of many things | Grid of chips: pass, fail, pending, needs you |
| Events over time | Timeline |
| Evidence | The real screenshots, traces, or output, inline |

Big picture first, then detail. Label things the way the code names them. One idea per diagram; several diagrams on one page are fine.

## File maps: required for every change

Codebase architecture matters more than any single line. Any time Cooper plans, makes, or reports a change to code, draw a file map: where every file lives, which ones are new, changed, moved, or deleted, what each one owns, and how they connect. Start from `file-map.html` in this folder; it's tested in T3.

- **Left, the tree.** Files grouped by folder, down to every file the change touches, with the folders around them for context. Each file gets a badge (new, changed, moved from where, deleted) and one line on what it owns. Each folder gets one line on its job.
- **Right, the connections.** Modules as boxes (Mermaid subgraphs), files inside, arrows for imports or calls. Show the layer each module sits in (UI, API, domain, data) when the repo has layers. Mark an arrow that crosses a boundary it shouldn't.
- **Before and after** when files move or modules split: two trees side by side, or tabs.

Draw one at each of these points:

| When | Map |
|---|---|
| Learning an area (Feature step 1, Bug step 2, Refactor step 1) | The existing architecture, no badges |
| A design or plan checkpoint | Where every planned file goes, badged |
| Refactor's target shape | Before and after |
| `cooper-architect`'s pick | The chosen shape's files and modules |
| `cooper-blast-radius` | The change and every file it reaches, risks marked on the path |
| The final reply and the PR | What actually changed, badged |

The PR body gets the same map as a text tree, since GitHub can't run the page:

```
src/
├── billing/
│   ├── charge.ts      → moved from api/
│   ├── invoice.ts     ~ changed
│   └── money.ts       + new
└── api/
    ├── routes.ts      ~ changed
    └── price-utils.ts − deleted
```

## Proof gallery: the check, shown

Whenever a step checks behavior on the real app (Feature's check, Bug's rerun of the reproduction, Refactor's proof nothing changed), show the proof instead of describing it:

- **Before and after, side by side:** screenshots of each touched screen and state, captured through the repo's `cooper-verify-*` skill when it has one, or the harness's browser and preview tools. Reference them by absolute path; T3 inlines them.
- **Each step of the user's path** as a strip of screenshots, captioned with the action taken, when the change is a flow rather than one screen.
- **A recording** when motion matters (an animation, a transition): record it with the harness's recording tools and link the file under the strip.
- **For a CLI or API:** the command and its output, before and after, side by side.
- **A caption per image:** what it proves, and the entry point used.

Failures go in the gallery too, marked, so nothing passes by omission.

## Activity board: what's running

When the user asks what Cooper threads are doing ("what are my coopers doing", "status", "what's running"), draw an activity board from real state, never memory:

- each launched thread as a row: title, the playbook step it's on, its PR and checks, and when it last did something
- a timeline of the last few hours, each thread a lane, with launches, reports, PR events, and settlements marked
- what's waiting on the user on top, stalled threads flagged

Build it from `t3_thread_list` and `t3_thread_read` (status and recent activity), the coordinator's board or `units.tsv`, and `gh pr view` for each PR.

## Make it interactive when that helps

Pages can run script, so use it to keep a page small and explorable:

- tabs for before and after, or for each option
- a step-through for a flow ("next" highlights the next step and its `file:line`)
- details that expand on click: the code behind a node, a finding's evidence
- hover to show a node's file and line

Keep it working without interaction too: the first view should already answer the question.

## Building it in T3

1. Write one self-contained HTML page: inline `<style>` and `<script>`. Local images and screenshots load by absolute path and get inlined. CDN libraries load as-is.
2. For flowcharts, sequence, and state diagrams, use Mermaid. Load the classic build (the ES module build didn't render in T3's preview) and render explicitly, themed from T3's variables:

   ```html
   <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
   <div id="d1"></div>
   <script>
   (async () => {
     const css = getComputedStyle(document.documentElement), v = n => css.getPropertyValue(n).trim();
     mermaid.initialize({ startOnLoad: false, theme: "base", themeVariables: {
       primaryColor: v("--muted"), primaryTextColor: v("--foreground"),
       primaryBorderColor: v("--muted-foreground"), lineColor: v("--muted-foreground"),
       fontFamily: "ui-sans-serif, system-ui" } });
     const { svg } = await mermaid.render("g1", `flowchart LR
       A[request] --> B[auth.ts:42 verify] --> C{valid?}`);
     document.getElementById("d1").innerHTML = svg;
   })();
   </script>
   ```

   Hand-built HTML and CSS is better for cards, grids, and before-and-after. For charts, follow the `dataviz` skill when the session has it.
3. Use T3's theme variables so it follows light and dark mode: `--foreground`, `--muted-foreground`, `--border`, `--primary`, `--muted`, `--card`, `--radius`. No page background, no outer card or banner title, fluid width, fixed pixel heights for charts, never viewport heights.
4. Check it with `html_preview` and fix what's off, then publish it with `html_render` before writing the reply text.

## Outside T3

Use Mermaid blocks or small ASCII diagrams in the reply, and markdown tables for comparisons.

## The text around it

- Open with the result in one line.
- Then only what the picture doesn't carry: the decision you need, a caveat, the next step. Aim for five short lines or fewer.
- Don't announce or describe the picture.
- Keep clickable things in text: owning worker thread links, PR links, `file:line`, paths. Every review-ready PR or stack must have `[thread title](t3-thread://v1/<exact-threadId>)` beside its PR links, per **Review handoffs** in `../SKILL.md`; a label drawn inside a diagram is not a substitute for a clickable worker link.
- Ask with the question tool right after the picture, per **How to ask** in `../SKILL.md`: your pick first as "(Recommended)", and **Send it** for a go-ahead.
