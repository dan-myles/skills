# Source: error tracking

Sentry, Rollbar, Bugsnag, or whatever records exceptions.

## What's here

Grouped issues with counts, first-seen and last-seen times, affected releases, individual events with stack traces and tags, release records, session replays, and engineer comments. For defensive code (a check, a catch, a retry, a fallback), this is often where the direct cause lives.

What it adds most is timing: an error appeared, peaked, and stopped right after the release that shipped the target.

## How to search

1. **Orient.** Find the organization and project if you don't know them.
2. **Search issues** by the exception types the target handles, the function or file name, and error messages it checks for.
3. **Check timing** on each candidate: first seen, last seen, affected releases, and the shape of the count over time. Does last seen line up with the target's release?
4. **Open an event.** Does the stack trace pass through the target? Do tags and breadcrumbs match what the code guards against?
5. **Match releases** to the PR's merge date.
6. **AI root-cause summaries** are hypotheses, not evidence. The events and traces are the evidence.

## Strong evidence

- An issue first seen just before the PR and last seen just after
- Stack traces landing in the target function
- A comment on the issue from the PR author
- The PR or commit linking the issue
- A high-volume issue that stops after the release containing the target

## Traps

- **Regrouping.** A rename can move the "same" error to a new issue. If one ends abruptly, look for a new one starting.
- **Releases bundle many changes.** An error stopping at a release doesn't prove the target fixed it.
- **Upstream fixes.** Errors sometimes stop because something else changed.
- **"Resolved" is a button.** People mark issues resolved without any code change.
- **Sampling.** Low counts may just mean heavy sampling. Record it when unsure.

## Return

Per issue: ID and title, project, first and last seen, event count (and sample rate if known), affected releases, a short exact stack-trace excerpt showing the link, how its timing lines up with the target, a link, and any author notes.
