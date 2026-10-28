---
name: cooper-principle-migrate-callers-then-delete-legacy-apis
disable-model-invocation: true
description: "Apply when adding an internal API while callers of the old one still exist. When a new internal API replaces an old one, move every caller and delete the old one in the same change. No compatibility layer. Manual-only: `cooper` reads it when a step names it or its trigger fits."
---

# Migrate callers, then delete the old API

When a new internal API replaces an old one, move every caller and delete the old one in the same change. No compatibility layer.

- Internal callers aren't a reason to keep an old path.
- List the callers, move them, delete the old API.
- A temporary adapter is the exception, with an end date, never the default.
- Update tests to assert the new contract. Delete tests that only protected the old internals.
- Check renames by hand: strings, docs, and config hide usages a symbol search misses.

**Holds when** nobody outside depends on the old API and the project can take a coordinated break. Two live APIs mean two paths to maintain, and the codebase starts to feel append-only.
