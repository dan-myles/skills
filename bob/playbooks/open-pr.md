# Open PR

Turn finished work in this checkout into a reviewable PR, then babysit it to merge-ready. It runs only when the user asks ("open the PR", "ship this", "put it up"); no other playbook opens one on its own.

1. **Find the work.** Read `git status`, the branch's commits since its base, and any PR already open for the branch (`gh pr view`). Name the base: the user's target, an existing PR's base, or the branch the work was cut from. When the records disagree, ask. An open PR means this run updates it rather than opening a second one. Leave out changes that aren't part of this work, and say which.
2. **Review.** Run **Review** in the skill on the whole diff, unless it already ran in this thread on this same diff. Work the user or another session wrote gets the full Review too.
3. **Check.** Run the repo's fix and check commands (format, lint, types, tests, generated files) until they're clean.
4. **Commit.** On the base branch, branch first; keep a branch the harness or brief already named. Split the work into small commits that each stand on their own, in an order that tells the story. Use conventional commit titles unless the repo says otherwise. Do this even when the repo squash-merges, because it helps the reviewer.
5. **Open it** with the repo's PR skill if there is one, letting it own what it covers (tickets, titles, stack linking). If not, use `gh pr create`. Open it ready for review, never as a draft. Prefer several narrow PRs to one large one; when they depend on each other, stack them, each based on its parent's branch. In T3, link every PR to the thread.
6. **Write the body** as a briefing a reviewer reads in under a minute, under `##` headings, leaving out any with nothing to say. When the repo's PR skill has its own body format, use that and fold these in where they fit.
   - **Why:** the problem and the approach, one to three sentences.
   - **What changed:** one to three bullets, then the file map as a text tree, per **File maps** in `references/visuals.md`.
   - **Scope:** what it covers and what it deliberately leaves out.
   - **Tradeoffs:** only alternatives a reviewer would ask about.
   - **Decisions made here:** each choice the request or design didn't settle, with why. One that touches a decided or reserved call names where the user approved it.
   - **Blast radius:** who or what it touches, and why that's safe. `bob-blast-radius`'s safety fact goes here.
   - **Verification:** one to three real runs and their results. For perf, one number as before → after; the runs, range, and limiter go in the details or a linked artifact.

   Add screenshots or video when they prove a claim. No SHAs, no file-by-file lists, no walls of text. Run `unslop` on it.
7. **Babysit it.** Put `playbooks/babysit.md`'s Drive steps on the todo list and run them until the PR is merge-ready. Skip this only when the user said not to ("don't babysit", "just open the PR").
8. **Stop at merge-ready.** Merge only when the user says to, even if the repo's PR skill would merge; stop before that step. The one exception is a bug fix in a repo whose normal flow merges fixes once they're ready: follow that flow.

**Reply:** the owning worker's clickable thread link per **Review handoffs** in the skill, the PR link, its base, what Review found and what changed because of it, and Babysit's status: the PR's state, what was fixed and dismissed, and what needs the user. Include the owning thread in review-ready status updates too. **Show:** the file map of what the PR changes, and for a stack, the PRs bottom to top with each one's state and owning worker link.
