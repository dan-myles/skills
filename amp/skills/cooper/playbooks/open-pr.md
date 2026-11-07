# Open PR

Turn finished work in this checkout into a ready-for-review PR, then babysit it so the user comes back to a full PR: checks green, the AI reviewers' one round answered. Feature, Bug, Refactor, and Perf end here on their own; skip it only when the user or the task said not to open a PR. It also runs when the user asks ("open the PR", "ship this", "put it up").

1. **Find the work.** Read `git status`, the branch's commits since its base, and any PR already open for the branch (`gh pr view`). Name the base: the user's target, an existing PR's base, or the branch the work was cut from. When the records disagree, ask. An open PR means this run updates it rather than opening a second one. Leave out changes that aren't part of this work, and say which.
2. **Review.** Run **Review** in the skill on the whole diff, unless it already ran in this thread on this same diff. Work the user or another session wrote gets the full Review too.
3. **Check.** Run the repo's fix and check commands (format, lint, types, tests, generated files) until they're clean.
4. **Commit.** On the base branch, branch first; keep a branch the harness or brief already named. Split the work into small commits that each stand on their own, in an order that tells the story. Use conventional commit titles unless the repo says otherwise. Do this even when the repo squash-merges, because it helps the reviewer.

   When the diff holds more than one of these kinds of change, put each kind in its own stack layer, bottom to top, skipping any that would be empty:
   1. **Prep:** renames, moves, and deletions that change no behavior.
   2. **Generated:** codegen, dependency bumps, migrations, shared types.
   3. **The change:** one layer per component (data, backend, frontend). A risky piece gets its own layer, so reverting it leaves the rest.
   4. **Tests:** the integration, end-to-end, and regression tests that prove the change.
   5. **Docs:** READMEs, guides, the changelog, agent instructions.

   Each layer passes the repo's checks and reads without the layers above it. A doc that records a decision (an ADR, ARCHITECTURE) stays in the layer that carries the decision out. A fix of a few dozen lines with its test stays one PR.
5. **Open it** with the repo's PR skill if there is one, letting it own what it covers (tickets, titles, stack linking). If not, use `gh pr create`. Open it ready for review, never as a draft. Prefer several narrow PRs to one large one; when they depend on each other, open them as a GitHub stack with `gh stack`, not as branches based on each other by hand:
   - `gh stack init <bottom> ... <top>` adopts the branches bottom to top, and `gh stack add <branch>` adds a layer on top. Pass `--base` when the base isn't the default branch.
   - `gh stack submit --auto --open` pushes every layer, opens one PR per layer based on the layer below, and links them as a stack. Without `--open`, `--auto` opens drafts. Then write each PR's title and body with `gh pr edit`.
   - Check it with `gh stack view`: every layer has its PR, in order.

   Put this thread's URL (`https://ampcode.com/threads/<T-id>`) at the end of every PR body, so Amp links the PR to this thread.
6. **Write the body so a reviewer opening the PR understands the change in under a minute, visually.** The picture comes first and the text only says what the picture can't. Use `##` headings in this order, leaving out any with nothing to say. When the repo's PR skill has its own body format, use that and fold these in where they fit, still pictures first.
   - **Why:** the user's goal, then the problem and the approach, one to three sentences.
   - **Architecture:** every PR gets an architecture diagram of what it modifies, as a ```` ```mermaid ```` block, which GitHub renders in the PR. Draw the architecture of the side it changes: for a backend change (services, APIs, data, queues, infra), the services, stores, and queues it touches and how requests or data flow between them; for a frontend change, the routes, screens, components, and state or data hooks it touches and how data reaches the UI. A full-stack change shows both, joined at the API. Highlight what this PR adds or changes with a `classDef`, with a legend line under the diagram. Keep it to the part a reviewer needs, not the whole map. Check that it parses before posting: `npx -y @mermaid-js/mermaid-cli -i <file>.mmd -o /tmp/<file>.svg`.
   - **Proof:** the playbook's final check, posted, not described. Command output goes in as text blocks, trimmed to what proves the claim. Screenshots and recordings are for frontend changes only, where someone sees the result on a screen; a backend, API, CLI, or infra change posts its command output and nothing else. They're uploaded with `gh`'s `--attach` (on `gh pr create`, `gh pr edit`, or `gh pr comment`): reference each file in the body as `![<caption>](./<file>)` and `gh` swaps in the uploaded asset. Images sit before next to after, each captioned; videos play inline. For perf, one number as before → after; the runs, range, and limiter go in the details or a linked artifact. Failures and checks you couldn't run are listed too.
   - **What changed:** one to three bullets, then the file map as a text tree, per **File maps** in `references/visuals.md`.
   - **Scope:** what it covers and what it deliberately leaves out.
   - **Tradeoffs:** only alternatives a reviewer would ask about.
   - **Decisions made here:** each choice the request or design didn't settle, with why. One that touches a decided or reserved call names where the user approved it.
   - **Blast radius:** who or what it touches, and why that's safe. `cooper-blast-radius`'s safety fact goes here.

   No SHAs, no file-by-file lists, no walls of text. Run `unslop` on it.
7. **Babysit it.** Put `playbooks/babysit.md`'s Drive steps on the todo list and run them until the PR is merge-ready, with one AI review round. Skip this only when the user said not to ("don't babysit", "just open the PR").
8. **Stop at merge-ready.** Merge only when the user says to, even if the repo's PR skill would merge; stop before that step. The one exception is a bug fix in a repo whose normal flow merges fixes once they're ready: follow that flow.

**Reply:** the owning worker's clickable thread link per **Review handoffs** in the skill, the PR link, its base, what Review found and what changed because of it, and Babysit's status: the PR's state, what was fixed and dismissed, and what needs the user. Include the owning thread in review-ready status updates too. **Show:** the file map of what the PR changes, and for a stack, the PRs bottom to top with each one's state and owning worker link.

**End-of-work reply:** follow the [required recap](../references/visuals.md#required-end-of-work-recap): the diagram and the built-work recap first, then concise caveats and handoff links. This also applies when this playbook ends in a PR or babysit handoff.
