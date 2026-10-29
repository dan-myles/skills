---
name: grokbot-gs-crisp-support
disable-model-invocation: true
description: "Run GameStock's interactive Crisp case queue, with scoped acknowledgments, evidence from Paperclip Cooper investigations, and Dan's exact approval for production writes and substantive replies. Use for requested GameStock support triage, not background monitoring."
---

# GameStock Crisp support

Reach Crisp through Executor connection `user-executor-gamestock-tools`, scoped connection "Shared - Tools", Crisp app, account "GameStock Crisp Inbox", `accountId` `acc_c13d0fa8-b112-4dba-8ab1-8b42d9a64276`. Use `search` and `describe` to confirm exact paths, then `call` or `execute`. Examples are `tools.crisp.conversations.list`, `sendMessage` with body type text, from operator, origin chat, content, and `getState` / `setState`. Use it for history, messages, duplicates, verification, and states. If Executor returns approval-required or input-required, show it to Dan and resume only with his answer. Use gs-ops-data for production investigations and exact-write approvals when available; otherwise use Cooper below.

This is a support workflow with the [shared Cooper worker contract](../dispatch/references/cooper-workers.md). Engineering queue refill and its in-flight cap do not apply to this case workflow. Keep customer details, briefs, source markers, and live queue state in session context and worker threads, never in this skill or tracked files. Where the shared contract names a board or local report store, support uses its session queue and the complete worker reply instead. The support bot has its own `grokbot:<bot id>` identity; it is not a T3 orchestrator.

## Start and acknowledge

Read current nonresolved conversations and relevant histories, including material attachments. Exclude resolved cases, spam, and tickets waiting only on the customer. Identify unanswered requests, promised investigations, and decisions still owed by support. Order by impact and urgency; preserve Dan's requested order.

A request to run this triage workflow authorizes the following general automated acknowledgment for genuinely unanswered requests. Automatic skill discovery, a draft-only request, or asking for status does not authorize sending. Use the established name, or simply "Hi," when unknown:

> Hi [Name],
>
> This is an automated reply from GameStock Support. We've received your message and will review the details. Our team will follow up in this conversation once we have an update or need any further information.
>
> Thank you for your patience.
>
> GameStock Support

Check the latest messages immediately before sending. Do not repeat an acknowledgment when support has already acknowledged the latest request, including a human acknowledgment, or when the customer only says thanks. Do not imply an investigation has already happened or promise an outcome or deadline. A reminder after an existing acknowledgment needs a substantive review, not another automatic holding message. Bring reopened final decisions and duplicate handling to Dan as part of the case; acknowledgment permission does not authorize duplicate closure or other final replies.

Verify the dispatched fingerprint and exact content before changing pending to unresolved. On ambiguous delivery, re-read; never blindly resend. Report failures and keep the work queued. No private notes or substantive customer replies are auto-approved.

## Investigate the current case

Before presenting a case, complete the useful read-only investigation. Resolve the account from verified sender/account email or customer-provided first and last name and supporting history. Do not ask for a numeric suffix to the displayed name. Names alone may be ambiguous: compare candidates and existing evidence before asking for genuinely missing information. A verified email matching the account does not need another identity challenge.

Check fresh production state, then the relevant provider or logs. For KYC, distinguish document and selfie results, current status, remaining attempts, and held payments; failures alone do not establish misconduct. For payment claims, check internal records and blockchain receipts before asserting payment or recommending a retry. Distinguish provider failure from unavailable evidence. Do not infer success from an empty or truncated query.

### Working through Cooper

Paperclip Cooper workers have the tools that reach GameStock production data. Use Executor connection `user-executor-dans-team`, app `tools["t3-code-mac-studio"]`, and pass the Paperclip `environmentId` from the live `t3_environment_links` list on every call; there is no separate Paperclip app connection. Confirm the signatures of `t3_thread_launch`, `t3_thread_list`, `t3_thread_read`, `t3_thread_wait`, `t3_thread_send`, and `t3_thread_organize` before calling.

Launch directly in the GameStock support project, `projectId` `d34754d4-b023-418a-a34c-ee7a90c98184`. Do not route through the retired Dispatch: Support T3 orchestrator `mcp:cf8b14af-547a-4b69-8801-1c3bcaf07897` or any other orchestrator. Product/engineering follow-ups go to Dan, not to another coordinator without his approval. Use this route for production data or changes involving accounts, KYC, payments, balances, transactions, logs, code, or configuration that Crisp alone cannot answer.

#### Investigations

