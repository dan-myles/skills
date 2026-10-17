# Parking lot

Where the Bob work stands, for the next agent who picks it up. Read this before changing anything here.

## This branch: the Synara edition

`synara-edition` is a maintained edition for Synara, not a step toward merging into `main`. `main` stays the T3 Code edition. Read `SYNARA.md` for the inventory, the T3-to-Synara feature map, and the gaps; Synara mechanics live in one place, `bob/references/synara.md`.

- **Catch up from `main`** by merging `main` into this branch, then re-check every new or changed line against `bob/references/synara.md`: T3 tools (`t3_*`, `delegate_task`, `html_render`, `watch_pull_request`, `schedule_task`) never survive a merge. Never merge this branch into `main`.
- **Names:** a branch can't be called `synara`, because Synara's own temporary branches live under `synara/…` and Git can't hold both.
- **Home:** this edition writes only `~/.bob-n-frank/synara/` (and, inside a Hub, Hub documents and the Library). It reads the T3 edition's `~/.bob-n-frank/` only for grills and for `/frank migrate`. The two editions' `models.yaml` can't be shared: Synara's Claude slugs are `opus` and `sonnet`, not `claude-opus-5-5`.
- **Install:** the installed skills link into `~/Developer/personal/skills`, so whichever branch is checked out there is live. `git switch synara-edition` or `git switch main` swaps editions for every agent at once.
- Where the sections below name T3 tools, issues, or paths, they describe `main`; on this branch `bob/references/synara.md` supersedes them.

## What this repo is

Dan's global skills library, used by every agent he runs (Claude Code, Codex, and T3 Code, which runs both). Each folder is one skill. The repo is a skills-manager library: `.skills-manager/` holds its registry, and the skills-manager CLI deploys every skill in the Default preset to Claude Code (`~/.claude/skills`) and Codex (`~/.codex/skills`) as symlinks back into this repo. Don't make or remove those links by hand.

Most of it is **Bob**: Dan's agent persona and his software workflow, a set of `bob-` skills. Bob is a port of pstack, a Cursor plugin, rewritten in our own words and rebuilt for T3 Code.

Also here, outside Bob:

- `unslop`: cuts AI tells from writing. Global and unprefixed on purpose.
- `personal-*`: Dan's one-off automations (GameStock PR review, Mercury receipts, Paper comment watch) and third-party skills Dan is trying out (`personal-anatomy`, from skills.wheresryan.sh/anatomy, MIT; `personal-taste`, Leon Lin's taste-skill v2 from github.com/Leonxlnx/taste-skill at f624f37, MIT). Third-party skills are copied as is with only `name` changed, keep their LICENSE, and stay model-invocable when upstream meant them to.

## Status

Bob is still being designed. **Nothing in it has run on real work yet.** Don't use it on Dan's real repos until he says so. The suggested next step is a dry run of `/bob` on a small task in a throwaway repo.

## Ground rules

