# T3 Dispatch port checks

This records commit `4eee036`, before the separate [hardcoded model migration](hardcoded-models-validation.md). Model-file statements below describe that snapshot.

This is the 2026-10-29 port of Dispatch from Grok Bot coordination to a long-running pinned T3 thread for one repository. No actual project state, live bots, installed skills, model settings, schedules or deployments were changed.

## Design and decisions made here

The store is `.dispatch/t-<full lowercase SHA-256 of exact initial thread ID>/`. The digest uses the exact UTF-8 bytes, including prefixes. `store.md` retains the exact original ID separately from the current owner thread/user and ownership generation. A bounded digest component handles long, Unicode and path-like IDs without truncation or unsafe path characters.

`board.md` is authoritative. `journal.md` preserves running history, dedupe/report source markers, and ownership events. `decisions.md` preserves sourced human decisions. Optional briefs, reports and Wayfinder Markdown records keep the rest of the history in Git. The inline tabbed view derives from those files. New Wayfinder maps use local Markdown tickets with optional tracker mirrors so a pull includes their decisions.

Explicit takeover preserves the store ID and all prior attempts, requires the former writer to stop, synchronizes/publishes the ownership transition under the repo's Git policy, and increments the generation. Git is not a distributed lock. Non-owner status does not write files or control workers. Inaccessible prior-user workers remain gated with last verified provenance; replacement needs explicit approval and proof of stop or isolation.

Dispatch uses actual `t3_thread_launch`, `t3_thread_read`, `t3_thread_send` and `t3_thread_organize` tools. Live schema inspection confirmed `action: "pin"` exists and launch accepts `clientRequestId`. The documented launch shape binds its worktree in T3; uncertain launches reserve capacity and reuse their request ID. Cross-machine report-back requires a verified return environment, because environment links are one-way. The complete worker reply remains available for reconciliation when notification fails.

The five Dispatch skills move from the global manifest to `tags/coding.toml`. Coding machines keep all 54 skills; Grok Bot gets 13 and no longer imports Dispatch. Its support/Fleet workers retain the previous Executor contract under `grokbot-gs-crisp-support/references/cooper-workers.md`, with affected links updated. Fleet's existing bot procedure remains explicitly limited to legacy registered scopes. New T3 Dispatch does not participate in cross-project routing.

The model-policy migration discussed earlier is excluded. `cooper-models/models.example.yaml` is byte-for-byte unchanged. Dispatch's existing Claude Opus 5.5 medium worker selection is preserved, with live provider-instance verification. Cooper's legacy keys, home/repo model files and precedence remain. Only descriptions and affected transport references change.

## Structural checks run

```text
loadout validate .
valid: . (3 layers, 54 items, 0 warnings)

loadout plan --loadout .
36 of 216 actions would change this machine

python docs/check-dispatch.py
coding skills: 54; shared bot skills: 13
checked 9 skill headers/UI files and 22 reachable instruction files
unavailable relative references: 0

python3 docs/check-grokbot-links.py
machine: grokbot
enabled agents: grok-bot
selected skills: 13
instruction files checked: 32
relative references checked: 97
generated output references skipped: 1
unavailable relative references: 0
```

The plan was read-only on Studio. No Loadout apply/sync ran. Its action count is machine-state dependent. The selected-skill checks materialize the actual manifests in temporary directories, so the shared bot set cannot accidentally resolve a coding-only dependency from this checkout. A negative control removed `dispatch/references/project-state.md` from a temporary deployment; the Dispatch checker rejected the missing references and exited 1.

Nine affected skill frontmatters and UI policies were parsed with PyYAML. The bundled skill-creator validator also passed all nine on temporary copies with only the repo-specific `disable-model-invocation` extension removed, matching prior repository validation. Original manual-only flags and UI policy were checked separately. `git diff --check` passed.

To repeat the maintained checker with an isolated Python environment:

```sh
python3 -m venv /tmp/dispatch-check-venv
/tmp/dispatch-check-venv/bin/pip install pyyaml
/tmp/dispatch-check-venv/bin/python docs/check-dispatch.py
python3 docs/check-grokbot-links.py
loadout validate .
loadout plan --loadout .
```

## Behavioral forward test

An independent native evaluator read the revised skill and wrote synthetic artifacts in a temporary Git repository. It did not receive an intended answer and could not launch, send, pin, publish or change this repository. This pass used the inherited model, not the unavailable configured reviewer panel.

| Scenario | Observed result |
| --- | --- |
| New setup with `mcp:launch:alpha/../β` | Digest `t-4e56825ff62872997572f2a2daa40933e19eb58b2e035f5da888511cd68f8356`, safe 66-character component, exact ID retained; four Markdown files staged in a disposable repo. A second exclusive create raised `FileExistsError`. |
| Second user pulls and asks status | Inspect only; owner fields, report cursors and worker routes remain unchanged. |
| Explicit takeover, old writer inaccessible and not known stopped | Read-only gate until operator confirms the old writer will no longer write. |
| Confirmed stopped writer, synchronized/published handoff, inaccessible old worker | Stable identity/history retained; owner generation advances; inaccessible worker remains waiting on access. No automatic replacement or settlement. |
| Report saved before cursor, then duplicate notification | Reconcile the same source marker; no duplicate report acceptance, decision or worker. |
| New PR head or late prior-attempt report | Old checks do not verify the new head; a late report cannot reclaim current ownership. |
| Wayfinder and later build | Explicit planning only; research/prototype evidence cannot answer human decisions or approve implementation. |

The evaluator identified four wording problems. Chase could put an open PR under What landed; settings still used removed YAML key names; a missing tracker could block directly approved work; and Wayfinder still implied tracker-generated ticket IDs were required. All four were corrected locally and checked against the evaluated scenarios. No replacement delegate was started for these small fixes.

## Review and limits

The decision check found no unresolved product choice outside the requested direction. Local format choices are the digest encoding, four core Markdown files, ownership generation, sanitized source markers and optional local Wayfinder records described above. No live data migration was performed. No code comments or lint/type suppressions were added, so Comment Sicko was not applicable.

Blast-radius verification ran the real Loadout manifest resolution and temporary deployment reference checks. It proves the coding/shared split and dependency closure, including that support and Fleet can still load their bot-only worker reference. It does not prove authenticated Executor behavior or runtime worker permission.

The configured architect/reviewer entries name `claudeAgent` and `codex`; live T3 capabilities reported both provider instances disabled. No unasked provider substitution or model-policy edit was made. A configured cross-model design/reviewer panel did not run. Review consisted of the independent behavioral pass, structural checks, and a cold self-review of the final diff.

No live multi-user takeover, pin mutation, worker launch, remote report-back or Git push was executed as a test. Those remain runtime validation limits. No PR was opened. The initial handoff left the source diff uncommitted under the repository rules. Dan subsequently authorized committing and pushing the Dispatch port on `feat/dispatch-t3-project-state`, with model-policy changes reserved for a separate commit. No merge or installed-skill sync is authorized by that publication.
