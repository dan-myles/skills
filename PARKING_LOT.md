# Parking lot

Where the Cooper work stands, for the next agent who picks it up. Read this before changing anything here.

## What this repo is

Dan's loadout, applied by the loadout CLI from this repository's `main` branch. `loadout.toml` is the deployment contract. `tags/development.toml` adds Cooper and Dispatch on machines that locally select development, currently Studio and Paperclip; `machines/grokbot.toml` enables only the Grok Bot destination and the global non-coding skills. Capy on the Studio is pending a documented user-level skills path; it cannot be declared validly without one. See `README.md` for machine names, rollout questions, ownership limits, and branch-specific setup.

All skill folders live under `skills/`, matching the Loadout starter, with their contents intact. `.skills-manager/` is historical migration metadata, ignored by Loadout. Do not use it to deploy these skills after migrating a machine. Preserve and reconcile live-library-only edits, then undeploy the manager-created links before switching ownership. Loadout follows top-level skill links and can otherwise adopt the library targets. See the README migration steps. This conversion did not apply any machine or change `main`.

Pending skill-content follow-up: `skills/cooper-improve/SKILL.md` still instructs agents to import into Skills Manager and deploy Default. Its body was preserved at Dan's request. Do not run those old deployment steps after migrating; follow `README.md` and update the skill only when Dan authorizes changing its contents.

Most of it is **Cooper**: Dan's agent persona and his software workflow, a set of `cooper-` skills. Cooper is a port of pstack, a Cursor plugin, rewritten in our own words and rebuilt for T3 Code.

Also here, outside Cooper:

