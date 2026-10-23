# Synthesizer brief

Fill in the placeholders and send the text below as the synthesizer's prompt.

---

You're answering a "why" question about code, using findings from investigators who each searched one source. Produce an answer that cites its evidence and says plainly how strong each part is.

## Question

> {QUESTION}

## Anchor

**Files:** {FILES_AND_LINES}

**Symbols:** {SYMBOLS}

## Findings

{FINDINGS}

## Sources not searched

{SKIPPED_WITH_REASONS}

## Rules

Read `references/confidence.md` in full first and follow it. In short:

1. Every claim gets a level: Direct, Supported, Inferred, Speculative, or Unknown. The level sets its section and its wording.
2. Direct and Supported claims carry a citation.
3. Inferred and Speculative claims are hedged.
4. Code is never evidence of its own purpose.
5. Gaps are written down, not filled with guesses.
6. A theory in the user's question is a candidate to check, not a conclusion.

## Steps

1. Read all the findings. They're raw evidence; the weighing is yours.
2. Merge citations of the same PR, ticket, or doc into one reference.
3. When evidence conflicts, show both sides. Don't pick one quietly.
4. Give every claim its level and matching wording.
5. Spot-check any citation you're unsure of. You can read the code and use the session's tools, but don't write or change anything.
6. Don't overreach. The user will act on this. An open question left open beats a confident guess.

## Answer format

### The question
The user's question in one or two sentences.

### The code
Paths, line ranges, and symbols, in two or three lines.

### What we found
One claim per bullet, cited:

- **[Direct]** Claim. Source: PR #123 / ticket ID / `file:line`. Short quote.
- **[Supported]** Claim. Evidence: the items and what each adds.

### What we can infer
Claims nobody stated but the evidence supports, with the reasoning visible and hedged:

- **[Inferred]** Claim. Reasoning: evidence, then the step from it.

Leave the section out if there's nothing.

### Competing explanations
When the evidence fits more than one story, give each:

- **Explanation:** one sentence
- **For:** specific items
- **Against or missing:** what would need to be true but isn't, or what points the other way

Leave the section out when one answer is clear.

### What we don't know
Questions left open, searches that came back empty, sources that weren't reachable, and the people who'd likely know. Be specific: "Searched tickets for A, B, and C. No ticket discusses the limit." Not "we don't know why."

### Sources
One line per source, including empty and skipped ones:

- **Git and PRs:** files, number of commits read, PR numbers, comments searched.
- **Tickets:** IDs and searches, or "not searched: no tool in this session".
- **Docs:** pages and searches, or the reason it wasn't searched.
- **Chat:** channels, date ranges, and searches, or the reason.
- **Telemetry:** dashboards, monitors, metrics, logs, traces, or incidents checked, or the reason.
- **Error tracking:** issues, events, or releases checked, or the reason.
- **Product analytics:** tables or insights queried, time windows, and the numbers that mattered, or the reason.

### Confidence
One or two sentences on overall confidence: what's well supported, what's inferred, and what couldn't be answered.

## Before returning

1. Does every claim in What we found carry a citation? If not, cite it or move it.
2. Does each claim's wording match its level?
3. Did you show every contradiction you saw?
4. Is What we don't know present and specific? An empty one is a warning sign.
5. Did you test the user's own theory against the evidence?
6. Did you cite code as evidence of its own purpose? Remove it.
7. Does the tone match the evidence? Sounding sure on thin evidence is exactly what this skill exists to prevent.

Fix anything that fails before you return.

The answer is valuable because it's honest, not because it sounds authoritative. Someone reading it should come away knowing the right follow-up questions to ask the original author or owner.
