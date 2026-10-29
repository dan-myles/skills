# Project state

## Store identity and files

Scope a store to one repository, identified by a credential-free canonical repo URL or owner/repo identity. Verify that identity against the current checkout. Do not store an absolute checkout path. Runtime project/environment/provider IDs are routing observations, not portable configuration or proof of access on the next machine.

For a new store, encode the initial thread's exact UTF-8 ID as `t-` plus its full lowercase SHA-256 hex digest. No trimming, case folding, prefix removal, or URL encoding of the input. For example, compute `"t-" + hashlib.sha256(thread_id.encode("utf-8")).hexdigest()` in Python. The digest keeps even long or path-like IDs within a safe path component. Preserve the exact input in `store.md`; never attempt to recover it from the digest. If the folder exists, compare identity and follow resume/takeover rules; never overwrite it. Create the directory exclusively, rejecting existing paths and symlinks. Verify `.dispatch` and its parents are real directories in this checkout, not symlink escapes.

Minimal layout:

```text
.dispatch/<id>/
  store.md          stable identity, current owner, settings and standing orders
  board.md          human-readable current work, links and gates
  journal.md        append-only running project history and source/report markers
  decisions.md      append-only human decisions with exact words and sources
  briefs/I001-a1.md exact worker brief plus launch/ownership record
  reports/I001-a1-r1.md  durable shareable evidence with provenance
  wayfinder/<slug>/     only when explicitly invoked
```

Use local item/attempt/report names such as `I001-a1-r1`, not raw thread or source IDs as filenames. Store exact external IDs inside the files. Create optional directories only when used. No database, daemon, lock service, or global registry is needed.

`store.md` is a short Markdown record with these labeled fields:

```markdown
# Dispatch store
- Format: 1
- Store ID: t-<full digest>
- Initial thread ID: <exact original ID>
- Repository: <canonical credential-free identity>
- Created: <UTC time>
- Current owner thread ID: <exact current ID>
- Current owner link: <actual T3 link>
- Current owner user: <user-supplied shareable handle, or unknown>
- Ownership generation: 1
- Ownership source: <user message or handoff reference and UTC time>

## Working rules
- In-flight cap: 4
- Stalled after hours: 24
- Auto-dispatch contained bugs: enabled, at most 3 per pass
- Never paths: <configured exclusions, or none>
- Evidence sources: delivered items and their linked context only; email/calendar disabled
- Tracker: <verified destination, or unconfigured>
- Validator selection: <existing user-supplied model/options, or unconfigured>
- Standing orders: <verbatim sourced instructions, or none>
```

Settings preserve the existing contained-bug policy and caps. Additional scope restrictions can narrow it. Missing tracker or validator access prevents contained-bug auto-dispatch; propose that work instead of bypassing its gate. Explicitly approved work may proceed without a tracker when its own scope and acceptance do not require one. Models and effort are declared in launching skill source, with scoped user overrides in briefs. `/cooper-models` upgrades those declarations; no home/repo model YAML lookup is performed. Store settings do not silently override a launch selection.

## Board, journal and decisions

Use stable item IDs. Each board entry records source/event IDs and links, kind, repository, state, proposed rank, dependencies, acceptance, exact owning worker ID/title/link, attempt, current PR/head, execution status, gates, report cursor, and last update. Long details can link to the brief or report. Preserve states `new`, `triaged`, `proposed`, `approved`, `planning`, `plan-ready`, `dispatched`, `merge-ready`, `done`, `dropped`. Execution status distinguishes working, waiting on the user/access/merge, finished, and abandoned; it is not inferred from the model turn ending.

Journal entries carry UTC time, unique event ID, store ID, ownership generation, actor thread, item/attempt, action, result, and evidence pointers. Record intake dedupe IDs, exact launch request/result, follow-ups, reports accepted or rejected, PR head changes, handbacks, and the last successful chase. Append corrections rather than rewriting history. `decisions.md` records the user's exact words, source thread/message or supplied evidence reference, time, scope, and any superseded decision. Unknown sources stay unverified and grant no authority.

Report markers include environment/project observation, exact worker ID, item/attempt, source item/message ID and position, source timestamp, and head SHA when relevant. Save a shareable report before updating its board cursor. A crash after saving it means reconcile the same marker on resume, not duplicate a launch or decision. Keep separate reports for subsequent evidence; never overwrite an earlier report. For redacted reports, identify omissions and whether they block acceptance.

