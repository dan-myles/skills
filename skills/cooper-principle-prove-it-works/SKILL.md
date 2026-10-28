---
name: cooper-principle-prove-it-works
disable-model-invocation: true
description: "Apply when finishing any task, before saying it's done. Check the real thing before calling work done. Not a proxy, not a self-report, not \"it compiles\". Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Prove it works

Check the real thing before calling work done. Not a proxy, not a self-report, not "it compiles".

Indirect checks (file timestamps, an agent's summary, a cached screenshot) feel cheaper than looking. Acting on a wrong guess costs far more.

- Check the process is alive, not something derived from it.
- Read the actual value, not a cached or derived copy.
- When a check fails, suspect how you looked before suspecting the system.
- Script the check when you can. A rerunnable script beats a one-time look; keep its output where a reviewer can see and rerun it.

On a repo with a `cooper-verify-<app>` skill, that's the check. Not `cooper-principle-explain-the-number`, which asks whether a measured number means what you think.
