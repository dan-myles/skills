# Source: chat

Slack, Discord, Teams, or whatever chat the session reaches.

## What's here

Discussions as they happened, incident channels, design threads, questions answered by people who know, and conversations after a merge. Smaller decisions are often made here and never written up anywhere else. It's also the source most likely to have been deleted or archived.

## How to search

Check the chat tool's schema first. If it needs authentication and that fails, stop and report the gap.

1. **The author around the merge date.** This narrows the search fast and often finds the decision.
2. **The feature name and symbols**, including casual spellings and nicknames.
3. **The PR link**, or just `/pull/<n>`. PRs get pasted when people discuss them.
4. **Error strings** the code handles. Incident threads tend to come up.
5. **Likely channels:** engineering, the project, incidents, the owning team, design review.
6. **Whole threads.** When a message looks relevant, read its full thread. The decision is usually in the replies.

## Strong evidence

- A thread weighing options ("I was going to do A, but B because…")
- An incident message describing the failure the code prevents
- A reviewer's question with an answer from the author or a lead
- A pointer to a meeting where the decision was made
- A product or customer-facing person explaining the request

## Traps

- **Retention limits.** Old messages may be gone. Record the date before which nothing turns up.
- **Private messages.** Usually not searchable, a known blind spot.
- **Jokes aren't decisions.** "lol just ship it" isn't the reason.
- **Missing context.** A single message can mislead. Read the thread.
- **Auth failures.** Report them. Never fill the gap with guesses.

## Return

Per thread: channel, link or thread ID, participants, date range, key quotes exactly with who said them, and what the conversation was part of.
