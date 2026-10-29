# The board page

Every Dispatch instance keeps one human-facing Page beside `board.tsv`: the thing Dan opens when he wants to know what this project is doing. `board.tsv` stays the source of truth for state; the page is a reading view of it, rewritten or edited whenever the answer changes.

The page answers one question first: **what are we working on right now.** Work in progress leads, never a summary line, and never below the fold.

## Shape

Tabs, not one long scroll. Dan asked for this on Oct 28, 2026: "we dont need recent activity, can we have different pages? to make this easier to digest", then "i dont like the whole 'waiting on you' section, just move it to backlog". Put one `Segmented` at the top of the `Page` whose options carry a count, and show only the selected tab's content.

1. **Now** — a table with one row per running worker: the work, its state as a `Status` (accent for running), a sentence on what it is actually doing at this moment, and what it is running on (model and effort). When nothing is running, one `Callout` says so in a plain sentence. This tab is selected by default so work in progress leads.
2. **Backlog** — every known piece of work with no worker, why it is waiting, and whether it is ready to start (ready, needs an approach picked, or blocked on access or a vendor). A blocked row carries a warning `Status`; a ready row does not need one. Anything that would otherwise be an ask or a decision for Dan belongs here too, phrased as the work rather than as a question.
3. **What landed** — merged or verified work, with a `Segmented` filter for `main` against `staging` when the difference matters, plus the one caveat worth knowing per row.
4. **Watch and links** — risks he should know about, one line each, then the worker threads, PRs, and source evidence behind the rows above.

There is no Recent activity tab and no Waiting on you tab. Do not re-add them.

Add a short paragraph or a `Quote` where a decision needs context. Keep every section's prose to a line or two: the tables carry the detail.

## Rules

- Name the moment the page was written (`Status as of <day, time>`), in the summary or a caption, so a stale page is obvious.
- Link every running worker by its thread, and every PR by its number, so the page is a way in rather than a status sheet.
- Move a row, do not duplicate it: when a worker finishes, it leaves Now and appears under What landed.
- Reflect the board, never memory. If `board.tsv` and the page disagree, the page is wrong.
- One page per instance, named "<Project> dispatch board", `width="wide"`. Edit it in place; do not create a new one each run. Tabs need source edits, so use `EditCanvas` for a change inside one tab and `WriteCanvas` only when the tab set itself changes.
- Update it when a worker launches, gates, finishes, or when Dan asks for status; do not leave it to the digest alone.
