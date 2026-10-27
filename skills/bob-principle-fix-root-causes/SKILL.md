---
name: bob-principle-fix-root-causes
disable-model-invocation: true
description: "Apply when debugging. Trace every symptom back to the first place the system went wrong and fix it there. A guard is a fix only when the state it handles is legitimate. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Fix root causes

Fix the fault, not the place it showed up. The symptom is where a wrong state became visible. The root cause is the first place the system did something it shouldn't, or failed to handle a state it should.

Symptom fixes pile up. Each one hides the evidence, leaves the fault free to surface somewhere else, and adds a workaround for a bug nobody named.

- Reproduce first.
- Ask why until the answer is a wrong decision in the code, not a consequence of an earlier one.
- **Is the state legitimate?** If the system is allowed to be in the state that broke the code, the code that broke is the cause, and handling the state there is the fix. If the state should never exist, a check where it broke hides the bug; find what produced the state. Guards, retries, swallowed errors, clamped values, and dropped state are the usual hiding places.
- A workaround that needs a paragraph of comment to justify it means the code is wrong.
- Fix the pattern, not just the instance: search for the same mistake elsewhere.
- When stuck, add logging or read the actual error and state. Don't guess.
- **After a deep dig,** propose the cheap, always-on signal (a log line, a metric, an assertion, a clearer error) that would have shown the deciding fact at first look.

**Breaks after a restart?** Suspect stale state first: config, caches, lock files, saved state. If clearing it fixes things, validating that state is the fix.

When several fixes built on the same assumption have failed, see `bob-principle-attack-the-premise`.
