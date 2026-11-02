# Beads

Some repos track work in Beads (`bd`), a shared issue graph on a Dolt server. When `bd where` resolves a workspace for this checkout, Cooper records its job there so Dispatch, other workers and the next session can see it. When it exits nonzero with no workspace, skip this file. Workers launched by a coordinator other than Dispatch (Orchestrate units, Grok Bot support) and briefs with no ISSUE line skip it too; their coordinator keeps its own records.

Run `bd prime` once for command syntax, and `bd <command> --help` for flags. Where its workflow text disagrees with Cooper, Cooper wins: keep the playbook todo list, don't use `bd remember`, and follow the repo's and brief's git rules rather than its session-close protocol. Always pass explicit issue IDs and `--actor <actor>` on every write, since shell environment doesn't carry between tool calls. Use `--json` when parsing. Never use `bd edit`. Ignore bd's warning that `dolt_server_port` in `metadata.json` is deprecated, and never edit `.beads/`.

## Your issue

- **Under Dispatch**, the brief's ISSUE line names your issue and actor (`cooper:<issue>-a<n>`). Read it with `bd show <id> --json`; its description, design and acceptance are part of the brief. Claim it with `bd update <id> --claim --actor <actor>` before changing anything. A refused claim means someone else holds it: stop and report it as a gate.
- **Standalone** (the user started this thread, no coordinator brief), for Feature, Bug, Refactor, Perf and Open PR work: search first (`bd search`, `bd list --status in_progress`) and claim an existing issue that matches instead of filing a duplicate. Otherwise create one before writing code, with a specific title, the why in the description, and checkable acceptance, then claim it. Leave it unparented; never file under a Dispatch root. Your actor is `cooper:<exact thread ID>`. Investigation, Prototype, Cleanup and Orchestrate drain/resume don't file issues. Babysitting another session's PR notes progress on the issue that tracks it, if one does.

## While working

- **Notes** hold current state only. Overwrite them with `--notes` at each milestone: `COMPLETED:`, `IN PROGRESS:`, `NEXT:`, `KEY DECISION:`. Someone resuming should know where things stand from the notes alone.
- **Metadata**: set `branch` when you have one, then `pr.url` (comma-separated for a stack, bottom first) and `pr.head` whenever the head changes. Use `--set-metadata key=value` on `bd update`.
- **Comments** are the append-only log. Post your report as a comment at each point the brief asks for one: PR opened, merge-ready, gate, merged, or final. It must match your T3 reply, minus restricted evidence. The T3 reply and REPORT-BACK notification are still required; the comment doesn't replace them.
- **Follow-ups** you find but won't do get their own issue: `--deps discovered-from:<your issue>`, under your issue's parent with `--no-inherit-labels` (otherwise they copy labels such as `approved`), labelled `triage`. They wait for triage; never start them yourself.
- **Questions for the user** under Dispatch become a `decision` issue (parented like a follow-up, `--no-inherit-labels`) labelled `human`, with the options and your pick, which blocks your issue. Then stop and report the gate. Standalone, ask in the thread as usual.

Write only your own issue and the issues you create. Never add `approved`, edit another issue, reassign, `unclaim`, `reclaim`, use `--force`, or run `bd init`, `bd migrate`, `bd doctor --fix`, `bd dolt push` or schema-skew overrides. A schema refusal, unreachable server or wrong database is a gate to report, never something to work around, and never a reason to create a local graph. Keep secrets, customer data and absolute machine paths out of everything you write; the graph is shared.

You don't heartbeat. Your claim stands until you close it or the coordinator releases it.

## Merging

The brief's MERGE line decides whether you merge.

- **`auto`**: once GitHub reports your exact verified head mergeable with every required check and review satisfied, merge it with the repo's normal method. Never use admin bypass or override a required review. A stack merges lowest layer first; restack the layers above it per `playbooks/babysit.md` (only a stack you opened) and keep going until the top layer merges. Then set `merge.sha` (comma-separated for a stack), close your issue with a reason naming the PRs and merge SHAs, comment the final report, and notify the coordinator.
- **`human`**: stop at merge-ready. Label your issue `merge-ready`, open a `human` decision for the merge and link it to your issue as `related` (not `blocks`), add a `gh:pr` gate (`bd gate create --type gh:pr --await-id <number> --blocks <your issue>`), and report. Keep watching the PR. A Dispatch follow-up that names the closed merge decision and the exact head SHA authorizes you to merge that head as under `auto`. When the PR merges, by anyone, confirm it on GitHub, `bd gate resolve` your own gate (it blocks closing), and close your issue as above. Dispatch closes the merge decision.

Switch `auto` to `human` (relabel `merge:human` and say why in a comment) when your own Review finds the change touches auth, money, stored data or migrations, a public API or shared contract, or another team's services; when `cooper-blast-radius`'s safety fact stays unproven; when `cooper-adversarial-review` leaves an **Act on** finding unresolved; or when branch protection needs a person. Never switch `human` to `auto`. No MERGE line, or standalone work, means merge only when the user says to, per `playbooks/open-pr.md`, with no decision issue or gate; close your issue when the PR merges.

Work without a PR (investigations, validators, planning tickets) never closes its own issue; the coordinator closes it after accepting the report.
