# Migrating from the T3 edition's board

`/frank migrate` brings the T3 edition's Frank state into this edition's store. Run it only when the user asks, or says yes when setup offers it. It reads `~/.bob-n-frank/frank/` and `~/.bob-n-frank/config.yaml` and never writes, moves, locks, or deletes anything there: the T3 edition may still be using them.

## Before anything moves

1. **One Frank per source.** Two Franks reading the same repos and channels triage the same items twice and can dispatch the same bug twice. Check whether the T3 Frank is still live: a `.sweep.lock` in `~/.bob-n-frank/frank/`, `updated` times from the last day on the board, schedules in its `config.yaml`. If it might be, ask the user to stop its schedules in T3 first, or keep the two Franks' repos apart. Don't go on until they answer.
2. **Dry run.** `python3 ../scripts/legacy_board.py --out /tmp/frank-migrate` converts the board and the seen list into `/tmp/frank-migrate/` and prints a summary: rows by state before and after, the PRs tied to T3 threads, and the input checksums. It refuses to run if the legacy files change while it reads them.
3. **Checkpoint.** Show the summary as a table and ask per **How to ask** in `../../bob/SKILL.md`: "Send it" to import as shown.

## How rows map

| T3 state | Here | Why |
|---|---|---|
| `new`, `triaged`, `proposed`, `done`, `dropped` | same | Nothing in flight. |
| `approved` | `proposed`, noted "approved in T3; reconfirm" | Approval was for the T3 dispatch; a migration never dispatches. |
| `dispatched`, `merge-ready` | `legacy-t3` | Its thread lives in T3. Frank tracks its PR with `gh` and never starts a replacement unless the user asks for one. |

T3 thread ids move into the note (`t3 thread mcp:…`), not the thread column, since they aren't Synara threads.

## Import

On the user's yes, write the converted files to this role's store (see **Store** in `../SKILL.md`): Hub documents `frank/board.tsv` and `frank/seen.tsv`, or `~/.bob-n-frank/synara/frank/`. When the store already has rows, merge by id and keep the newer row. Then:

- **Settings:** copy `repos`, `sources` (`t3_threads` becomes `synara_threads`), `tracker`, `slack`, `auto_dispatch`, `in_flight_cap`, `stalled_after_hours`, `briefs`, `sweep`, and `timezone` from `~/.bob-n-frank/config.yaml`. Drop `thread_id` and `schedules`: they're T3 ids. Setup's automations replace the schedules.
- **Decisions, briefs, reports:** leave them where they are as the archive. Append one decision: `migrated <rows> rows and <seen> seen items from ~/.bob-n-frank/frank/ (sha256 <board checksum>)`.
- **Grills:** stay in `~/.bob-n-frank/grills/`; `bob-grill` reads them from there.
- **Models:** never copied. The T3 file's Claude ids aren't Synara slugs; run `/bob-models` to set up `~/.bob-n-frank/synara/models.yaml`.

Run the checksums again and confirm the legacy files are unchanged, then delete `/tmp/frank-migrate/`.

**Reply:** rows imported by state, `legacy-t3` PRs now tracked, what was left in the archive, and whether the T3 Frank is stopped.
