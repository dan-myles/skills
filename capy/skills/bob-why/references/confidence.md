# Confidence

Code shows what it does, never why it exists. The why lives in commits, PRs, tickets, docs, and conversations, and every one of those is partial. An answer that hides that turns guesses into facts the user will act on.

## Levels

Every claim gets one level. The level decides which section the claim goes in and how it's worded.

### Direct
Someone wrote down the reason, and you can point to it. A PR body saying "fixes pagination for users with more than 1000 items", a ticket saying the customer asked for it in a security review, a comment saying "capped at 100 because the upstream API rejects more".

Wording: plain and present tense, citation right next to it. "This exists because X."

### Supported
No single source says it, but several independent pieces point the same way. A PR titled "improve performance", a `perf` label on the ticket, and neighboring commits all on the same hot path.

Wording: confident, with the pieces named. "The evidence points to X: A, B, and C."

### Inferred
A sensible reading of the context with nothing explicit behind it. The fix merged the same day errors appeared in production, so it was probably a hotfix.

Wording: hedged, with the reasoning shown. "Given A and B, C seems likely, because D."

### Speculative
Plausible, but other explanations fit as well. Worth raising, clearly marked.

Wording: "One possibility is X, but nothing in the record confirms it." These usually belong in Competing hypotheses.

### Unknown
You looked and found nothing. That's a real result. Say exactly what you searched: "Searched tickets for A and B, read the 6 PRs touching this file since 2023, and grepped for the threshold value. None gave a reason."

## Wording

**Words that claim certainty.** Use them only for Direct or Supported claims, with a citation beside them: "because", "the reason is", "was designed to", "fixes", "the team decided".

**Words that hedge.** Use them for inferences: "appears to", "seems to", "likely", "suggests", "is consistent with", "one reading is", "may have been", "points toward".

**Words to drop:** "obviously", "clearly", "of course", dismissive "just", and "I think". Say "the evidence suggests" instead.

## Don't tidy the history

Code that looks sensible today may have been written for reasons that no longer hold, or that were wrong at the time. Don't assume the author made the right call and reason backward. Don't assume a repeated pattern was deliberate; it may have been copied. Don't read silence as proof: nobody mentioning security doesn't mean security wasn't a concern.

## The user's guess

Users often bring a theory: "why do we do this, I assume for performance?" Treat it as one candidate and check it like any other. Confirm it only if the evidence does.

## Conflicting sources

If the ticket says "needed for customer X's compliance" and the PR says "cleaning up tech debt", show both with citations. Both may be true, or one may be wrong. Let the user decide.

## Missing evidence

"We don't know" is a useful answer. It tells the user the reason isn't in the obvious places and that they need to ask a person, or drop the question. Name the gap: the question, the sources you searched, what you searched for in each, and what came back.

## Check before sending

1. Does every claim in What we found have a citation? If not, add one or move it down a level.
2. Does each claim's wording match its level?
3. Is any code cited as evidence of its own purpose? Remove it.
4. Is there a What we don't know section with specific gaps? An empty one is suspicious.
