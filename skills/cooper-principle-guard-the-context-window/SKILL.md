---
name: cooper-principle-guard-the-context-window
disable-model-invocation: true
description: "Apply when handling large outputs, long files, repeated reads, or planning a fan-out. Context is finite within a session. Spend it on what's worth it. Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Guard the context window

Context is finite within a session. Spend it on what's worth it.

An overfull context degrades reasoning, loses detail to compaction, and stalls work.

- **Send bulk to subagents.** Long outputs, screenshots, and big documents go to a subagent; the main thread gets the summary.
- **Inline what's used every time.** A template read on every run belongs in the skill, not a separate file that costs a read.
- **Size the phases.** Cap files per phase and budget turns.

`cooper-principle-minimize-reader-load` is the same idea for human readers.
