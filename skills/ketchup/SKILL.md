---
name: ketchup
description: "Catch the user up on this chat since their last message in three short parts: one sentence, what we did, what's still to be done. Manual-only: `/ketchup` in Claude Code, `$ketchup` in Codex."
disable-model-invocation: true
---

# Ketchup

Catch the user up on this chat since the last message they wrote before `/ketchup`. Notifications, report-backs, and subagent results aren't their messages. Assume they remember that message and nothing after.

Stay read-only: don't change code, start anything, or post anything. Check the live state of every PR, run, or thread this chat touched first, so nothing is stale.

Write exactly three parts, as short as they can be while still saying something:

1. **One sentence** recapping what happened.
2. **What we did:** a few bullets, one line each, only what changed something for the user, each marked done, running, failed, or unchecked.
3. **Still to be done:** what waits on the user first (each call only they can make, with the PR or thread and your pick), then what's left for you. "Nothing" if nothing.

Plain words, no jargon, no hashes, paths, or commands unless they need one to act. Every line earns its place; cut anything they wouldn't miss.