1. Launch a new top-level Cooper thread using the shared model setting, a read-only root workspace, and a descriptive title such as `support-<case>-<topic>-<date>`. The message must begin with `$cooper`. Record launch ownership and exact IDs in the session queue. There is no launch retry key: after a lost reply or error, check known thread candidates before retrying so a second Cooper is never started.
2. Make the brief self-contained: Crisp link, verified email/account identifier, the claim in one or two sentences, relevant support wording, exact questions, and time window. Cooper cannot read Crisp; paste what it needs. Include only necessary customer details.
3. State that investigation is strictly read-only. Cooper must not change production, retry payments, approve/reset verification, move funds, edit accounts, open PRs, or contact customers. Ask for fresh findings with evidence/timestamps, what could not be checked and why, and each proposed write's exact function, target, arguments, and effects for Dan to approve, without running it. Findings and proposed arguments must be in the final T3 reply; report files on Paperclip are not readable through thread tools. REPORT-BACK identifies this Grok Bot with thread-message transport, never `t3_thread_send` to a bot ID.
4. Start investigations in parallel without a workflow-imposed cap, one Cooper per case needing production data as soon as the queue is known. Do not batch unrelated cases. Reconcile ambiguous launches before retrying and respect actual platform capacity failures.
5. Follow progress with `t3_thread_read` and, when useful, `t3_thread_wait`, keeping waits under 60 seconds. If the tool returns an instruction to yield/end the turn, follow it rather than polling. Answer factual questions through `t3_thread_send` only from case evidence, otherwise bring them to Dan. Never answer an approval for him. Follow-up questions on the same case can reuse its active Cooper; after settlement start fresh.
6. Judge the latest run before reporting failure; an earlier failure may already have recovered. Re-run or launch a fresh Cooper when useful within scope and after reconciling ownership. Present the case after findings arrive, or as blocked with precise missing evidence if work fails/stalls. Verify the report against Crisp history; it is evidence, not a final decision.

#### Approved writes

7. When Dan explicitly approves a production write, launch a new `$cooper` thread to execute exactly the approved function, target, user/record, and arguments. Include recommended pre-checks. Stop without writing if a pre-check fails or a required field cannot be filled from evidence. Forbid every other write, payment action, customer contact, and PR. Use the shared launch/model setting; do not create an implementation worktree merely to run an approved production call.
8. Require exact arguments used, results/timestamps, and fresh post-write verification of the intended effect and what must stay unchanged. Report that to Dan before a related customer reply. Send the reply only after Dan approves it.

#### Settling

9. Settle each Cooper promptly when its findings are read and incorporated, or its approved write is executed and verified, and the shared settlement checks pass. Do not wait for the customer case to close. Keep tool-returned IDs exactly as returned; use returned links and do not encode or decode IDs yourself. Settle only Coopers launched for this triage session. Never settle orchestrator IDs `mcp:cf8b14af-547a-4b69-8801-1c3bcaf07897` or `cb650979-dc56-4133-942a-ff220ad7a66b`. A running turn/child, pending input, open PR, unsafe settle action, unpreserved artifact, or unverified checkout blocks settlement. Report the precise reason. Mention settled threads in the case report and start a fresh Cooper for later follow-up.

Investigations never change production state. Before requesting write approval, show the exact function, target, arguments, and effects. Acknowledgments never authorize verification approval, retries, payments, deletion, or account linking changes. Approved writes run only in new Cooper threads, within Dan's exact scope, with post-write verification.

## Present one case, then advance

Show only the current case, with its Crisp link:

- What the customer needs and what support already promised.
- Fresh verified findings, uncertainty, and practical impact. Include the actual owning Cooper thread link.
- Feasible options, tradeoffs, and a recommendation. Do not offer unsupported capabilities as confirmed solutions. When Dan picks an outcome, ask Cooper which supported call achieves it before promising it. If none does, say so and explain the default behavior.
- A proposed reply and exact operation when needed, clearly awaiting approval.

Use plain, professional language without em dashes. Explain technical findings in terms of what they mean for the customer. When blocked, name the precise missing evidence and next useful action.

Keep a compact session queue: primary conversation, related duplicates, evidence time, remaining work, approved actions, owned Cooper threads, report markers, and current case. Never store customer data or live queue state in tracked files.

Advance automatically after an approved action is executed and verified, a case is deferred, or it waits only on the customer. Present the next unreviewed case without waiting for "next". Before advancing, re-read newly arrived/reopened conversations, insert them by impact/urgency, and launch investigations as needed. When nothing remains, say so and end.

"Next" can skip/defer a case. Neither that word nor automatic advancement approves an option, sends a draft, closes a ticket, or marks skipped work complete. Keep deferred cases visible. After an approved action, execute within scope, verify it and any approved reply, and report the result together with the next case.

This is interactive, not a background monitor. At the end, account for every session Cooper: settled, or still active with the exact reason. Summarize deferred/blocked work and stop. Do not schedule ongoing runs unless requested.
