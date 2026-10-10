---
name: ship
disable-model-invocation: true
description: "Dan's delivery pipeline. Routes a task to the Feature, Bug, or Investigation playbook, copies its steps into the todo list, and runs them to verified work with evidence. Manual-only: `/ship <goal>` in Claude Code, `$ship <goal>` in Codex. Adapted from pstack's poteto-mode."
---

# Ship

Take a goal from "here's what I want" to verified work with evidence. The playbook holds the process. The repo holds the commands.

## Start

1. Read the repo's agent rules: `AGENTS.md`, `CLAUDE.md`, and any nested ones for the area you touch. Its commands, test policy, commit style, and PR skill override anything generic here.
2. Match the task to one playbook.
   - **Investigation.** A read-only question: how does X work, why is Y this way, should we do X or Y, or the user said not to change code. `playbooks/investigation.md`.
   - **Bug.** Something that should work and doesn't. `playbooks/bug.md`.
   - **Feature.** New or changed behavior. `playbooks/feature.md`.

   No clean fit: take the closest, say in one line what doesn't fit, and skip the steps that don't apply.
3. Open the todo list with the playbook's steps copied in verbatim, before any task-specific items. A step you don't do stays in the list as `skip: <reason>`.
4. "new task" from the user means match again from step 2. Short follow-ups like "do it" or "continue" carry on the current playbook.

## Rules for every playbook

- **Smallest change that solves it.** Delete before you add. No speculative abstractions, flags, or code that "might help".
- **Root causes, not symptoms.** Ask why until you reach the mechanism.
- **Name the data shape before writing logic.** Encode the domain in a structure (a typed model, a state machine, a table) instead of scattered conditionals.
- **Prove it works on the real surface.** Compiling and passing unit tests don't prove user-facing behavior. Wrong surface or inconclusive is not a pass. Say so.
- **Every claim carries its evidence or a label.** Measured, read in code (`file:line`), or a guess.
- **Candor.** If the premise is wrong or an idea doesn't earn its place, say so.

## Autonomy

Proceed without asking on reversible work: reading, editing in a branch or worktree, running checks, local commits, and delegating to subagents.

Pause for irreversible or outward-facing steps: force-pushes to shared branches, deploys, data deletion, messages to other people, and every **Checkpoint** a playbook names.

Don't ask a question you can answer by running something. Ask only for product or preference calls, with a recommended default.

## Subagents

Use the harness's subagent tool when it has one.

- Brief with a specific scope: files, the named data shape, success criteria, and the repo rules that apply. Point at files instead of pasting them.
- Pick the model by difficulty. The strongest model takes cross-cutting design and subtle logic. A faster model takes mechanical edits.
- Send broad searches and bulk output to subagents. Keep summaries in the main thread.
- You own the result. Review the diff yourself and write your own summary.
- New work goes to a fresh subagent with the full brief. Resume one only when the work needs its live state, such as uncommitted changes or a running process.
- No subagent tool: do the work yourself, then review the diff as if a stranger wrote it.

## Review

A non-trivial diff gets a fresh-context review before the PR. Non-trivial means several modules, a few hundred lines, or anything touching auth, money, stored data, or a public API. The reviewer sees only the brief and the diff. When the harness offers a second model family, run the same review there too. Agreement is high signal. Fix each finding or rebut it with a reason. Small, obvious diffs skip review with `skip: <reason>`.

## Opening the PR

Feature and Bug end here.

1. Run the repo's fix and check commands (format, lint, typecheck, tests, generated output) until they pass.
2. Make small, ordered commits, each one landable, with conventional commit titles unless the repo says otherwise. Keep them small even when the repo squash-merges. They make review easier.
3. Use the repo's PR skill when it has one. Otherwise run `gh pr create` and open the PR ready, not as a draft.
4. Write the PR body as why, what changed, scope (what it leaves out), and verification. Keep it short and apply the unslop skill.
5. Merge per playbook. A bug fix follows the repo's flow, merging when that's how the repo works. A feature stops at an open PR even when the repo's PR skill would merge. Stop before that step and hand back the link.
6. Opening a PR doesn't start a babysit. Post the link and finish.

## The reply

- Lead with the outcome. Short declarative sentences. Apply the unslop skill.
- Each playbook names what its reply must carry. Don't drop a section to stay brief.
- Say who the change is for and what they'll notice, then what the next maintainer inherits.
- Link only what you produced or read this session. Give PR links in full.
- When an explanation has several moving parts and the harness can render a diagram or HTML page, show it visually.

## Credits

Adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan, MIT licensed. See `LICENSE-pstack`.
