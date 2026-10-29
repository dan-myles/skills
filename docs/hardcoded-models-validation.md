# Hardcoded model migration checks

This follows the Dispatch port in `4eee036`. Dan approved hardcoding role choices and retaining `cooper-models` to upgrade those declarations across skill source.

## Result

Launch steps now state model, options and provider family directly. Cooper's generic transport guidance moved from `cooper-models/references/delegation.md` to `cooper/references/delegation.md`. The runtime YAML resolver and `models.example.yaml` are removed. Existing home/repo YAML files remain on disk but are no longer consulted. Grills, Orchestrate stores, Dispatch state and installed skill copies are untouched.

`cooper-models` remains manual-only and in the coding manifest. It inventories actual launch sites and matching examples, checks enabled live T3 instances, proposes upgrades with evidence, and edits approved source declarations together. Inventory-only runs do not write. Project/job-only requests remain brief overrides; they do not mutate shared defaults. Model upgrades do not change already-running threads or sync installations.

Live provider resolution uses the declared family and exact model/options, preferring the current instance when eligible, otherwise the unique capable instance. A disabled generic `codex` or `claudeAgent` entry does not hide an enabled pool. Ambiguous eligible instances need selection. An unavailable model/setting remains a gate; no silent provider/model/effort fallback is allowed.

## Preserved launch settings

A migration check parsed `models.example.yaml` from `4eee036` and compared every active former YAML role with the declarations at its actual launch site, including ordering for paired designers/reviewers and reflection lenses.

| Source | Selections retained |
| --- | --- |
| Cooper build / hard subagents | GPT-6.1 Sol high / Opus 5.5 xhigh |
| How explorers / explainer | Sonnet 5.5 medium / Opus 5.5 high |
| Why investigators / synthesizer | Sonnet 5.5 medium / Opus 5.5 high |
| Architect designers / judge | Opus 5.5 xhigh + GPT-6.1 Sol xhigh / GPT-6.1 Sol high |
| Adversarial reviewers | Opus 5.5 high + GPT-6.1 Sol high |
| Comment review | Opus 5.5 medium |
| Orchestrate workers / verifiers | Opus 5.5 high / GPT-6.1 Sol high |
| Verify readers | Sonnet 5.5 medium |
| Improve reflection | Judgment Opus 5.5 high, tooling Sonnet 5.5 medium, divergent GPT-6.1 Sol high, synthesis Opus 5.5 high |
| Improve eval candidates / judge | Opus 5.5 high + GPT-6.1 Sol high / GPT-6.1 Sol high |
| Dispatch worker / program coordinator | Opus 5.5 medium / Opus 5.5 medium |

The check covered 22 active former YAML selections, plus the Orchestrate coordinator choice and Dispatch's existing direct worker selection. The old unused validator default is not reactivated. Dispatch's existing explicit validator selection and diversity gate stay in place. Model upgrades can be requested separately.

## Checks run

```text
PASS 22 former YAML role selections preserved at actual launch sites
PASS Dispatch worker choice and Orchestrate coordinator selection preserved
PASS no remaining runtime YAML/legacy-role/deleted-transport references in skills
PASS 10 affected skill frontmatters with bundled validator on temporary copies

python docs/check-dispatch.py
coding skills: 54; shared bot skills: 13
checked 17 skill headers/UI files and 54 reachable instruction files
unavailable relative references: 0

python3 docs/check-grokbot-links.py
selected skills: 13
instruction files checked: 32
relative references checked: 97
unavailable relative references: 0

loadout validate .
valid: . (3 layers, 54 items, 0 warnings)
```

`loadout plan --loadout . --json` ran read-only. No apply/sync ran. The bundled validator used temporary copies with only the repo's unsupported frontmatter extension removed; the repository checker verified original manual-only policies. `git diff --check` passed.

The maintained reference checker now traverses all affected skill entrypoints, so the moved transport reference is checked from callers. The migration comparison was a one-time baseline check, not a new runtime model registry. It verifies preservation of declared settings, not model quality or the outcome of every role's work.

## Review

Two independent T3 delegate reviews completed on Opus 5.5 high and GPT-6.1 Sol high through enabled pool instances. Both confirmed the active model choices were preserved. Actual launches also exercised family resolution where generic instances were disabled.

Acted on the GPT finding that Orchestrate permitted a model switch after a tool error. Retries now retain the approved selection; a change requires an explicit user override and a diversity recheck.

Acted on the Opus findings about lost diversity rationale, incomplete panels, capabilities before thread-only launches, options payload versus user override, scoped project standing orders, and stale historical notes. Launch sites and the upgrade skill now preserve those distinctions. The validation-doc finding was superseded by completion of this document.

The upgrade fixture independently applied an approved hypothetical change to only adversarial reviewer B's effort, high to xhigh, in a temporary source checkout. It changed exactly the reviewer declaration and matching README summary. Build workers, the Claude reviewer and other roles remained unchanged; reference and Loadout validation passed. That exercise exposed the active-summary inventory gap, which was fixed in the upgrade skill. No hypothetical upgrade was applied here.

Read-through scenarios covered a disabled generic instance with one capable pool, multiple eligible pools, unavailable model/options, a cross-family user override, inventory-only operation, and project-only overrides. Ambiguity and unavailable selections remain gates; source edits require the requested scope.

Dismissed the GPT request to migrate the support bot's account-specific pool ID as outside this change's Cooper/Dispatch scope. Opus independently noted support was deliberately excluded. Its Executor contract and Fleet Control design are unchanged. Remembering a selected pool in a new persistent registry was not adopted; live eligibility and sourced user instructions remain the rule.

## Decisions and limits

The user settled removing YAML resolution, preserving role settings, keeping model upgrades in source, retaining `cooper-models`, and allowing explicit job overrides. Routine implementation choices were placing shared transport with Cooper, resolving live provider instances by family, and keeping review inventory as an artifact rather than a new configuration format.

No production work, external messaging, installed-skill sync, or actual model upgrade was performed. No new code comments or suppressions were added. Historical validation documents remain snapshots of their commits. Model availability can change after a capability check; a later launch failure must be surfaced rather than hidden with a substitute.
