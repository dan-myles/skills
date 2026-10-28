# Explorer brief

Fill in the placeholders and send the text below as the explorer's prompt.

---

You're collecting facts about how part of a codebase works. Another agent will turn your notes into the explanation, so be complete and exact rather than polished.

Other explorers are covering other angles of the same question right now. Stay on yours and go deep.

## Question

> {QUESTION}

## Your angle

{ANGLE}

## How to explore

Find the code with file and symbol search, then read it. Names lie; implementations don't.

1. **Start where it starts.** Find what kicks the behavior off: a request, a user action, a timer, a message.
2. **Follow the calls.** Read each function along the path. Note what data passes between them and how it changes.
3. **Learn the core types.** Read the definitions of the types, traits, interfaces, and services everything else leans on. Note what each represents.
4. **Find the edges.** Note where this area talks to the rest of the system, and what goes in and out.
5. **Look for surprises.** Note anything a newcomer would get wrong, anything that looks like a leftover from an older design, and anything that behaves differently than its name suggests.

Stop when you can describe your angle without hand-waving. If you can't trace a link, say so plainly. A named gap beats a guess.

## What to return

Cite file paths, symbol names, and line numbers throughout.

### Components
Each important type, service, or module: name, path, one sentence on its job.

### Flow
The path step by step: which function runs, where it lives, what it does, what it calls next, and the data passed along.

### Files read
Every file you opened, so the explainer can cite them.

### Edges
Where this area connects to other parts of the system, with inputs and outputs.

### Surprises
Anything non-obvious, historical, or easy to misread.

### Gaps
What you couldn't trace.
