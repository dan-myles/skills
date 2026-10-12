# Parking lot

Where the Bob work stands, for the next agent who picks it up. Read this before changing anything here.

## What this repo is

Dan's global skills library, used by every agent he runs (Claude Code, Codex, and T3 Code, which runs both). Each folder is one skill. The repo is a skills-manager library: `.skills-manager/` holds its registry, and the skills-manager CLI deploys every skill in the Default preset to Claude Code (`~/.claude/skills`) and Codex (`~/.codex/skills`) as symlinks back into this repo. Don't make or remove those links by hand.

Most of it is **Bob**: Dan's agent persona and his software workflow, a set of `bob-` skills. Bob is a port of pstack, a Cursor plugin, rewritten in our own words and rebuilt for T3 Code.

Also here, outside Bob:

- `unslop`: cuts AI tells from writing. Global and unprefixed on purpose.
- `personal-*`: Dan's one-off automations (GameStock PR review, Mercury receipts, Paper comment watch) and third-party skills Dan is trying out (`personal-anatomy`, from skills.wheresryan.sh/anatomy, MIT).

## Status

Bob is still being designed. **Nothing in it has run on real work yet.** Don't use it on Dan's real repos until he says so. The suggested next step is a dry run of `/bob` on a small task in a throwaway repo.

## Ground rules

- Port from pstack in our own words. No Cursor-specific config, no credits, no license file.
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

Bob babysits every PR he opens unless told not to, and replies to human reviewers and bots without asking. Dan chose both.

`bob/references/benchmark-checklist.md` vets every performance number. `bob/references/visuals.md` makes replies visual-first: in T3 Bob draws most replies and every checkpoint as an HTML page (`html_preview`, then `html_render`) and keeps the text to what the picture doesn't say. Every playbook's Reply names what to **Show**.

**Helpers** Bob runs from playbook steps:

- `bob-how`: how code works.
- `bob-why`: why it was built that way, from every evidence source.
- `bob-architect`: two designers on different model families, a judge, a merged sketch.
- `bob-adversarial-review`: reviewers on different models attack a diff. Renamed from `bob-interrogate`.
- `bob-blast-radius`: what a change breaks outside its diff, with its safety fact proven by running code.
- `bob-verify`: writes and maintains a repo's own `verify-<app>` skill (committed in that repo at `.claude/skills/verify-<app>/`, symlinked from `.agents/skills/`). Bob uses it when driving an app and only offers to create one.

**Principles**: 24 `bob-principle-*` skills, one folder each so only the needed one loads. `bob/SKILL.md` lists them with triggers; standing rules and playbook steps cite them by short name.

**`bob-models`**: `bob-models/models.yaml` pins models only for panels and judges (architect designers and judge, adversarial-review reviewers, eval candidates and judge). Everything else runs on Bob's own model. `/bob-models` reviews the file against T3's live catalog and recommends upgrades. `bob-models/references/delegation.md` says how to start a pinned subagent through T3's `delegate_task`.

**`bob-improve`**, its own front door because it changes skills or repos, not product code:

- Reflect: three reviewers read a session and propose skill edits.
- Eval: tests a skill change blind.
- Models: recommends model changes from session evidence. Never edits `models.yaml` itself.
- Correct: makes a repo's repeated agent mistakes impossible (architecture, then types, then lint, then tests), proven against a real past mistake.

## Decisions and why

- **Model choices pin only panels and judges.** Dan rejected per-subagent model choices, named-model indirection, and a single effort knob as overengineering. Mixing model families only matters where models check each other.
- **`models.yaml` is data, not markdown.**
- **Principles are separate skills,** like pstack, so Bob loads only the one a step needs. A single combined file was rejected.
- **Verify skills live in each repo.** Only the generator is global.
- **Auto-babysit, with review replies.** Dan wants PRs handed back merge-ready. Merging still needs his say-so.
- **"Adversarial review", not "interrogate".** It reviews code; it doesn't question the user.

## Where we stopped

Ported: pstack's main skill and its Feature, Bug, Investigation, Refactor, Perf (with hillclimb and benchmark checklist), Prototype, Babysit, runtime and trace forensics (as Diagnose); `how`, `why`, `architect` (with `arena` folded in), `interrogate`, `blast-radius`, `reflect`, eval, `correct`, `setup-pstack` (as `bob-models`), `create-verification-skill` and `maintain-verification-skill` (as `bob-verify`), all 24 principles, and `unslop`.

**Next:** dry-run `/bob` on a small task in a throwaway repo, and fix what that turns up through `/bob-improve`.

**Parked, Dan unsure:**

- `figure-it-out` (a playbook for jobs no other playbook fits) and `show-me-your-work` (an auditable decision log). Refactor and Perf currently stop and propose a split when a job is too big.
- The overnight playbooks: Autonomous run, Autopilot-stack, Autopilot-full with Shipping, Orchestrate. Hold until Bob has earned trust on watched runs. Autonomous run is the one to add first. Autopilot-full merges on its own, which clashes with Bob's never-merge rule.
- Pause safely and Session pickup. T3 threads already hold much of that context.
- A `bob-grill` helper that questions Dan before `bob-architect` designs.

**Skipped on purpose:** `automate-me` (one-time use), `swarm` (T3 delegation covers it), `tdd` (the Bug playbook and `bob-principle-test-behavior-not-implementation` cover it), `teach` and `recall` (`bob-how`, `bob-why`, and T3 history cover them), `no-comments`, `bro`, `poteto-help`, `technical-writing`, `typescript-best-practices`, `make-bot-ui`, Visual parity, Worktree cleanup, and Multi-phase plan.

## Known gaps

- Nothing has been run. Expect wording that reads fine and fails in practice.
- `models.yaml`'s picks (`claude-opus-5-5` and `gpt-6.1-sol`, both at max effort) were guesses. Run `/bob-models` to check them against T3's live catalog.
- Open T3 issues `delegation.md` works around:
  - #16808: `delegate_task` fails with `parent_not_active` from a background subagent.
  - #17548: a child's settle hook runs in the parent's worktree.
  - #17809: background subagents stay "Running".
  - PR #16595: an options override replaces the inherited options instead of merging with them.
- Babysit outside T3 falls back to `gh pr checks --watch`, which blocks the session.

## Porting source

pstack lives in `github.com/cursor/plugins` under `pstack/`. A clone was at `/tmp/cursor-plugins` (commit `d73344b`, 2026-10-09) and may be gone; clone it again to keep porting. Its main skill is `skills/poteto-mode/` and its playbooks are under `skills/poteto-mode/playbooks/`. Prior art for running pstack inside T3: `github.com/uzairansaruzi/p3-stack`.