- `personal-messaging`: automatically guides drafts and authorized messages to other people on Dan's behalf. Global, with distinct agent identity and Dan-draft modes.
- `unslop`: cuts AI tells from writing. Global and unprefixed on purpose.
- `personal-vaultwarden`: automatically discovers and uses the correct vault credential for an authorized task. Secure file input handles headless unlock; direct transfer keeps secrets out of model output. Lives with the CLI and local MCP in the development profile.
- `personal-loadout-programs`: automatically offers to declare a program in this loadout when one is installed and looks cross-machine, with the manager rules learned while declaring Tailscale, Claude Code, Codex, and T3 Code. Lives in the development profile, since the box never declares programs.
- `personal-tailscale-ssh`: automatically handles work on Dan's other machines through passwordless Tailscale SSH. Dan explicitly requested automatic invocation. Records verified stapler (the Mac Studio), Archie, and Paperclip accounts.
- `ketchup`: catches Dan up on a chat since his last message and lists every call waiting on him. Unprefixed like `unslop`, but manual-only. Ported from pstack's `ketchup` (2026-10-20).
- `tools/t3-grokbot-bridge/`: a standalone Node program, not a skill, that streams T3 thread updates per project to a Grok Bot webhook (Dan's call, 2026-10-29). Loadout ignores `tools/`. Its runtime state and credentials live in `~/.crabstock-dispatch/`, never in this repo. Read its README before changing it; it records what was verified against T3 and what was not (real Grok Bot delivery).
- `personal-*`: Dan's one-off automations (GameStock PR review, Mercury receipts, Paper comment watch) and third-party skills Dan is trying out (`personal-anatomy`, from skills.wheresryan.sh/anatomy, MIT; `personal-taste`, Leon Lin's taste-skill v2 from github.com/Leonxlnx/taste-skill at f624f37, MIT; `personal-landing-page-design` and `personal-design-to-motion`, Elaya's ai-design-skills from github.com/elayadesign/ai-design-skills at a2735a3, MIT). Third-party skills are copied as is with only `name` changed (plus the manual-only flags) and keep their LICENSE. Every `personal-*` skill is manual-only except `personal-tailscale-ssh` (Dan's call, 2026-10-26), `personal-loadout-programs` (Dan's call, 2026-10-29), `personal-vaultwarden` (Dan's call, 2026-10-29), and `personal-messaging` (Dan's call, 2026-10-30).

## Status

Cooper is still being designed. **Nothing in it has run on real work yet.** Don't use it on Dan's real repos until he says so. The suggested next step is a dry run of `/cooper` on a small task in a throwaway repo.

## Ground rules

- Port from pstack (and Matt Pocock's skills) in our own words. No Cursor-specific config and no license file. Credits live only in `README.md`, the human-facing intro, which names pstack, Matt Pocock's skills, and T3 Code at Dan's request.
- Cooper is built for T3 Code. Headless CLIs (`claude -p`, `codex exec`) are only a fallback.
- Every cooper- skill is manual-only. Cooper reads helpers and principles by path when a step names them.
- Explain to Dan with rendered visuals, and keep the text to what the visual doesn't say.
- Ask Dan with the question tool (`AskUserQuestion` in Claude Code and T3), the recommended option first. The confirm option is labeled **Send it**, and Dan types "send it" to approve. Cooper's rule is **How to ask** in `skills/cooper/SKILL.md`.
- Commit messages are short and lowercase (`add cooper-verify`, `cooper: add perf playbook`). Commit and push only when Dan asks.
- Never print or copy secrets. The 1Password master password lives in `~/.config/agents/1password.txt`; leave it there.

## Fleet layers

Dispatch is a pinned long-running T3 project thread scoped to one repo, with portable state under `.dispatch/<id>/`. It coordinates Cooper worker threads directly with T3 tools. Fleet Control and support remain Grok Bots with their own registry and Executor transport; new Dispatches do not depend on them or participate in cross-project routing. No live stores, bots, installed skills or schedules are migrated by the T3 port.

## Adding or renaming a skill

Do all of these together:

1. Create the folder under `skills/`. Its folder name and `name:` in `SKILL.md` frontmatter match.
2. `disable-model-invocation: true` in the frontmatter unless Dan explicitly requests automatic invocation, as for the automatic personal skills above.
3. `agents/openai.yaml` with the same name and `allow_implicit_invocation: false`, or `true` for an explicitly automatic skill.
4. Add `[skills.<name>] source = "skills/<name>"` to `tags/development.toml` for `cooper` and `cooper-*`, or `loadout.toml` for the requested non-coding set. Personal skills tied to coding-only tooling, such as `personal-vaultwarden`, belong in the development profile. The box gets global skills only. Keep machine-specific destinations in machine layers.
5. Run `loadout validate .` and `loadout plan --loadout .`, then commit and push only when Dan asks. Apply approved changes per `README.md`; do not hand-edit agent links or reintroduce Skills Manager as a second deployment source.
6. Add it to the skills list in `skills/cooper-improve/SKILL.md`, and to `skills/cooper/SKILL.md` if Cooper uses it.
7. Run `unslop` on new prose.

## Cooper and Dispatch's home

Cooper's grills and Orchestrate stores remain in place. Home/repo model YAML files are no longer read, written or deleted. Launch settings live directly at each launching step; scoped explicit user instructions may override a job. `cooper-models` upgrades those skill source declarations.

Dispatch owns `.dispatch/<id>/` inside one repository, never a global instance lookup. The store ID derives from the initial thread's exact ID; metadata separates that immutable identity from the current owner and generation. Markdown board, journal, decisions, briefs, reports and explicit Wayfinder maps are Git-shareable. Read `skills/dispatch/references/project-state.md` for the format, save/share and explicit takeover protocol, privacy exclusions, and inaccessible-worker recovery. Git is not a distributed lock. No silent adoption or concurrent writing to another owner's store is allowed.

## Map

**`cooper`**, the front door: `/cooper <goal>`. It sorts the task into one playbook in `skills/cooper/playbooks/`:

| Playbook | For | Ends at |
|---|---|---|
| Investigation | Explain mode: how or why something works. Diagnose mode: the cause of a leak, spin, hang, or glitch from a real capture. | An answer. No changes. |
| Bug | Wrong behavior made right. | A merge-ready PR, merged only if the repo's normal flow merges bug fixes. |
| Feature | New or different behavior. Design checkpoint before code. | A merge-ready PR, unmerged. |
| Refactor | Same behavior, better structure. Pins behavior first. | A merge-ready PR, unmerged. |
| Perf | Fix mode for one slowdown, Climb mode to push a metric over many kept-or-reverted tries. | A merge-ready PR, unmerged. |
| Prototype | Throwaway sketches to settle a design call. | A pick. No PR. |
| Babysit | Getting a PR merge-ready: conflicts, review threads, CI. Waits with T3's `watch_pull_request`. | Merge-ready. Never merges unless told. |
| Orchestrate | A whole program handed to one T3 thread that never writes code: briefs, standing orders, a store of tables in `~/.bob-n-frank/orchestrate/<program>/`, Cooper worker threads in their own worktrees, verifiers on the other model family, drains on a T3 heartbeat. Ported from pstack's Orchestrate. | Merge-ready PRs; merges only if the standing orders allow it. |
| Cleanup | Prunes worktrees and other disk leftovers after an audit; the user picks what goes. | Space reclaimed. |

Cooper babysits every PR he opens unless told not to, and replies to human reviewers and bots without asking. Dan chose both.

`skills/cooper/references/benchmark-checklist.md` vets every performance number. `skills/cooper/references/visuals.md` makes replies visual-first: in T3 Cooper draws most replies and every checkpoint as an HTML page (`html_preview`, then `html_render`) and keeps the text to what the picture doesn't say. Every playbook's Reply names what to **Show**.

**Helpers** Cooper runs from playbook steps:

- `cooper-how`: how code works.
- `cooper-why`: why it was built that way, from every evidence source.
- `cooper-architect`: two designers on different model families, a judge, a merged sketch.
- `cooper-adversarial-review`: reviewers on different models attack a diff. Previously `bob-adversarial-review`, originally `bob-interrogate`.
- `cooper-blast-radius`: what a change breaks outside its diff, with its safety fact proven by running code.
- `cooper-grill`: settles every open decision with the user before complex, risky, or unclear work. It maps the decisions as a tree, asks each round's ready questions with recommendations through the question tool, looks facts up instead of asking, and saves the result to `~/.bob-n-frank/grills/<slug>.md`. Cooper runs it in Feature (before design), Bug, and Refactor when unsure; Dispatch runs it before dispatching an item with open decisions. Not in Orchestrate for now. Adapted from Matt Pocock's grilling skill.
- `cooper-no-comments`: Comment Sicko, a read-only subagent on the other family, lists every comment to kill; Cooper deletes them, fixes the code each `MUST KILL` flag blames, and encodes claimed constraints as types, tests, or lint without asking. Runs first at Review whenever a diff touches comments or suppressions. Ported from pstack's `no-comments` and its Comment Sicko agent, with the Sicko read-only so a child never edits Cooper's worktree.
- `cooper-sharpen`: rewrites a prompt so it asks for a deeper version of the task, not a bigger one, and hands back only the rewrite. Ported from pstack's `sharpen` as of 0.15.29, where it stopped doing the task itself.
- `cooper-verify`: writes and maintains a repo's own `cooper-verify-<app>` skill (committed in that repo at `.claude/skills/cooper-verify-<app>/`, symlinked from `.agents/skills/`). Cooper uses it when driving an app and only offers to create one.

**Principles**: 24 `cooper-principle-*` skills, one folder each so only the needed one loads. `skills/cooper/SKILL.md` lists them with triggers; standing rules and playbook steps cite them by short name.

**`cooper-models`** inventories hardcoded model/options/provider-family declarations in the actual launching skills, checks enabled T3 instances, and upgrades approved source sites and examples together. There is no runtime model registry or YAML override layer. `skills/cooper/references/delegation.md` owns transport and live provider-instance resolution. Preserve existing model choices until the user approves an upgrade; a disabled generic provider instance is not evidence its whole family is unavailable. See `docs/hardcoded-models-validation.md`.

**`cooper-improve`**, its own front door because it changes skills or repos, not product code:

- Reflect: three reviewers read a session and propose skill edits.
- Eval: tests a skill change blind.
- Models: recommends source-declaration upgrades from session evidence. It does not apply them; cooper-models handles approved edits.
- Correct: makes a repo's repeated agent mistakes impossible (architecture, then types, then lint, then tests), proven against a real past mistake.

**`dispatch`** is the long-running project coordinator. Its existing `dispatch-*` setup/decompose/chase/digest structure and local event/report/explicit Wayfinder playbooks remain. The canonical board and running journal live in `.dispatch/<id>/`; the optional inline T3 board derives from Markdown, with Now, Backlog, What landed, Watch and links. New Wayfinder maps and decision resolutions live in the store, with optional tracker mirrors. Cooper workers notify the current exact Dispatch owner via T3 and never edit its store. See `docs/dispatch-t3-validation.md` for checks and limitations.

## Decisions and why

- **Historical, superseded 2026-10-29: every role had a model line since 2026-10-12.** Dan first kept lines to panels and judges, then asked to set every model up for success after comparing with pstack-t3, which resolves every role from a roles file. Still no named-model indirection and no single effort knob.
- **Superseded 2026-10-29: `models.yaml` was data, not Markdown.** Dan approved hardcoding each role's model/effort in its launching skill and retaining cooper-models to upgrade those source declarations. Existing user files stay untouched.
- **Principles are separate skills,** like pstack, so Cooper loads only the one a step needs. A single combined file was rejected.
- **Verify skills live in each repo.** Only the generator is global.
- **Auto-babysit, with review replies.** Dan wants PRs handed back merge-ready. Merging still needs his say-so.
- **Decided stays decided (2026-10-19).** In the CrabStock payment stack (#84–#94), workers redesigned around blockers without asking: Kafka swapped for Postgres polling when librdkafka wouldn't build, a provider fallback Dan had dropped, a split ledger, production's outflow cap set to 0, another service's infra edited during a restack. `skills/cooper/SKILL.md` now names the calls that stay Dan's (stored data shape, transport, providers, money values, other teams' infra, shared contracts, anything he already decided). Briefs carry DECIDED, Review runs a decision check on every diff, PRs list **Decisions made here**, and Orchestrate holds a departure as `needs-decision` with a gate. Everything outside that list stays Cooper's to decide, per the 2026-10-13 complaint that Cooper asked too much.
- **"Adversarial review", not "interrogate".** It reviews code; it doesn't question the user.

## Where we stopped

Ported: pstack's main skill and its Feature, Bug, Investigation, Refactor, Perf (with hillclimb and benchmark checklist), Prototype, Babysit, runtime and trace forensics (as Diagnose); `how`, `why`, `architect` (with `arena` folded in), `interrogate`, `blast-radius`, `reflect`, eval, `correct`, `setup-pstack` (as `cooper-models`), `create-verification-skill` and `maintain-verification-skill` (as `cooper-verify`), all 24 principles, `no-comments` with Comment Sicko (as `cooper-no-comments`), `sharpen` (as `cooper-sharpen`), `ketchup`, and `unslop`.

**Next:** dry-run `/cooper` on a small task in a throwaway repo, and fix what that turns up through `/cooper-improve`.

**Parked, Dan unsure:**

- `figure-it-out` (a playbook for jobs no other playbook fits) and `show-me-your-work` (an auditable decision log). Refactor and Perf currently stop and propose a split when a job is too big.
- Run (pstack's Autonomous run), Shipping, Autopilot-stack, and Autopilot-full. Run and Shipping were ported, then removed on 2026-10-12 until needed; Orchestrate keeps its own Land step. Hold until Cooper has earned trust on watched runs. Autopilot-full merges on its own, which clashes with Cooper's never-merge rule.
- `in-your-own-words`: restates the user's goal and problem before any work, with no playbook. Cooper's playbooks already restate; undecided since 2026-10-15.
- Pause safely and Session pickup. T3 threads already hold much of that context.
- Formal verification (pstack's `create-formal-verification-skill` and `maintain-formal-verification-skill`, added in 0.15.26 to 0.15.28). They prove one property of a risky piece of code (races, retries, leases, state machines) in every case within a bound, TLA+ by default, and leave a skill in the repo with a sync commit for upkeep. If ported, they'd become two more `cooper-verify` playbooks. Parked 2026-10-19: not needed yet.

**Skipped on purpose:** `automate-me` (one-time use), `swarm` (T3 delegation covers it), `tdd` (the Bug playbook and `cooper-principle-test-behavior-not-implementation` cover it), `teach` and `recall` (`cooper-how`, `cooper-why`, and T3 history cover them), `bro` (its one line is inlined in `ketchup`), `poteto-help`, `technical-writing`, `typescript-best-practices`, `make-bot-ui`, Visual parity, Worktree cleanup, and Multi-phase plan.

## PostHog's lessons, parked (2026-10-14)

PostHog posted 38 lessons from building their AI products ([thread](https://x.com/posthog/status/2109706421919248499)). The full comparison with Cooper is in [this doc](https://claude.ai/code/artifact/0b8b1ab0-eb10-4142-a150-053caffbd604). Ranked takeaways, none built yet:

1. **Freeze features and run Cooper on real work.** Watch a few real runs end to end before adding more skills. (Habit; matches **Next** above.)
2. **Turn failures into evals.** `cooper-improve reflect` saves each bad session as a case, and `cooper-improve eval` replays the cases before a skill change ships.
3. **Count lookups as missing skills.** Add a line to REPORT in `skills/cooper/references/brief.md` for what the thread had to look up or wished it had.
4. **Cut subagents back to where they pay.** PostHog keeps readers on the parent model to share its cache. Dan doesn't mind either way, so the read-only roles keep Sonnet in their launch declarations.
5. **Cost per thread.** Report tokens and dollars per thread so Dispatch can show spend.
6. **Keep the harness thin.** Fewer rules in prompts, more of the model's own judgment. (Habit.)
7. **Drift check after merges.** Fleet Control flags skills that name files, flags, or tools that no longer exist.
8. **Worked examples.** Add one short real run to each playbook.

#3 and #5 are the cheapest to build, as two new REPORT lines plus a Dispatch roll-up.

## Known gaps

- Nothing has been run. Expect wording that reads fine and fails in practice.
- The model picks came from research on 2026-10-12 (benchmarks, speed, pstack-t3's defaults). Recheck the hardcoded choices with `/cooper-models` as T3 capabilities and session evidence change; no model upgrade follows from catalog availability alone.
- T3 issues tracked by the launch guidance; failures remain visible gates rather than reasons to switch transport:
  - #16808: `delegate_task` fails with `parent_not_active` from a background subagent.
  - #17548: a child's settle hook runs in the parent's worktree.
  - #17809: background subagents stay "Running".
  - PR #16595: an options override replaces the inherited options instead of merging with them.
- Babysit outside T3 falls back to `gh pr checks --watch`, which blocks the session.

## Porting source

pstack lives in `github.com/cursor/plugins` under `pstack/`. A clone was at `/tmp/cursor-plugins` and may be gone; clone it again to keep porting. Ported from `d73344b` (2026-10-09); updates to the skills we ported were brought over through `99743e9` on 2026-10-15 (four principles restated as reasoning, `correct`'s test step, `cooper-verify` readiness, Cleanup's base branch, Orchestrate's one-stacker rule). Reviewed through `88d4751` (0.15.29) on 2026-10-20, which brought `sharpen` and `ketchup` over. To catch up again, diff from `88d4751` and take only changes to skills we already have. Its main skill is `skills/poteto-mode/` and its playbooks are under `skills/poteto-mode/playbooks/`. Prior art for running pstack inside T3: `github.com/uzairansaruzi/p3-stack`.
