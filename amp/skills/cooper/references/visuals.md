# Visuals

The user is a visual learner. Show it first, including every end-of-work reply, then say only what the picture doesn't. Text around a picture is a few short lines, never paragraphs that retell it.

Amp renders Markdown well, so draw in the reply itself: ```` ```mermaid ```` blocks for flows, sequences, and states, Markdown tables for comparisons and status, and text trees for files. When a picture needs more room than a reply (a long investigation, a comparison with several views), write it as a thread artifact with the `artifact` tool and link it.

## When to draw

Draw by default. Text alone is the exception: a yes or no, one fact, or a one-line confirmation. When unsure, draw.

Draw at each of these moments, not just at the end:

- **The plan.** Right after sorting a task, show the playbook's steps as a pipeline, with the helpers each step will run and where the checkpoints are.
- **Every checkpoint.** Catch the user up and show the thing being decided, per **Checkpoint catch-up** below: the draft design, the target shape, the variants, the lists to pick from.
- **Every question to the user.** Show the options side by side in a table, the one you'd pick marked, each with its cost.
- **Progress on long work.** When a step finishes something the user should see (a reproduction, a profile, a design comparison, a review), show it then, not only at the end. Mark where you are in the plan.
- **Explanations.** Any "how", "why", or "what is" answer: draw the mental model first, then zoom into the part that matters.
- **The final reply.** Always show a diagram and a built-work recap under the required contract below. A completed job or handoff is never exempt because the change is small.

## Checkpoint catch-up

A checkpoint's visual is a catch-up for someone who just walked in, read top to bottom:

1. **Where we are.** The goal in one line and the plan as a pipeline, finished steps checked and this stop highlighted.
2. **The problem.** Draw the mechanism that forces the decision, not a summary of it: the code path or data flow where the options split, the failing case, the conflicting constraint, the review comment beside the code it's about. Use real names, files, and numbers, each with where it came from.
3. **The options.** A table, one row per option: what it does to the drawing above (what's added, removed, or rerouted), its cost, and whether it can be undone. Mark your pick.

Someone who reads only this should be able to answer the question that follows it. The same catch-up goes into `cooper_checkpoint`'s `catchUp`, so the dialog stands on its own.

## Required end-of-work recap

Every end-of-work reply includes a diagram and a recap of what was built. This covers feature, bug, performance and refactor completion, opening a PR, and babysit handoffs. One-line acknowledgments and confirmations remain text-only; a work-result handoff is not a confirmation.

Design the diagram around the mechanism of this particular job. Begin with the high-level overview: what the system does, where the change acts, and why that changes the outcome. Mark the changed parts with a Mermaid `classDef` and a legend line. Use the real configuration, symbol, and file names. Follow it with the recap: what was built and its scope, in a few bullets.

Pick the diagram that shows the mechanism, not a stock layout:

| Mechanism being explained | Diagram |
| --- | --- |
| Cadence, batching or contention | Sequence diagram of the events, or a timeline |
| Data flow or invalidation | Flowchart following a payload through the touched components |
| State or lifecycle bug | State diagram with the guard or recovery path that changed |
| Architecture or refactor | Module graph, before and after, moved responsibilities marked |
| User interaction | Screens as a flow, the decision and its resulting state |
| PR or babysit handoff | Table of checks, review findings, and remaining gates |

Keep evidence honest. Use measured numbers with units and sources when available. Label illustrative data as illustrative. Never manufacture statistics. Keep merged, deployed, verified and pending distinct. Include the file map and the verification evidence.

## What to draw

| Content | Shape |
|---|---|
| A flow or call path | Flowchart, `file:line` on each node |
| Calls between parts over time | Sequence diagram |
| States and what moves between them | State diagram |
| Data shapes and types | Class diagram or ER diagram |
| Structure, ownership, dependencies | Module graph with subgraphs, owners marked |
| A change | Before and after, what moved highlighted |
| A code change that matters | The snippet, with a note on each changed line |
| Options | Table, your pick marked |
| Numbers | Table with units, run count, and range, or a Mermaid `xychart-beta` |
| Status of many things | Table: pass, fail, pending, needs you |
| Events over time | Timeline or Gantt |
| Evidence | The real output, inline |

Big picture first, then detail. Label things the way the code names them. One idea per diagram; several diagrams in one reply are fine.

## File maps: required for every change

Any time Cooper plans, makes, or reports a change to code, draw a file map: where every file lives, which ones are new, changed, moved, or deleted, what each one owns, and how they connect.

- **The tree.** A text tree grouped by folder, down to every file the change touches, with the folders around them for context. Each file gets a mark and one line on what it owns:

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

- **The connections.** A Mermaid flowchart: modules as subgraphs, files inside, arrows for imports or calls, the layer each module sits in (UI, API, domain, data) when the repo has layers. Mark an arrow that crosses a boundary it shouldn't.
- **Before and after** when files move or modules split: two trees.

Draw one at each of these points:

| When | Map |
|---|---|
| Learning an area (Feature step 1, Bug step 2, Refactor step 1) | The existing architecture, no marks |
| A design or plan checkpoint | Where every planned file goes, marked |
| Refactor's target shape | Before and after |
| `cooper-architect`'s pick | The chosen shape's files and modules |
| `cooper-blast-radius` | The change and every file it reaches, risks marked on the path |
| The final reply and the PR | What actually changed, marked |

## Proof gallery: the check, shown

Whenever a step checks behavior on the real app (Feature's check, Bug's rerun of the reproduction, Refactor's proof nothing changed), show the proof instead of describing it:

- **Before and after:** screenshots of each touched screen and state, captured through the repo's `cooper-verify-*` skill when it has one, or the harness's browser tools.
- **Each step of the user's path** as a sequence of screenshots, captioned with the action taken, when the change is a flow rather than one screen.
- **For a CLI or API:** the command and its output, before and after.
- **A caption per image:** what it proves, and the entry point used.

Failures go in the gallery too, marked, so nothing passes by omission.

When the work ships a PR, the same gallery goes on the PR, per **Proof** in `../playbooks/open-pr.md`: screenshots and recordings for frontend changes, command output for everything else. `gh --attach` stores files with GitHub, where a private repo's attachments need repo access to view. Never upload them anywhere else, such as a gist or an image host, where a link alone opens them. Keep secrets, tokens, customer data, and another person's private details out of every screenshot and log; crop or redact before uploading.

## The text around it

- Open with the result in one line.
- Then only what the picture doesn't carry: the decision you need, a caveat, the next step. Aim for five short lines or fewer.
- Don't announce or describe the picture.
- Keep clickable things in text: PR links, `file:line`, paths, and this thread's URL beside every review-ready PR, per **Review handoffs** in `../SKILL.md`.
- Ask with `cooper_checkpoint` right after the picture, per **How to ask** in `../SKILL.md`.
