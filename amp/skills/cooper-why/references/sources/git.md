# Source: git and PRs

## What's here

Commits (messages, authors, dates, diffs), PR bodies with their review threads, inline comments and TODOs, decision records, tests whose names reveal edge cases, files that changed together, changelogs, and ticket IDs in messages. It's tied directly to the code and always available, which makes it the most reliable source.

## How to search

Widen the commit list from the anchor:

```bash
git log --follow --oneline -- <file>        # history through renames
git log -S '<exact text>' -- <file>         # commits that added or removed this text
git log -G '<regex>' -- <file>              # same, by pattern
git blame -L <start>,<end> <file>           # last commit per line
git show <hash>                             # one commit's full diff
```

For every commit that matters, read its PR:

```bash
git log -1 --format=%B <hash>
gh pr view <n> --json title,body,author,mergedAt,labels,closingIssuesReferences,comments,reviews,files
```

Review comments and threads usually carry more than the body.

Check what lives beside the code:

```bash
rg -l -i 'decision|adr' --glob '*.md'                  # decision records and design notes
rg -n -C2 '(TODO|FIXME|HACK|XXX|NOTE)' <file>          # notes near the target
rg -l '<symbol>' --glob '*test*'                       # tests that pin the behavior
```

## Strong evidence

- A PR body that names the problem, not just the change
- A review thread where alternatives were argued
- A comment next to the target explaining a constraint
- A test named after the edge case that forced the code
- A commit referencing a ticket or incident

## Traps

- **Squash merges** erase branch commits. Fall back to the PR body and comments.
- **Commit messages that undersell.** "Small refactor" can hide a deliberate behavior change. Read the diff.
- **Copied patterns.** If the pattern first appeared elsewhere, investigate that first commit.
- **Bot commits.** Dependency bumps and automated backports carry no intent. Skip them.
- **The code itself.** A function's name isn't evidence of why it exists.

## Return

Every relevant commit, PR, or comment: the exact quote, its hash, PR number, or `file:line`, author and date, and whether it's direct or circumstantial.
