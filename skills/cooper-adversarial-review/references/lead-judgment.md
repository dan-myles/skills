# Lead judgment

The reviewers are aggressive on purpose, and aggression without context makes noise. They saw a diff and one paragraph. They don't know what was tried and dropped, the constraints outside the code, which parts are scaffolding, or what the next PR covers. You have the whole session. Filter, put each finding in context, and decide. Don't just tally.

## Filters

- **Filler.** A reviewer with nothing critical to say pads with nits. If all of a reviewer's findings are nits, the code is probably fine. Say so.
- **Hypothetical or real.** "What if this is null?" counts only if a caller can actually pass null. Trace it. If upstream validation or the type system rules it out, dismiss it.
- **Premature abstraction.** Suggestions to extract, add an interface, or generalize only count if the code has to change a second way. Otherwise simple inline code wins.
- **"I'd do it differently."** The most common false positive. Without a concrete problem with the current approach, dismiss it and say why.
- **Missing context.** Findings about code the change didn't touch, patterns the repo uses everywhere, or fixes that break a constraint you know about. These are honest gaps. Dismiss them politely.

## When they're right

Don't dismiss a finding because it's uncomfortable. Catching what you'd miss is the point. Take it seriously when:

- both families raised it independently
- it traces a concrete path, not a hypothetical
- it shows a gap in your own picture of the code
- you read it and think "...yeah, actually"

Give security and correctness findings extra scrutiny before dismissing them, even from one reviewer.

## Calibration

The verdict should be useful, not complete. The user should be able to fix the **Act on** list and ship with confidence. More than five items there usually means you didn't filter hard enough.

**Dismissed** is not busywork. Showing what you rejected and why lets the user overrule you.
