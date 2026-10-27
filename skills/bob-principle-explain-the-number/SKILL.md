---
name: bob-principle-explain-the-number
disable-model-invocation: true
description: "Apply when you have a speedup, a regression, a throughput, a latency, or an eval result. Before you trust, report, or act on a measured number, find what limits it and rule out that it measured something else. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Explain the number

Before you trust, report, or act on a measured number, find what limits it and rule out that it measured something else.

A broken run still prints a plausible number. Failed requests, a cache that skipped the work, code that never ran, an untuned side, and noise all look fine.

- **Ask why it isn't twice as good.** Name what bounds it: a core, a lock, the disk, the network, the load generator. Get it from a profile or system counters during the run and map it to code. A guess from reading code isn't a limiter.
- **List what else it could be measuring** and rule each out with evidence: errors, skipped or cached work, an untuned side, noise, a piece too small to matter end to end.
- **Keep the evidence with the number:** run count, spread, and limiter.

For a performance number, run the full procedure in `../bob/references/benchmark-checklist.md`.

For an eval: did every run do the task, does the gap hold across trials and models, and does the scenario matter?

**You skipped it when** the number has no run count, no spread, or no named limiter, or the time saved is bigger than the time the changed piece took.
