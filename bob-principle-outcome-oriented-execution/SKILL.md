---
name: bob-principle-outcome-oriented-execution
disable-model-invocation: true
description: "Apply when running a planned rewrite or migration with clear phases. In a planned rewrite or migration, aim for the finished state. Don't build throwaway compatibility code to keep every halfway point smooth. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Outcome-oriented execution

In a planned rewrite or migration, aim for the finished state. Don't build throwaway compatibility code to keep every halfway point smooth.

Keeping every step fully stable tends to create temporary glue that outlives the migration.

- The end state's integrity beats smoothness along the way.
- Breakage in between is fine when it's planned, scoped, and reversible. Say up front where it's allowed.
- Keep strong checks on the areas you're actively changing.
- Run the full static and runtime checks when the plan finishes.
