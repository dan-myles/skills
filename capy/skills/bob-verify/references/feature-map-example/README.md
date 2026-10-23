# Tasks verification map

How to prove what a user sees in Tasks, a to-do app with a web UI and a `tasks` CLI. Read this file first, then the feature file that matches the change.

## Baseline

- Start Tasks with `scripts/bob-verify-tasks launch`. It serves `http://127.0.0.1:5310` with data in `/tmp/tasks-verify-$RUN_ID`, so parallel runs don't share state.
- The launch seeds two tasks: `Renew passport` (open) and `Water plants` (done).
- Run `scripts/bob-verify-tasks doctor`. It must report the URL, the data folder, and the current commit.
- Drive only an instance this run started.

## Driving

- Start each recipe from the baseline unless its preconditions say otherwise.
- Find elements by role and accessible name, never by CSS path or position.
- Copy commands exactly, quotes and flags included.
- Browser steps go through `scripts/bob-verify-tasks browser`, terminal steps through `scripts/bob-verify-tasks cli --`.
- Undo seeded-data changes after a recipe. Keep the evidence.

## Proof

- Capture the user's action and the state it left, not just the last screen.
- UI proof: an accessibility snapshot and a screenshot with the app visible.
- CLI proof: the command, stdout, stderr, and exit code.
- A change to stored data is proven from a second, read-only view.
- Label every artifact with the feature ID and the entry point used.
- An unreachable path is reported with the command tried and the missing precondition. Never count a skipped entry point as covered by another one.

## Feature files

Each starts with a title and one paragraph on what the user sees, then exactly these sections:

1. `Sub-features`: short IDs, one line each.
2. `How to get to it (user POV)`: every entry point a user has.
3. `Driving it with <harness>`: `Preconditions:`, then labeled steps that pair a user action with the exact command and the result to see.
4. `Gotchas`: what wastes or spoils a run.

Name user paths, stable handles, required state, commands, and visible proof. Leave implementation out.

## Features

- [Add a task](./add-task.md): browser and CLI, with cancel and a second view of the saved task.