- Port from pstack (and Matt Pocock's skills) in our own words. No Cursor-specific config and no license file. Credits live only in `README.md`, the human-facing intro, which names pstack, Matt Pocock's skills, and T3 Code at Dan's request.
- Bob is built for T3 Code. Headless CLIs (`claude -p`, `codex exec`) are only a fallback.
- Every bob- skill is manual-only. Bob reads helpers and principles by path when a step names them.
- Explain to Dan with rendered visuals, and keep the text to what the visual doesn't say.
- Ask Dan with the question tool (`AskUserQuestion` in Claude Code and T3), the recommended option first. The confirm option is labeled **Send it**, and Dan types "send it" to approve. Bob's rule is **How to ask** in `bob/SKILL.md`.
- Commit messages are short and lowercase (`add bob-verify`, `bob: add perf playbook`). Commit and push only when Dan asks.
- Never print or copy secrets. The 1Password master password lives in `~/.config/agents/1password.txt`; leave it there.

## Adding or renaming a skill

Do all of these together:

1. The folder name, and `name:` in `SKILL.md` frontmatter, match.
2. `disable-model-invocation: true` in the frontmatter.
3. `agents/openai.yaml` with the same name and `allow_implicit_invocation: false`.
4. Register it: `.skills-manager/skills/<uuid>.json` (its `path` and `path_key` match the folder) and `.skills-manager/scenario-skills/e1791670-bbde-4560-bd44-9547d1deaa60/<uuid>.json` with the next `sort_order`. Copy an existing pair as the template.
5. Deploy it: `skills-manager-cli --skills-root ~/Developer/personal/skills presets deploy Default --agent claude_code --agent codex`. The CLI lives at `~/.local/bin/skills-manager-cli` (standalone release from `xingkongliang/skills-manager`). `skills status <name>` shows where a skill is deployed.
6. Add it to the skills list in `bob-improve/SKILL.md`, and to `bob/SKILL.md` if Bob uses it.
7. Run `unslop` on new prose.

## Bob and Frank's home

Each user customizes Bob and Frank in `~/.bob-n-frank/`, outside every repo:

- `models.yaml`: the model for every role. Every agent on the machine reads it.
- `config.yaml`: Frank's settings (repos, sources, brief times, auto-dispatch rules).
- `frank/`: Frank's board, briefs, reports, and decision log.
- `orchestrate/<program>/`: each Orchestrate program's store.

A repo can override `models.yaml` and Frank's per-repo settings in `<repo>/.bob-n-frank/`.

## Map

**`bob`**, the front door: `/bob <goal>`. It sorts the task into one playbook in `bob/playbooks/`:

| Playbook | For | Ends at |
|---|---|---|
| Investigation | Explain mode: how or why something works. Diagnose mode: the cause of a leak, spin, hang, or glitch from a real capture. | An answer. No changes. |
| Bug | Wrong behavior made right. | A merge-ready PR, merged only if the repo's normal flow merges bug fixes. |
| Feature | New or different behavior. Design checkpoint before code. | A merge-ready PR, unmerged. |
| Refactor | Same behavior, better structure. Pins behavior first. | A merge-ready PR, unmerged. |
| Perf | Fix mode for one slowdown, Climb mode to push a metric over many kept-or-reverted tries. | A merge-ready PR, unmerged. |
| Prototype | Throwaway sketches to settle a design call. | A pick. No PR. |
| Babysit | Getting a PR merge-ready: conflicts, review threads, CI. Waits with T3's `watch_pull_request`. | Merge-ready. Never merges unless told. |
| Orchestrate | A whole program handed to one T3 thread that never writes code: briefs, standing orders, a store of tables in `~/.bob-n-frank/orchestrate/<program>/`, Bob worker threads in their own worktrees, verifiers on the other model family, drains on a T3 heartbeat. Ported from pstack's Orchestrate. | Merge-ready PRs; merges only if the standing orders allow it. |
| Cleanup | Prunes worktrees and other disk leftovers after an audit; the user picks what goes. | Space reclaimed. |

Bob babysits every PR he opens unless told not to, and replies to human reviewers and bots without asking. Dan chose both.

`bob/references/benchmark-checklist.md` vets every performance number. `bob/references/visuals.md` makes replies visual-first: in T3 Bob draws most replies and every checkpoint as an HTML page (`html_preview`, then `html_render`) and keeps the text to what the picture doesn't say. Every playbook's Reply names what to **Show**.

**Helpers** Bob runs from playbook steps:

- `bob-how`: how code works.
- `bob-why`: why it was built that way, from every evidence source.
- `bob-architect`: two designers on different model families, a judge, a merged sketch.
- `bob-adversarial-review`: reviewers on different models attack a diff. Renamed from `bob-interrogate`.
- `bob-blast-radius`: what a change breaks outside its diff, with its safety fact proven by running code.
- `bob-grill`: settles every open decision with the user before complex, risky, or unclear work. It maps the decisions as a tree, asks each round's ready questions with recommendations through the question tool, looks facts up instead of asking, and saves the result to `~/.bob-n-frank/grills/<slug>.md`. Bob runs it in Feature (before design), Bug, and Refactor when unsure; Frank runs it before dispatching an item with open decisions. Not in Orchestrate for now. Adapted from Matt Pocock's grilling skill.
- `bob-no-comments`: Comment Sicko, a read-only subagent on the other family, lists every comment to kill; Bob deletes them, fixes the code each `MUST KILL` flag blames, and encodes claimed constraints as types, tests, or lint without asking. Runs first at Review whenever a diff touches comments or suppressions. Ported from pstack's `no-comments` and its Comment Sicko agent, with the Sicko read-only so a child never edits Bob's worktree.
- `bob-verify`: writes and maintains a repo's own `bob-verify-<app>` skill (committed in that repo at `.claude/skills/bob-verify-<app>/`, symlinked from `.agents/skills/`). Bob uses it when driving an app and only offers to create one.

**Principles**: 24 `bob-principle-*` skills, one folder each so only the needed one loads. `bob/SKILL.md` lists them with triggers; standing rules and playbook steps cite them by short name.

**`bob-models`**: the model for every role lives in the user's home, `~/.bob-n-frank/models.yaml`, which every agent on the machine reads. `bob-models/models.example.yaml` in this repo is the built-in default: it has every line, runs when a user has no models file, and fills lines their file lacks. Frank likewise runs on `frank/references/config.example.yaml` when `config.yaml` is missing. A repo can override lines in `<repo>/.bob-n-frank/models.yaml` (committed for the team, or in `.git/info/exclude` for one machine). Lines are `<skill>.<name>` or `threads.<name>` (`threads.bob` is Opus 5.5 high); `inherit` uses the thread's model; checkers stay on the other family. Frank's own thread is set by hand in T3 (recommended: gpt-6.1-sol, medium, Fast tier). `/bob-models` edits the home file and recommends upgrades. `bob-models/references/delegation.md` says how to start each one.

**`bob-improve`**, its own front door because it changes skills or repos, not product code:

- Reflect: three reviewers read a session and propose skill edits.
- Eval: tests a skill change blind.
- Models: recommends model changes from session evidence. Never edits `models.yaml` itself.
- Correct: makes a repo's repeated agent mistakes impossible (architecture, then types, then lint, then tests), proven against a real past mistake.

**`frank`**, Bob's chief of staff, its own front door: `/frank`. One standing T3 thread that reads every connected source (T3 threads always; GitHub, Linear, Slack when connected), triages benny-style, auto-dispatches small bugs once a validator on the other model family confirms them (`frank.validator` in `models.yaml`), proposes the rest for Dan to pick, tracks everything on a board, sweeps for blockers every two hours, and briefs at 8:30 and 4:30. Never writes code, merges, or messages people. Settings and state live in `~/.bob-n-frank/` (`config.yaml`, `frank/board.tsv`); a repo can override in `<repo>/.bob-n-frank/config.yaml`. Modeled on Lauren Tan's Grok Bot chief of staff, which isn't part of pstack. Workers report back (`REPORT-BACK` in `bob/references/brief.md`) and never settle themselves; Frank and Orchestrate settle finished workers per `bob/references/settling.md` (owned, scope done, recorded, nothing running or waiting, no PR waiting, work safe, settle actions safe) and keep their own thread active.

## Decisions and why

- **Every role has a model line (since 2026-10-12).** Dan first kept lines to panels and judges, then asked to set every model up for success after comparing with pstack-t3, which resolves every role from a roles file. Still no named-model indirection and no single effort knob.
- **`models.yaml` is data, not markdown.**
- **Principles are separate skills,** like pstack, so Bob loads only the one a step needs. A single combined file was rejected.
- **Verify skills live in each repo.** Only the generator is global.
- **Auto-babysit, with review replies.** Dan wants PRs handed back merge-ready. Merging still needs his say-so.
- **"Adversarial review", not "interrogate".** It reviews code; it doesn't question the user.

## Where we stopped

Ported: pstack's main skill and its Feature, Bug, Investigation, Refactor, Perf (with hillclimb and benchmark checklist), Prototype, Babysit, runtime and trace forensics (as Diagnose); `how`, `why`, `architect` (with `arena` folded in), `interrogate`, `blast-radius`, `reflect`, eval, `correct`, `setup-pstack` (as `bob-models`), `create-verification-skill` and `maintain-verification-skill` (as `bob-verify`), all 24 principles, `no-comments` with Comment Sicko (as `bob-no-comments`), and `unslop`.

**Next:** dry-run `/bob` on a small task in a throwaway repo, and fix what that turns up through `/bob-improve`.

**Parked, Dan unsure:**

- `figure-it-out` (a playbook for jobs no other playbook fits) and `show-me-your-work` (an auditable decision log). Refactor and Perf currently stop and propose a split when a job is too big.
- Run (pstack's Autonomous run), Shipping, Autopilot-stack, and Autopilot-full. Run and Shipping were ported, then removed on 2026-10-12 until needed; Orchestrate keeps its own Land step. Hold until Bob has earned trust on watched runs. Autopilot-full merges on its own, which clashes with Bob's never-merge rule.
- Pause safely and Session pickup. T3 threads already hold much of that context.

**Skipped on purpose:** `automate-me` (one-time use), `swarm` (T3 delegation covers it), `tdd` (the Bug playbook and `bob-principle-test-behavior-not-implementation` cover it), `teach` and `recall` (`bob-how`, `bob-why`, and T3 history cover them), `bro`, `poteto-help`, `technical-writing`, `typescript-best-practices`, `make-bot-ui`, Visual parity, Worktree cleanup, and Multi-phase plan.

## PostHog's lessons, parked (2026-10-14)

PostHog posted 38 lessons from building their AI products ([thread](https://x.com/posthog/status/2109706421919248499)). The full comparison with Bob is in [this doc](https://claude.ai/code/artifact/0b8b1ab0-eb10-4142-a150-053caffbd604). Ranked takeaways, none built yet:

1. **Freeze features and run Bob on real work.** Watch a few real runs end to end before adding more skills. (Habit; matches **Next** above.)
2. **Turn failures into evals.** `bob-improve reflect` saves each bad session as a case, and `bob-improve eval` replays the cases before a skill change ships.
3. **Count lookups as missing skills.** Add a line to REPORT in `bob/references/brief.md` for what the thread had to look up or wished it had.
4. **Cut subagents back to where they pay.** PostHog keeps readers on the parent model to share its cache. Dan doesn't mind either way, so the read-only roles stay on Sonnet in `models.yaml`.
5. **Cost per thread.** Report tokens and dollars per thread so Frank can show spend.
6. **Keep the harness thin.** Fewer rules in prompts, more of the model's own judgment. (Habit.)
7. **Drift check after merges.** Frank's sweep flags skills that name files, flags, or tools that no longer exist.
8. **Worked examples.** Add one short real run to each playbook.

#3 and #5 are the cheapest to build, as two new REPORT lines plus a Frank roll-up.

## Known gaps

- Nothing has been run. Expect wording that reads fine and fails in practice.
- The model picks came from research on 2026-10-12 (benchmarks, speed, pstack-t3's defaults). Recheck them with `/bob-models` as T3's catalog changes; Haiku 5.5 should replace Sonnet 5.5 for the read-only roles once T3 lists it.
- Open T3 issues `delegation.md` works around:
  - #16808: `delegate_task` fails with `parent_not_active` from a background subagent.
  - #17548: a child's settle hook runs in the parent's worktree.
  - #17809: background subagents stay "Running".
  - PR #16595: an options override replaces the inherited options instead of merging with them.
- Babysit outside T3 falls back to `gh pr checks --watch`, which blocks the session.

## Porting source

pstack lives in `github.com/cursor/plugins` under `pstack/`. A clone was at `/tmp/cursor-plugins` and may be gone; clone it again to keep porting. Ported from `d73344b` (2026-10-09); updates to the skills we ported were brought over through `99743e9` on 2026-10-15 (four principles restated as reasoning, `correct`'s test step, `bob-verify` readiness, Cleanup's base branch, Orchestrate's one-stacker rule). To catch up again, diff from `99743e9` and take only changes to skills we already have. Its main skill is `skills/poteto-mode/` and its playbooks are under `skills/poteto-mode/playbooks/`. Prior art for running pstack inside T3: `github.com/uzairansaruzi/p3-stack`.
