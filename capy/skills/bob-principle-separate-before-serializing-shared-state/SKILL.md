---
name: bob-principle-separate-before-serializing-shared-state
disable-model-invocation: true
description: "Apply when parallel workers, processes, or agents might write the same file, branch, key, or state object. When several actors might write the same thing, first remove the sharing. Lock only when one shared writer is truly required. Use explicitly by name in Capy; helpers are also loaded by Bob."
---

# Separate before serializing shared state

When several actors might write the same thing, first remove the sharing. Lock only when one shared writer is truly required.

1. **Find the shared writes:** files two actors both write, branches both push to, APIs both define.
2. **Remove the sharing by default.** Do they need one object, or are they each publishing their own facts? Give each its own file, key, branch, or folder and merge only when reading. Two workers each writing their own field into one `state.json` still share it; `indexer-state.json` and `metrics-state.json` don't.
3. **When one shared target is a real requirement, serialize in structure:** a lockfile, sequential phases, a single writer, compare-and-swap. Instructions like "don't both write" aren't concurrency control.

Reaching for a lock is a smell to check, not the default.
