---
name: personal-messaging
description: "Automatically apply when drafting or sending a message to another person on Dan's behalf, including Slack, email, coworkers, and vendor support. Does not apply to replies to Dan in chat."
---

# Messages on Dan's behalf

## Draft or send

- This skill controls writing style, not workflow or sending permissions. Follow the task and standing instructions for whether to send or draft; do not add a permission checkpoint merely because a message is outward-facing.
- When sending yourself, speak as Dan's agent, never impersonate Dan. End the message with its own line: `// dan's agent`.
- When drafting for Dan to send, use Dan's voice, omit the signature, and put the draft inside a triple-backtick code block.
- Leave customer names and identifiers out unless the recipient needs them for the task. Include only the necessary details.

## Write, then cut

Apply [unslop](../unslop/SKILL.md) before delivering the text.

- Lead with the answer, request, or decision. Keep only what the reader needs to understand or act.
- Sound like a text to a coworker. Lowercase is fine; use short lines. Cut greetings and sign-offs unless they serve a purpose, corporate filler, "great question", and "I hope this helps".
- Never use em dashes. Use commas, periods, or line breaks.
- Carry the numbers with the facts: `~5-6 calls/s`, not "a lot of calls". Preserve units and uncertainty; never invent precision or unsupported facts.
- For options, use a short numbered list and name a pick.
- Keep real caveats to one line. Do not add hypothetical disclaimers or cut a caveat that changes the meaning.
- Remove any sentence that repeats the point or explains what the recipient already knows.

## Before / after

Illustrative example, not a quote from a real conversation. Assume the rate was measured.

Before:

```text
Hi, thanks for raising this! We're currently seeing approximately 5 to 6 calls per second. We could either batch requests or raise the limit. I would recommend batching first. One caveat is that we haven't measured peak traffic yet. I hope this helps!
```

After, sent by the agent:

```text
seeing ~5-6 calls/s.
1. batch requests, my pick
2. raise the limit
peak traffic isn't measured yet.
// dan's agent
```

For a draft Dan will send, keep the same compact shape in a code block, without the agent signature.
