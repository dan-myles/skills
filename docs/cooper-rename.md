# Cooper rename

Historical snapshot of the rename. The later Dispatch T3 port and hardcoded-model migration supersede the model lookup and Dispatch transport details below. See [current model migration checks](hardcoded-models-validation.md).

Dan selected Cooper as the worker's new name on 2026-10-28. This change follows `a3b38d9145f56477a3914aee2031cd83dfe6bcff`, the Grok Bot Dispatch refactor.

## Names and compatibility

All 36 `bob`/`bob-*` skill folders and coding-tag entries become `cooper`/`cooper-*`. Commands, UI names/prompts, helper paths, worker titles, and Dispatch/Fleet/Support launch briefs use Cooper. Dispatch's shared worker reference is now `skills/dispatch/references/cooper-workers.md`. The role split, approvals, models, and report transports are unchanged.

Settings and stores remain under `.bob-n-frank`. Model keys such as `bob.workers`, `bob-architect.designers`, `bob-improve.reflect-judgment`, and `threads.bob` also remain unchanged. The model instructions explain that these are persisted identifiers, not current skill folder names. Existing home and repo overrides retain their exact keys, values, and precedence. Parsed built-in model defaults are identical to the previous version.

New repo verification skills use `cooper-verify-*`. Cooper also discovers and maintains existing `bob-verify-*` skills in place. This rename does not alter another repo's recipes, settings, running threads, or saved state. Legacy schedules and startup prompts are not rewritten by a skill sync; update those references separately when migrating their owners. No old command aliases are shipped.

All 122 existing worker-family files have corresponding files in the renamed directories. The comment-review skill lacked UI metadata before the rename; its new folder includes that metadata with explicit-only invocation. Two renamed UI summaries were shortened. Five skill descriptions use plain command arguments instead of angle-bracket placeholders so the bundled metadata validator accepts them. Other behavior is unchanged apart from the documented compatibility handling.

Historical validation records and `.skills-manager` metadata retain the names used when they were recorded. They are not the current deployment catalog. The personal skills, ketchup, and unslop remain byte-for-byte unchanged.

## Checks

```text
PASS 36 Cooper skills replace all 36 Bob skill folders and manifest entries
PASS catalog: 54 skills = 18 shared + 36 coding-only Cooper skills
PASS parsed model defaults and legacy override keys unchanged
PASS 43 affected skill headers, UI names/prompts and invocation policies
PASS all 122 worker-family files preserved under renamed folders
PASS personal-*, ketchup and unslop unchanged
PASS git diff --check
```

The metadata check parsed original YAML and checked names, prompts, and invocation policies. The bundled skill-creator validator ran on temporary copies with the repo's `disable-model-invocation` extension removed, as in the Dispatch checks. Its originals retain that field. Existing unchanged UI summaries were not subjected to a new length policy.

A static reference walk covered 141 references in affected instruction files, resolving relative paths from their file or documented skill root. Neither the previous tree nor the renamed tree has a missing target. A separate scan found no stale worker commands or links to the old skill folders in current instructions.

```text
$ python3 docs/check-grokbot-links.py
machine: grokbot
enabled agents: grok-bot
selected skills: 18
instruction files checked: 42
relative references checked: 133
generated output references skipped: 1
unavailable relative references: 0
```

These are packaging and documentation checks, not live launches. No Loadout sync, rollback, or routine update was run. Review the actual machine plans for removal of old owned folders and creation of the Cooper folders. Preserve unowned edits. Make the new coding-machine skills available before coordinators begin launching `$cooper`, and start fresh agent sessions after sync.
