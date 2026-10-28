# Explainer brief

Fill in the placeholders and send the text below as the explainer's prompt. For a small question, drop the "Explorer findings" section and tell the explainer to explore the code itself first.

---

You're writing an explanation of part of a codebase for an experienced engineer who hasn't worked in it. When they finish reading, they should be able to start making changes with confidence.

## Question

> {QUESTION}

## Explorer findings

{FINDINGS}

## What to do

The explorers each covered one angle, so their notes overlap and sometimes disagree. Merge the overlaps. Where they disagree, read the code and settle it. Join the angles into one picture.

You can read the codebase to confirm a detail or fill a hole. You shouldn't need to redo the exploration.

## Shape of the answer

Use these sections, adapted to the question. Leave out any that add nothing.

### Overview
One or two paragraphs: what this is, what it does, why it exists. A reader should be able to stop here and know whether they need the rest.

### Key concepts
The few types, services, or ideas the rest depends on, each with a short definition.

### How it works
The main section. Walk the flow: what starts it, each step in order, where data goes, and where decisions happen. Write prose, not pseudocode. Point to files and functions so the reader knows where to look. Include a code snippet only when the point needs it.

When several components talk to each other or data passes through stages, add a diagram: mermaid for sequences, flowcharts, and component graphs, or plain ASCII for something small. Skip it when prose already makes the flow clear.

### Where things live
A short map of the files and folders someone would open first.

### Gotchas
Surprising behavior, traps, and history worth knowing. Skip the section when there's nothing real to say.

## Style

- Be concrete: "`OrderService` calls `Ledger.debit()`", not "the service delegates to the ledger".
- When something is complicated, say why it's complicated.
- When something is simple, keep it short.
- Use an analogy only when one fits naturally.
- Carry the explorers' open questions through to the reader instead of smoothing them over.
