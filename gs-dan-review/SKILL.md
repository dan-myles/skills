---
name: gs-dan-review
disable-model-invocation: true
description: "Review a teammate's GameStock PR end to end as Dan: audit it, draft short texting-style comments, post them after Dan approves the wording, watch for replies and pushes, verify every fix or pushback against the code, wait for green CI, then approve on Dan's go-ahead. Never merges. Manual-only; takes a PR URL, number, or branch. A rules-only audit with nothing posted is `pr-review`; driving your own PR is `pr-ship`."
---

# GS Dan Review

Review someone else's PR from first read to approval, in Dan's voice, on Dan's GitHub account. Every outward step (posting, approving) waits for Dan in this run. A human merges.

Input: a PR URL (GitHub or Graphite), a PR number, or a branch name. Resolve it to `owner/repo#number` with `gh pr view <input> --json number,url,baseRefName,headRefName,headRefOid,author,state,files`. Stop if the PR is merged or closed.

## 1. Review

1. Record `HEAD_SHA` (`headRefOid`), `BASE` (`baseRefName`), the author, and the reviewer login (`gh api user --jq .login`).
2. Save the diff (`gh pr diff <n> > /tmp/pr<n>.diff`) and `git fetch origin <headRefName> <BASE>`. Read changed files at `HEAD_SHA` with `git show <HEAD_SHA>:<path>`, never from the working tree.
3. Run `pr-review` against the PR with `BASE` as the base. Then read the diff for correctness bugs, doc drift, and claims in the PR body that the code does not back up.
4. Check each candidate before keeping it: confirm the evidence at `HEAD_SHA`, look for a nearby precedent, and drop anything a config, ignore file, or rule already settles. Native Swift/Kotlin gets a correctness read only; the TS rules do not apply to it.
5. Link the PR to the thread with `link_pull_request` when that tool exists.

## 2. Draft comments

Write one comment per finding, the way Dan texts a coworker:

- lowercase, short, one idea each; lead with `nit:`, `q:`, or `tiny:` when it fits
- say what is off and where, and offer the fix in a few words; no headers, no bullet lists, no essays
- soften honest uncertainty ("guessing X? if so, fine", "ignore if you had a reason")
- no AI tells: apply `unslop` when it is available
- praise or an overall note goes in the review body, not an inline comment

Anchor every comment to a line on the right side at `HEAD_SHA`. Confirm each line number with `git show <HEAD_SHA>:<path> | grep -n` before drafting. New files: line numbers of the file itself. Modified files: the new-side line.

Show Dan the drafts as a numbered list with file:line and the text. Stop and wait for approval or edits. Do not post without it.

## 3. Post

Post one review with `event: "COMMENT"` and `commit_id: HEAD_SHA`. Never `REQUEST_CHANGES` unless Dan asks.

```bash
gh api -X POST repos/<owner>/<repo>/pulls/<n>/reviews --input /tmp/pr<n>-review.json \
  --jq '{id, state, html_url}'
```

The JSON has `commit_id`, `event`, `body`, and `comments: [{path, line, side: "RIGHT", body}]`. Report the review URL. Never use `gh pr edit` in this repo.

## 4. Watch

Start a `Monitor` (30 min, the max) that polls every 60 s and prints one line per new event:

- inline replies (`pulls/<n>/comments?since=<post time>`), PR conversation comments (`issues/<n>/comments?since=`), and reviews submitted after the post time, skipping Dan's login and logins ending in `[bot]`, deduped by id in a `/tmp` seen-file
- a new head SHA (`NEW COMMIT pushed: <sha>`)
- a state other than `OPEN` (print it and exit)

Wrap every `gh` call in `|| true` so one failed request does not kill the watch. Re-arm on expiry until the run ends. Empty `REVIEW ... COMMENTED:` events are just the wrappers around threaded replies. Ignore them.

## 5. Verify responses

When replies or a push land, check each comment before calling it done:

- **Fixed:** find the change in the new head. For an amended single commit, `git range-diff <old>^..<old> <new>^..<new>`. Otherwise use `git diff <old> <new> -- <paths>`. A fix that landed without a reply still counts. A claimed fix missing from the push does not.
- **Declined:** test the stated reason against the code, config, or docs it cites (for example, tsconfig `include` for a test location, or DESIGN.md for a module-placement rule). A reason that holds is resolved.
- **Deferred to a third party** (owner sign-off, follow-up ticket): open until that happens. If the author signs off on their own exception, check ownership (CODEOWNERS, `git log --format=%an -- <file> | sort | uniq -c`) and surface it as self-approval for Dan to accept or not.
- Flag any claim in a reply that the code contradicts, even on a resolved item.

Keep a table: `# | comment | response | verified`. Post nothing further (corrections, follow-ups) unless Dan approves the exact text.

## 6. CI

Once all comments are handled, wait for checks on the current head in the background:

```bash
until ! gh pr checks <n> 2>/dev/null | grep -qP '\tpending\t'; do sleep 45; done; gh pr checks <n>
```

Skipped checks are fine. Failures block approval. Report them and keep watching; fixing the author's CI is not this skill's job.

## 7. Approve

Give Dan the verification table, the CI result, and any open decisions. Approve only after Dan says to in this run. Then:

1. Re-read `headRefOid`. If it moved past the SHA you verified, go back to step 5 for the new commits.
2. Post `event: "APPROVE"` with `commit_id` set to the verified SHA and a short casual body ("lgtm, thanks for turning these around fast 🙏").
3. Confirm `reviewDecision` and stop the monitor and any background waits.

Never merge, enable auto-merge, or dismiss reviews.

## Stop

On `MERGED` or `CLOSED` at any point, stop every monitor and wait this run started, and report where things stood.
