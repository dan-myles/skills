# Source: docs

Notion, Confluence, Google Docs, or design docs inside the repo (`docs/`, decision records, READMEs, `AGENTS.md`).

## What's here

Specs, RFCs, decision records, design-review notes, team pages, postmortems, runbooks, and strategy docs. Reasoning often gets written here before it becomes code.

## How to search

1. Search for the feature name, key symbols, the author's name, error strings, and user-facing terms. Narrow by date when you know roughly when the code shipped.
2. Open the full page, not the preview. The reasoning is often in the middle.
3. Follow sub-pages and backlinks. "Alternatives considered" often has its own page.
4. Check meeting-note collections for the design review.
5. Look in the author's own space when your tools allow it. Early thinking often sits there.

## Strong evidence

- A "Problem" or "Motivation" section that matches the code's purpose
- An "Alternatives considered" or "Rejected approaches" section
- A postmortem naming the target as the fix
- Meeting notes recording a decision, from the same period and authors as the PR
- A filled-in decision record: context, decision, consequences

## Traps

- **Out of date.** Specs are written before the code and rarely updated afterwards. Check them against the PR.
- **Plan vs reality.** The doc says X and the code does Y. Record the difference; it's a contradiction for the synthesizer.
- **Template filler.** Look for specifics.
- **Unlinked docs.** The best doc may not be linked from anywhere. Search broadly.
- **Several drafts.** Find the final or newest one.
- **No access.** Record it as a gap.

## Return

Per doc: title and link, authors, last-updated date, the reasoning quoted exactly with its section, linked pages, and whether it was a draft or final.
