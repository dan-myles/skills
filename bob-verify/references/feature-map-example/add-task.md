# Add a task

A user adds a task with a title and an optional due date from the browser or the CLI, can cancel a half-written one, and sees the saved task in the list.

## Sub-features

- `add-open`: opens the new-task form from each browser entry point.
- `add-save`: saves the title and due date.
- `add-cancel`: throws away an unsaved draft.
- `add-cli`: adds the same task from the terminal.

## How to get to it (user POV)

- The `Add task` button above the list.
- Pressing `a` when no text field has focus.
- `tasks add "<title>" --due <date>` in a terminal.

## Driving it with verify-tasks

Preconditions:

- `scripts/verify-tasks doctor` passes.
- No task is titled `Book dentist`.

- **Open the form.** Run `scripts/verify-tasks browser click --role button --name "Add task"`. A form named `New task` appears with focus in `Title`.
- **Fill it in.** Run `scripts/verify-tasks browser fill --role textbox --name "Title" --value "Book dentist"` and `scripts/verify-tasks browser fill --role textbox --name "Due" --value "2026-11-02"`. `Save` becomes enabled.
- **Save.** Run `scripts/verify-tasks browser click --role button --name "Save"`. The status `Task added` appears and the list has `Book dentist` due Nov 2.
- **Second view.** Run `scripts/verify-tasks cli -- tasks list --json`. Exit code `0`, and stdout has one task titled `Book dentist` with `"due": "2026-11-02"`.
- **Cancel.** Open the form, type `Throwaway` as the title, then run `scripts/verify-tasks browser click --role button --name "Cancel"`. The list has no `Throwaway`.
- **CLI entry.** Run `scripts/verify-tasks cli -- tasks add "Call bank" --json`. Exit code `0`, and stdout has the new task's ID and title.
- **Proof.** Run `scripts/verify-tasks browser snapshot --path artifacts/add-task/list.aria.txt` and `scripts/verify-tasks browser screenshot --path artifacts/add-task/list.png`. Both show `Book dentist` and `Call bank`.

## Gotchas

- Pressing `a` inside a text field types the letter instead of opening the form.
- `Task added` alone proves nothing. Check the list or the CLI.
- Due dates show in the browser's locale. Assert on the CLI's ISO date.
- Cleanup deletes `Book dentist` and `Call bank`, and keeps the artifacts.
