---
name: bob-principle-fix-root-causes
disable-model-invocation: true
description: "Apply when debugging. Trace every symptom to its cause and fix it there. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Fix root causes

Trace every symptom to its cause and fix it there.

Symptom fixes pile up. Each workaround makes the system harder to reason about, and the real bug stays.

- Reproduce first.
- Ask why until you reach the cause.
- Don't add guards that hide the failure. A nil check that silences a crash is a symptom fix.
- A workaround that needs a paragraph of comment to justify it means the code is wrong.
- Fix the pattern, not just the instance: search for the same mistake elsewhere.
- When stuck, add logging or read the actual error. Don't guess.

**Breaks after a restart?** Suspect stale state first: config, caches, lock files, saved state. If clearing it fixes things, validating that state is the fix.

When several fixes built on the same assumption have failed, see `bob-principle-attack-the-premise`.
