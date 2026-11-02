# Wayfinder

Verify current root ownership and a reachable Beads graph per [project state](../references/project-state.md) before any write or worker action. A takeover preserves map decisions and worker attempts; unknown prior-user access remains a gate.

Plan a larger goal with the user in this Dispatch thread. Keep a durable map of what must be learned or decided, and coordinate Cooper workers for research and prototypes. Finish with a plan the user can approve for implementation.

## Entry and scope

Only the user starts this playbook with `/dispatch wayfinder <goal or map>`, or explicitly asks Dispatch to run Wayfinder. Never select it from task size, uncertainty, an external event, or a worker report. After that invocation, answers, worker completions, and requests to continue may advance the active map within its approved planning scope. They cannot start a different map or approve a build.

Dispatch remains the coordinator. It owns the map, asks the user, briefs workers, and processes their findings. It never writes product or prototype code. Wayfinder creates no timers, sweeps, or recurring work.

Planning authorizes bounded research and throwaway prototypes toward the stated destination. It does not authorize implementation, provisioning, data changes, deployment, or merges. A prerequisite task still needs the authorization its action normally requires. Neither map notes nor a worker's recommendation can grant it. Product decisions and Cooper's reserved calls stay with the user.

## The map and its home

Scope each map to one destination, such as "an agreed design and rollout plan for machine configuration," rather than everything the project might eventually need. Record what reaching it means before creating tickets. Stop expanding when that destination is reached.

The map is an `epic` under this Dispatch's root, labelled `wayfinder`, so another user sees the complete planning history in the graph. Its tickets are its children, created with `--no-inherit-labels`: `decision` for questions the user answers (also labelled `human`), `spike` for research and prototypes, `task` for prerequisites, all labelled `wayfinder`. Real blockers are `blocks` dependencies, so the frontier is what `bd ready` shows under the map. If the user also uses an external tracker, follow its conventions and link scoped mirror records with `--external-ref`; discover capabilities rather than assuming GitHub Issues. Do not publish restricted notes or silently migrate existing tracker-canonical or legacy Markdown maps; preserve their source and gate missing shareable evidence.

The map epic's description contains:

- **Destination:** the bounded outcome and what would count as reaching it.
- **Constraints:** the user's existing decisions, source links, scope, and relevant repo instructions.
- **Not yet specified:** in-scope questions that cannot yet be phrased precisely.
- **Out of scope:** excluded work and why.

Decisions so far are its closed children, not a copied list. Each ticket's title is a question, with its type, the evidence needed to resolve it, and whether the user must answer, in its description. An answer lives once, in that ticket's closing comment and reason. Keep its sources, alternatives, and the user's words there for the later build brief. Link artifacts rather than pasting large captures.

The distinction is whether a question can be stated precisely now. A precise question gets a ticket even if blocked. A vague area stays under Not yet specified. Do not create a speculative backlog for the entire product.

The map epic is in_progress while planning and gets `plan-ready` when planning finishes, never `merge-ready`. A research or prototype worker claims its ticket under the [worker contract](../references/cooper-workers.md), so the ticket's assignee and `t3.*` metadata are its ownership record. These tickets never enter auto-dispatch or implementation handling. Dispatch alone writes the map and resolves tickets; workers write only their claimed ticket per [Cooper's Beads rules](../../cooper/references/beads.md).

## Chart a new map

1. Read existing decisions and relevant repo context. With the user, name the destination and boundaries. Ask for product choices, not facts the code or docs can answer. Use `../references/decisions.md` for this bounded framing question, not an exhaustive grill of every future decision. Include the domain's important terms, entities, and invariants so later questions mean the same thing.
2. Identify the questions that can be stated now, their prerequisites, and the areas still too uncertain to specify. If this fits one short conversation, say so and keep the work small; do not manufacture a map just to use the command.
3. Create the map epic and its tickets, then wire their blocking links. For an explicitly invoked map, external tracker writes may create/update mirror records, add dependency links, and record resolutions; obey repo tracker rules. This grants no permission to message people, change priority, or assign people in that tracker. Create real mirror IDs before linking them. Never use placeholders that could link to unrelated work.
4. Show the map and the current frontier: ready tickets under the map with no assignee. Record vague areas under Not yet specified and scope exclusions separately.
5. Label the research tickets `approved`, with a comment citing this map invocation, and start independent workers within the root's in-flight cap, counting other work this Dispatch already owns. Resolve ownership before launching another worker for a ticket. Save launch results immediately. End charting with the map and worker links; do not also walk through every human decision or start implementation.

## Work an existing map

`/dispatch wayfinder <map>` resumes it; the user can name a ticket or ask for the next question.

1. Load the map epic, its tickets and their assignees, and unanswered user questions. Fetch ticket details only where needed. Reconcile existing workers and reports before launching replacements. A restart preserves their ownership; it is not permission to duplicate them. Honor a pause or stop recorded by the user before launching anything.
2. Continue any question already waiting on the user first. Otherwise use the named ticket or select one open, unblocked, unclaimed question that advances the destination. Assign it before starting. Re-read blockers before resolving it because other reports may have changed the map.
3. Use the ticket's type below. Keep one live user decision at a time in this Dispatch thread; independent research can run alongside it. Research workers bring evidence, never a synthetic answer on the user's behalf.
4. Record the answer with its evidence. For a user decision, preserve the user's actual choice and why; an unanswered question, a prototype, or a worker's preferred option is not a resolution. Write the resolution as the ticket's closing comment, with the user's exact words and source for a decision, then update an authorized tracker mirror if present, and close only the resolved ticket.
5. Reconsider the frontier. Create newly precise tickets and their dependencies; remove the corresponding vague note from the map description. Keep blocked questions blocked. Close superseded or out-of-scope tickets with `dropped` or `bd supersede` and a reason rather than presenting them as decisions made. A proposed reversal of an existing user decision waits for the user, and affected work pauses meanwhile.
6. Finish this decision before opening another human exchange. Show what changed and the next available question; do not resolve that next question without the user's answer. Independent research can continue within the active map. A new `/dispatch wayfinder` invocation is not required for each reply or report. Pause when the user asks, and stop at the implementation handoff.

