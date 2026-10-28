# Source: tickets

Linear, Jira, GitHub Issues, or whatever tracker the session reaches.

## What's here

Issue descriptions and their comments, parent and child issues, projects with attached specs, labels, milestones, status changes, and linked PRs. This is where the product or business reason usually lives: a customer asked, a deadline, a compliance push.

## How to search

1. **Linked tickets first.** Open every ticket ID found in commits and PR bodies. Read the comments, not just the description.
2. **Keyword search.** Try the feature name, key symbols, and the business term, each phrased a few ways.
3. **Climb the tree.** Child issues are tactical. The parent often holds the reason.
4. **Read project docs.** Specs and rationale are often attached at the project level.
5. **Read labels and milestones.** They hint at the kind of motivation (customer request, incident follow-up, compliance) and the deadline behind it.

## Strong evidence

- A description stating the business problem
- A comment recording a decision and its reason
- A parent issue named like an initiative ("Reduce payment failures")
- An attached spec
- Labels such as `incident-followup`, `compliance`, `perf-regression`

## Traps

- **Changed scope.** Tickets get reopened with different goals. Read the whole history.
- **Boilerplate "Why" fields.** Generic text isn't an answer.
- **Stale plans.** Compare the ticket's dates with when the code shipped.
- **Duplicates.** Follow "duplicate of" links to the original ticket.
- **No access.** Record it as a gap. Don't guess.

## Return

Per ticket: ID and title, the motivation quoted exactly, labels, parent and project, author, created and closed dates, and a link.
