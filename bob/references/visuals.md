# Visuals

Show it, then say only what the picture doesn't. The user reads the picture first, so the text around it stays short.

## When to draw

Draw by default. A reply gets a visual whenever it has any of these:

- a flow, a sequence, or a call path
- structure: modules, types, ownership, a file map
- a before and after
- options to weigh
- numbers worth comparing
- the state of several things at once: checks, features covered, findings by bucket

Skip it only for a one-line answer, a yes or no, or a single fact. A **Checkpoint** always gets one: the user decides from the picture.

## Shapes that work

| Content | Shape |
|---|---|
| A flow or call path | Boxes and arrows, left to right or top down, `file:line` on each box |
| Structure | A tree or a module map with ownership marked |
| A change | Before and after, side by side, with what moved highlighted |
| Options | A comparison table, your pick's column marked |
| Numbers | A bar or line chart with units, run count, and range |
| Status | A grid of chips: pass, fail, pending, needs you |
| Events over time | A timeline |

One idea per visual. Label things the way the code names them.

## In T3

1. Write one self-contained HTML page: inline `<style>` and `<script>`, local images by absolute path, and a CDN chart library only when a chart needs it.
2. Use T3's theme variables so it follows light and dark mode: `--foreground`, `--muted-foreground`, `--border`, `--primary`, `--muted`, `--card`, `--radius`. No page background, no outer card or banner title, fluid width, fixed pixel heights for charts, never viewport heights.
3. For charts, follow the `dataviz` skill when the session has it.
4. Check it with `html_preview` and fix what's off, then publish it with `html_render` before writing the reply text.
5. One page per reply as a rule. A checkpoint gets its own page.

## Outside T3

Use a Mermaid block or a small ASCII diagram in the reply, and a markdown table for comparisons.

## The text around it

- Open with the result in one line.
- Then only what the visual doesn't carry: the decision you need, a caveat, a link, the next step. A few short lines or bullets, never paragraphs that retell the picture.
- Don't announce or describe the visual.
- Keep clickable things in text: PR links, `file:line`, paths.
- Ask questions in plain text, each with the option you'd pick.