## Ticket types and Cooper workers

| Type | How it runs | What resolves it |
| --- | --- | --- |
| Research | A Cooper Investigation worker reads code, history, docs, or existing systems. It uses `cooper-how` and `cooper-why` where appropriate. | Evidence answers the stated factual question. A product choice revealed by research becomes a separate user decision. |
| Grilling | Dispatch reads `../references/decisions.md` and works the ticket's bounded decision with the user here. | The user's confirmed answer. Keep other tickets outside this grill's scope. |
| Prototype | A Cooper runs its Prototype playbook on T3 and returns alternatives and observed behavior. | The user chooses in Dispatch. The worker neither chooses for them nor closes the ticket. |
| Prerequisite task | A scoped worker or a precise user checklist completes something needed to judge an option. | Evidence the authorized prerequisite is complete. A piece of the eventual implementation does not qualify. |

Read the [shared worker contract](../references/cooper-workers.md) for T3 discovery, launch settings, and reports. Every planning worker is a Cooper T3 thread. Dispatch never uses a native subagent or delegate_task for repo work. Every planning worker, read-only research included, gets its own T3 worktree in the launch call, per the worker contract. Prototypes stay throwaway inside that worktree, never pushed to product branches. Write the brief onto the ticket and record its assignee and launch result before launching another worker for that ticket.

Brief workers using the fields in `../references/cooper-workers.md`: the question, map/ticket, scope, evidence needed, DECIDED, verification, timebox, report identity and destination. Replace that template's implementation RULES with these planning rules explicitly:

> You are a planning worker for this Dispatch. Answer only the ticket's question. Do not implement the goal, open or babysit a PR, merge, deploy, edit external tracker state or any Beads issue beyond claiming, noting and commenting on your ticket, or decide for the user. Research changes no product files; prototypes stay throwaway. Do not push research branches. Only write your authorized artifacts and report. Return product choices and blocked prerequisites as gates to Dispatch, with evidence and your recommendation. For a prototype, show the alternatives and return them without asking the user in the worker thread. Preserve DECIDED. Never expand scope to get around a blocker.

REPORT is the complete T3 worker reply, also posted as a comment on the ticket, with REPORT-BACK identifying the exact current Dispatch owner thread and attempt using t3-thread transport. The worker never closes or resolves its ticket; Dispatch does after processing. Include map/ticket identity, status, facts and sources, accessible artifacts, unanswered decisions, ownership, and the actual worker link.

## Process planning reports

This section can run from `report.md` without a new user invocation. That permission only processes work already started by an explicitly invoked map.

Match the report to its map, ticket, and assignee. A late result from a replaced worker is evidence to reconcile, not permission to reclaim or resolve a ticket. Check the result against the question, DECIDED, and required evidence. Record failures and missing access honestly; a failed lookup is not an answer. Reconcile workers with T3 reads; never message them just to ask for status.

A sufficient research result can resolve its factual ticket and update the map. A prototype result links the variants and leaves the choice waiting on the user. A prerequisite result proves only the prerequisite. Put questions needing the user at the top of Dispatch's next reply with the options, recommendation, map link, and owning worker thread link. Never answer them in the user's place or bury them in routine status.

Close processed tickets with a guarded reassign, and settle workers only after the checks in `../references/cooper-workers.md`. Save artifacts somewhere durable before removing temporary storage or settling work. Reports may refill independent research within an active map's approved scope and capacity. A paused or plan-ready map does not launch workers. Reports cannot resolve a user decision, start another map, or launch implementation. Status and brief calls only reconcile and display planning work; an external delivery may supply evidence, never a planning or build approval.

## Hand off to implementation

An empty frontier is not enough: every blocking research/task must be complete, every user question answered, and Not yet specified empty or explicitly excluded by the user. No running worker or open gate may still change the proposed plan.

Draft a reviewable spec as the map epic's design field (`--design-file`) from the resolved tickets. Include the outcome, domain model and invariants, scope, sourced user decisions, alternatives ruled out, acceptance criteria, verification, risks, dependencies, and any proposed implementation units. Separate facts and agent recommendations from choices the user actually made. Name the ticket IDs behind each point so the spec and briefs do not lose their detail.

Label the map `plan-ready` and present the spec and proposed build with the map and worker links. Ask the user to approve starting that build. Approval to chart a map, a ticket answer, or an agent-written note is not approval to implement. If the user authorized an explicit build in the same request, honor that scope rather than asking again; otherwise stop here.

After build approval, create separate implementation issues under the root, `discovered-from` the map, through `../references/work-items.md`. Put the approved spec in CONTEXT and each binding user decision with its source in DECIDED. A large, clear program can go to Cooper Orchestrate under its existing approval and automation rules; do not schedule anything from Wayfinder. Keep the decision tickets closed as planning records, not reopened as build tickets. Close the map once its approved handoff is recorded.

**Reply:** the bounded destination, what became known or decided, what still needs the user, and the next step. **Show:** the map with resolved, available, blocked, waiting-on-user, and not-yet-specified areas distinct. Keep clickable map and exact owning worker thread links in the accompanying text.