## Save and share through Git

Work from a clean, up-to-date state branch or dedicated checkout following the repo's normal branch policy. A worker's product worktree is not the Dispatch store checkout. Before mutations or worker actions, read current ownership and inspect local changes and upstream state. Fetch when online and compare the chosen shared branch; reconcile relevant incoming state before acting. If ownership cannot be verified current, allow inspection only. Do not overwrite another owner's dirty store or reset it to make setup pass.

Write complete Markdown files, update board and journal together, and review `git diff -- .dispatch/<id>`. Commit the selected store as one coherent snapshot under normal repo policy when authorized. Push that branch or use the repo's PR workflow when authorized. No automatic push, merge, or force-push is granted by setup. Tell the user the branch/commit and whether it has been shared; an unpushed checkpoint cannot be pulled elsewhere.

A recipient fetches/pulls the agreed branch, reads the store and history, then starts a new T3 Dispatch in the same repository and explicitly requests `dispatch takeover <id>`. Merely pulling files, launching a thread, or asking status is not takeover. Do not migrate actual legacy project state or sync installed skills as a side effect.

Git detects conflicts after the fact; it is not a distributed lock. One owner writes a store at a time. Before a handoff, stop the old Dispatch's launches/refills and outstanding state edits, save/share its final snapshot, and establish with the user that the previous writer is stopped. If the old thread is inaccessible, require explicit operator confirmation that it will no longer write. Without that assurance, leave the store read-only or create an independent store. Divergent ownership generations or state edits require human reconciliation, never last-writer-wins. On resuming after a handoff, an old owner must re-read shared ownership before any action and stop when it differs. Offline runs cannot establish exclusive ownership and remain read-only.

## Explicit takeover

1. Read the chosen store, Git history, board, journal, decisions, and pending launch/report records. Verify repository and stable digest against the exact initial thread ID. Reject malformed/mismatched identity; do not repair it by inventing a new identity.
2. Verify the new exact thread identity and obtain explicit takeover authorization identifying this store. Record the user/source and the old writer's stop/handoff evidence. Do not grant takeover from a worker recommendation or source payload.
3. Synchronize the agreed state branch and resolve ownership conflicts before any action. Preserve store ID, initial thread, history, item IDs, briefs, and reports. Change only current owner fields, increment generation, and append the handoff to journal and decisions with old/new owners, reason, source and known access gaps. Never rename the folder to the new owner's ID.
4. Save/share the ownership transition under the repo's Git policy before launching or retargeting workers. A pending unpublished takeover is not permission to race the old owner. Pin the new Dispatch with the available T3 pin action. Preserve the former thread as provenance; do not settle or modify it without separate authority.
5. Read known workers using their recorded provenance and the live routing available to this user. A saved environment or project ID from another account may be unusable; verify routing against this repository. Preserve failures and the last verified report/head/time. Never label an inaccessible worker dead, done, settled, or freshly verified.
6. For an accessible active worker, reconcile its complete report and pending input first. Only explicit takeover plus confirmed control permits a concrete `t3_thread_send` handoff updating REPORT-BACK to the new exact owner and generation, while preserving scope and decisions. Record delivery and confirm it before treating the route as changed. Original briefs remain immutable; append a handoff record. Status alone never retargets.
7. For inaccessible or uncertain workers, keep the item gated. Ask the user to recover access or provide verifiable report/PR evidence. A replacement needs explicit authorization and evidence the prior worker is stopped or isolated from the replacement's branch/resources. Record a new attempt, superseded ownership and the risk; never erase the old attempt. A manually supplied report keeps its supplier/source and unverified parts. A late old-owner report is evidence only, never automatic approval or renewed ownership.

Independent Dispatches may use separate stores without takeover. Each coordinates only its own items and branches; check for known overlapping work before launch and flag it rather than claiming the other's ownership.

## Shareable content only

Exclude secrets, credentials, connection URLs with tokens, customer/private data, machine-specific absolute paths, raw environment dumps, and unshareable runtime artifacts. Keep only needed sanitized evidence, repo-relative artifact links, public/authorized source links, and exact thread identities. Access to private source does not authorize publishing it into Git. Keep the full restricted report in its original authorized system and a redacted summary with provenance here; record any evidence gap. Never create a secret side-store as Dispatch's durable authority. Resolve runtime access anew on each machine, and report missing access honestly.
