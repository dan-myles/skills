---
name: bob-principle-type-system-discipline
disable-model-invocation: true
description: "Apply when designing types, reviewing a signature, or writing code in any typed language. Use the type checker to rule out impossible states, mixed-up values, and unhandled cases before the code runs. Manual-only: `bob` reads it when a step names it or its trigger fits."
---

# Type system discipline

Use the type checker to rule out impossible states, mixed-up values, and unhandled cases before the code runs.

- **Make bad states unrepresentable.** Model variants as a sum type (a tagged union, an enum with data, a sealed class), not a bag of optional fields. `{ done: boolean; doneAt?: Date }` allows `done: true` with no date. Use `{ kind: "open" } | { kind: "done"; at: Date }`, or derive `done` from `doneAt`.
- **Build the type from the values you want.** Don't carve them out of a looser type with checks. A non-empty list is a head plus a rest. A valid range is a start plus a length, not two timestamps you must keep ordered.
- **Brand meaningful primitives.** `UserId` and `OrderId` are both strings but must not be swappable. Check once at creation and trust the type after.
- **Outside data is untyped until parsed.** JSON, RPC, IPC, CLI args, config, env vars, DB rows: parse into the typed model at the boundary. See `bob-principle-boundary-discipline`.
- **Don't lie to the compiler.** A cast or assertion that skips the checker is a crash waiting. Prove the fact or treat the cast as a hazard.
- **Let the compiler enforce exhaustive matches,** so a new variant fails the build until every match handles it.
- **Derive from the source schema.** When protobuf, OpenAPI, GraphQL, a migration, or a token file defines a shape, generate or derive from it.
- **Strengthen a type only where partiality shows up.** A null check or "can't happen" throw marks a type that's too weak; move that check into the type, then stop. Precision for its own sake isn't the goal.

**Check:**

- Could you write a comment explaining when a combination of fields is valid? Split it into a sum type.
- Two arguments with the same primitive type but different meanings? Brand them.
- Where did this `any`, cast, or non-null assertion come from? Fix it at the boundary.
- If a variant is added next month, will the compiler point at every place to handle it?
- Is this type copying a shape another file owns? Derive it.
