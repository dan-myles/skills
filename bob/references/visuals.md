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

Codebase architecture matters more than any single line. Any time Bob plans, makes, or reports a change to code, draw a file map: where every file lives, which ones are new, changed, moved, or deleted, what each one owns, and how they connect. Start from `file-map.html` in this folder; it runs in Synara's visual sandbox, which blocks CDN scripts.

- **Left, the tree.** Files grouped by folder, down to every file the change touches, with the folders around them for context. Each file gets a badge (new, changed, moved from where, deleted) and one line on what it owns. Each folder gets one line on its job.
- **Right, the connections.** Modules as boxes (the template's `GRAPH.groups`), files inside, arrows for imports or calls. Show the layer each module sits in (UI, API, domain, data) when the repo has layers. Mark an arrow that crosses a boundary it shouldn't (`GRAPH.bad`).
- **Before and after** when files move or modules split: two trees side by side, or tabs.

Draw one at each of these points:

| When | Map |
|---|---|
| Learning an area (Feature step 1, Bug step 2, Refactor step 1) | The existing architecture, no badges |
| A design or plan checkpoint | Where every planned file goes, badged |
| Refactor's target shape | Before and after |
| `bob-architect`'s pick | The chosen shape's files and modules |
| `bob-blast-radius` | The change and every file it reaches, risks marked on the path |
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

- **Before and after, side by side:** screenshots of each touched screen and state, captured through the repo's `bob-verify-*` skill when it has one, or Synara's `browser_*` tools (`browser_screenshot({kind: "proof"})`, then embed its `artifactPath`). Put each in the reply as a markdown image with its absolute path, `![what it proves](/abs/path.png)`, and look at it before you claim what it shows. A visual page can't load files, so screenshots never go inside one.
- **Each step of the user's path** as a strip of screenshots, captioned with the action taken, when the change is a flow rather than one screen.
- **A recording** when motion matters (an animation, a transition): record it with the harness's recording tools and link the file under the strip.
- **For a CLI or API:** the command and its output, before and after, side by side.
- **A caption per image:** what it proves, and the entry point used.

Failures go in the gallery too, marked, so nothing passes by omission.

## Activity board: what's running

When the user asks what Bob threads are doing ("what are my bobs doing", "status", "what's running"), draw an activity board from real state, never memory:

- each launched thread as a row: title, the playbook step it's on, its PR and checks, and when it last did something
- a timeline of the last few hours, each thread a lane, with launches, reports, PR events, and settlements marked
- what's waiting on the user on top, stalled threads flagged

Build it from real state per this thread's role (`synara.md`): a Hub coordinator reads `synara_hub_list_work` (queued, working, result) and `synara_project_list_threads`; a standalone thread reads `synara_list_threads` and `synara_read_kanban_board` (columns and attention flags); both read the board or `units.tsv` and `gh pr view` for each PR. Show queued work as queued, never as running. A `table` block per group usually carries it; add a timeline page only when the order of events matters.

## Make it interactive when that helps

Pages can run script, so use it to keep a page small and explorable:

- tabs for before and after, or for each option
- a step-through for a flow ("next" highlights the next step and its `file:line`)
- details that expand on click: the code behind a node, a finding's evidence
- hover to show a node's file and line

Keep it working without interaction too: the first view should already answer the question.

## Building it in Synara

Call `synara_show_visual` before writing the reply text, then put the ```` ```synara-visual ```` block it returns where the visual belongs in the reply. There is no preview step: get it right, or call it again and use the newer block.

1. **Blocks first.** They draw in Synara's own design system and follow light and dark mode. Use `list` with `style: "steps"` for the plan and progress (each step `done`, `current`, `pending`, or `failed`), `compare` for options with your pick `highlight`ed, `table` for status grids and audits, `stats` for headline numbers, `bar-chart` for before and after (old value as `baseline`, `better` set), `line-chart` for a metric across tries, `callout` for the one thing that needs the user, and `tabs` to keep several views small. Code goes in a `markdown` block's fence.
2. **HTML only when blocks can't draw it:** a file map, a flow or call graph, a sequence across parts, a step-through. Send one self-contained document (`html`, at most 256 KiB, with `height` set near its real height). The sandbox allows only inline script and style, with no network and no file or remote images (`data:` URIs only). Mermaid and every other CDN library won't load.
   - File maps and flows: copy `file-map.html` and replace its tree and `GRAPH`. For a flow, make each stage a group and each step a node labeled with its `file:line`.
   - Sequences: a grid with one column per part and one row per call, arrows drawn as inline SVG.
   - Step-throughs: a "next" button that highlights the next node and shows its `file:line`.
3. **Theme.** Synara injects its theme into every page: `--foreground`, `--background`, `--muted`, `--muted-foreground`, `--border`, `--card`, `--primary`, `--secondary`, `--accent`, `--destructive`, `--success`, `--warning`, `--info`, `--ring`, `--radius`, `--font-sans`, `--font-mono`, and `--series-1` to `--series-6` for chart colors. It also styles plain `table`, `button`, `.tag[data-tone]`, and `.segmented` for you. Use those, with no page background, no outer card or banner title, fluid width, and fixed pixel heights for charts, never viewport heights. For charts, follow the `dataviz` skill when the session has it.

## Outside Synara

Use small ASCII diagrams or Mermaid blocks in the reply, markdown tables for comparisons, and image paths as plain text.

## The text around it

- Open with the result in one line.
- Then only what the picture doesn't carry: the decision you need, a caveat, the next step. Aim for five short lines or fewer.
- Don't announce or describe the picture.
- Keep clickable things in text: PR links in full, `file:line`, files as `[name](file:///absolute/path)`, threads as `[title](thread://<id>)`.
- Ask with the question tool right after the picture, per **How to ask** in `../SKILL.md`: your pick first as "(Recommended)", and **Send it** for a go-ahead. Synara may fold the picture away, so the question restates what it decides.
