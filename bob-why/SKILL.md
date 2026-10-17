---
name: bob-why
disable-model-invocation: true
description: "Find out why code is the way it is: design rationale, why an option was picked, what caused a regression, postmortems, and where a threshold came from. Searches every evidence source the session can reach (git and PRs, tickets, docs, chat, telemetry, error tracking, analytics) in parallel and returns a cited answer that separates fact from inference. For how code behaves at runtime, use `bob-how`."
---

# Why

`bob-how` explains what code does. `bob-why` explains the forces that shaped it.

Work like a careful investigator. Keep what the record says apart from what you infer. `references/confidence.md` defines the confidence levels and the wording for each. The synthesizer must follow it.

## 1. Pin down the target and the question

The **target** is usually code, a pattern, a feature, or a named decision. The **question** is usually about rationale, a tradeoff, an edge case that forced a design, an outside constraint, dead code, or the history of an area.

If the target is vague, infer it from the conversation (open files, recent edits, what was just discussed). Say what you picked in one line so the user can redirect, then continue.

## 2. Anchor it in the code

Before starting investigators, collect:

- the file paths and line ranges
- the key symbols
- the recent commits that touched the target
- PR numbers from merge commits, and ticket IDs from commits and PR bodies

```bash
git blame -L <start>,<end> <file>          # last commit per line
git log --oneline -20 -- <file>            # recent history, PR numbers in subjects
git log --follow -p -- <file>              # full history through renames
git log -1 --format=%B <commit>            # full message, ticket IDs
gh pr view <n> --json title,body,author,mergedAt,labels,closingIssuesReferences,comments,reviews
```

This anchor goes to every investigator.

## 3. Investigate in parallel

Check which tools and MCP servers this session can reach. Sort them into these evidence sources:

| Source | What it tends to explain | Guide |
|---|---|---|
| Git and PRs | Rationale written down at review time. Always available. | `references/sources/git.md` |
| Tickets | The product or business reason behind the work | `references/sources/tickets.md` |
| Docs | Design reasoning written before the code | `references/sources/docs.md` |
| Chat | Decisions argued out in conversation and never written up | `references/sources/chat.md` |
| Telemetry | Production conditions the code reacts to (timeouts, retries, limits) | `references/sources/telemetry.md` |
| Error tracking | The exceptions that led to defensive code | `references/sources/errors.md` |
| Product analytics | Usage data, experiments, and where a number came from | `references/sources/analytics.md` |

Start one investigator subagent per source that's reachable, on `bob-why.investigators` in `~/.bob-n-frank/synara/models.yaml`, all at once, one source each. Each one gets:

1. the brief in `references/investigator.md`
2. that source's guide
3. `references/sources/incidents.md` too, when the target looks defensive (null checks, retries, timeouts, rate limits, feature flags, resource guards)
4. the anchor from step 2
5. the user's question

Investigators need the same tool access you have, including MCP servers, but they must not write or change anything.

Skip a source only with a written reason, and list it in the answer:

- **Not reachable.** No tool covers it in this session. This is a gap in coverage, not a choice.
- **Provably irrelevant.** For example, no runtime telemetry exists for a build script. "Probably irrelevant" is not enough.

If the target is one small commit and its PR already answers the question fully, you may answer directly. Say that you did, and why the other sources wouldn't add anything. This should be rare.

Without subagents, work through the sources yourself one at a time, following the same guides.

## 4. Synthesize

Start one synthesizer subagent on `bob-why.synthesizer`, with the same tool access so it can spot-check citations. Give it every investigator's findings (empty results and skipped sources included), the anchor, the question, `references/confidence.md`, and `references/synthesizer.md`.

## 5. Present

Give the user the synthesizer's answer. You can tighten it or add context from the conversation. Don't change its confidence wording.

The answer follows the structure in `references/synthesizer.md`. Keep facts and inferences in separate sections. List every source, one line each, including the empty and skipped ones with the reason.

In T3, present it as a rendered HTML page per `../bob/references/visuals.md`, never as text alone: a timeline of the decisions and the evidence behind each, with its confidence marked.

When the question is a lead-in to changing the code, end with a short plan input under four headings: **Keep**, **Change**, **Avoid**, **Risk**.

## Trap to avoid

The newest commit isn't the whole story. Most code is the sum of several older decisions. Follow it back.
