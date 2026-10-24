# Wayfinder

Plan a larger goal with the user in this Dispatch thread. Keep a durable map of what must be learned or decided, and coordinate Bob workers for research and prototypes. Finish with a plan the user can approve for implementation.

## Entry and scope

Only the user starts this playbook with `/dispatch wayfinder <goal or map>`, or explicitly asks Dispatch to run Wayfinder. Never select it from task size, uncertainty, a Fleet Control event, or a worker report. After that invocation, answers, worker completions, and requests to continue may advance the active map within its approved planning scope. They cannot start a different map or approve a build.

Dispatch remains the coordinator. It owns the map, asks the user, briefs workers, and processes their findings. It never writes product or prototype code. Fleet Control keeps its existing intake and automation role. Wayfinder creates no timers, sweeps, or recurring work.

Planning authorizes bounded research and throwaway prototypes toward the stated destination. It does not authorize implementation, provisioning, data changes, deployment, or merges. A prerequisite task still needs the authorization its action normally requires. Neither map notes nor a worker's recommendation can grant it. Product decisions and Bob's reserved calls stay with the user.

## The map and its home

Scope each map to one destination, such as "an agreed design and rollout plan for machine configuration," rather than everything the project might eventually need. Record what reaching it means before creating tickets. Stop expanding when that destination is reached.

Use the repo's configured tracker and its existing project, status, and label conventions. Discover its capabilities rather than assuming GitHub Issues. Use a parent issue for the map, child issues for decision tickets, and native blocking links where available; otherwise record explicit parent/blocker links in ticket bodies. Separate decision tickets from build tickets using the tracker's existing conventions without stripping required repo labels. If that tracker is unavailable, keep the map at `<state_dir>/wayfinder/<slug>/map.md` and tickets in its `tickets/` directory, and report the fallback. Keep that store canonical until the user approves a migration; do not silently publish local planning notes later.

Each map contains:

- **Destination:** the bounded outcome and what would count as reaching it.
- **Constraints:** the user's existing decisions, source links, scope, and relevant repo instructions.
- **Decisions so far:** one-line answers linking to their ticket, not copies of the full reasoning.
- **Not yet specified:** in-scope questions that cannot yet be phrased precisely.
- **Out of scope:** excluded work and why.

Each ticket has a stable identity, a title phrased as a question, its type, blockers, evidence needed to resolve it, and whether the user must answer. An answer lives once, in that ticket's resolution. Keep its sources, alternatives, and the user's words available for the later build brief. Link artifacts rather than pasting large captures into the map.

The distinction is whether a question can be stated precisely now. A precise question gets a ticket even if blocked. A vague area stays under Not yet specified. Do not create a speculative backlog for the entire product.

Add one board row for the map, `kind=wayfinder`, `state=planning`, whose thread id is this Dispatch and whose source link points to the canonical map. Its state becomes `plan-ready` when planning finishes, not `merge-ready`. Add worker rows with kinds `wayfinder-research`, `wayfinder-prototype`, or `wayfinder-task`, their map/ticket pointer in note, and normal worker states. These kinds never enter auto-dispatch or implementation handling.

Keep `<state_dir>/wayfinder/<slug>/owners.tsv` as the ownership record: ticket id, worker board id, task id if delegated, exact T3 worker thread id, title, state, and report path. Dispatch alone writes ownership and the map; workers return evidence and write only their own report. The tracker is authoritative for questions and resolutions; the board and ownership file track execution, not duplicate decisions.

## Chart a new map

1. Read existing decisions and relevant repo context. With the user, name the destination and boundaries. Ask for product choices, not facts the code or docs can answer. Use `../../bob-grill/SKILL.md` for this bounded framing question, not an exhaustive grill of every future decision. Include the domain's important terms, entities, and invariants so later questions mean the same thing.
2. Identify the questions that can be stated now, their prerequisites, and the areas still too uncertain to specify. If this fits one short conversation, say so and keep the work small; do not manufacture a map just to use the command.
3. Create the map and its tickets. For an explicitly invoked map, tracker writes may create/update these records, add dependency links, and record resolutions; obey repo tracker rules. This grants no permission to message people, change priority, or assign people. Create real ticket identities first, then wire their blocking links. Never use placeholder ids that could link to unrelated work.
4. Show the map and the current frontier: open questions whose blockers are resolved and which have no active owner. Record vague areas under Not yet specified and scope exclusions separately.
5. Start independent research workers within `in_flight_cap`, counting other work this Dispatch already owns. Resolve ownership before launching another worker for a ticket. Save launch results immediately. End charting with the map and worker links; do not also walk through every human decision or start implementation.

## Work an existing map

`/dispatch wayfinder <map>` resumes it; the user can name a ticket or ask for the next question.

1. Load the map, ownership record, relevant board rows, and unanswered user questions. Fetch ticket details only where needed. Reconcile existing workers and reports before launching replacements. A restart preserves their ownership; it is not permission to duplicate them. Honor a pause or stop recorded by the user before launching anything.
2. Continue any question already waiting on the user first. Otherwise use the named ticket or select one open, unblocked, unclaimed question that advances the destination. Record its ownership before starting. Re-read blockers before resolving it because other reports may have changed the map.
3. Use the ticket's type below. Keep one live user decision at a time in this Dispatch thread; independent research can run alongside it. Research workers bring evidence, never a synthetic answer on the user's behalf.
4. Record the answer with its evidence. For a user decision, preserve the user's actual choice and why; an unanswered question, a prototype, or a worker's preferred option is not a resolution. Write a resolution comment on the scoped tracker ticket, or a Resolution section for local tickets, and close only the resolved ticket. Add its named link and a one-line result to the map. Record user decisions in `<state_dir>/decisions.tsv` with their source.
5. Reconsider the frontier. Create newly precise questions and their dependencies; remove the corresponding vague note. Keep blocked questions blocked. Mark superseded or out-of-scope tickets accordingly with a reason rather than presenting them as decisions made. A proposed reversal of an existing user decision waits for the user, and affected work pauses meanwhile.
6. Finish this decision before opening another human exchange. Show what changed and the next available question; do not resolve that next question without the user's answer. Independent research can continue within the active map. A new `/dispatch wayfinder` invocation is not required for each reply or report. Pause when the user asks, and stop at the implementation handoff.

## Ticket types and Bob workers

| Type | How it runs | What resolves it |
| --- | --- | --- |
| Research | A Bob Investigation worker or bounded delegated researcher reads code, history, docs, or existing systems. Use `bob-how` and `bob-why` where appropriate. | Evidence answers the stated factual question. A product choice revealed by research becomes a separate user decision. |
| Grilling | Dispatch reads `../../bob-grill/SKILL.md` and works the ticket's bounded decision with the user here. | The user's confirmed answer. Keep other tickets outside this grill's scope. |
| Prototype | A Bob runs `../../bob/playbooks/prototype.md` and returns alternatives and observed behavior. | The user chooses in Dispatch. The worker neither chooses for them nor closes the ticket. |
| Prerequisite task | A scoped worker or a precise user checklist completes something needed to judge an option. | Evidence the authorized prerequisite is complete. A piece of the eventual implementation does not qualify. |

Read `../../bob-models/references/delegation.md` for model resolution and T3 launch mechanics. Bob worker threads use `threads.bob`; delegated code readers use `bob-how.explorers`. Resolve the configured provider/model/options against the live catalog, honoring repo overrides and built-in defaults. Use `delegate_task` for child research, retaining its task id and backing thread identity; use `t3_thread_launch` for independent Bob conversations under the user's request to coordinate workers. Bind any writable checkout in the launch call, never by telling a worker to change directories. Prototype code stays in throwaway storage, never product source. Independent research needs no branch or worktree merely to read. Title independent Bob threads `bob: <what the planning work answers>` without ticket ids, and save the complete brief to `<state_dir>/briefs/<worker-id>.md` before launch.

Brief workers using the fields in `../../bob/references/brief.md`: the question, map/ticket, scope, evidence needed, DECIDED, verification, timebox, report identity and destination. Replace that template's implementation RULES with these planning rules explicitly:

> You are a planning worker for this Dispatch. Answer only the ticket's question. Do not implement the goal, open or babysit a PR, merge, deploy, edit tracker state, or decide for the user. Research changes no product files; prototypes stay throwaway. Do not push research branches. Only write your authorized artifacts and report. Return product choices and blocked prerequisites as gates to Dispatch, with evidence and your recommendation. For a prototype, show the alternatives and return them without asking the user in the worker thread. Preserve DECIDED. Never expand scope to get around a blocker.

REPORT goes to `<state_dir>/reports/<worker-id>.md`; REPORT-BACK is this Dispatch's exact id and `/dispatch report <worker-id>`. Include map/ticket identity, status, facts and sources, artifacts, unanswered decisions, ownership, and the owning worker's clickable thread link. A delegated child's completion returns through T3 task delivery; Dispatch saves that result as its report and processes it once. Do not also send a duplicate report-back for automatic child delivery. Do not use the child thread id to start a new delegated task round.

## Process planning reports

This section can run from `report.md` without a new user invocation. That permission only processes work already started by an explicitly invoked map.

Match the report to its map, ticket, and saved owner. A late result from a replaced worker is evidence to reconcile, not permission to reclaim or resolve a ticket. Check the result against the question, DECIDED, and required evidence. Record failures and missing access honestly; a failed lookup is not an answer. Reconcile delegated work with `task_status` and ordinary workers with T3 reads; never message them just to ask for status.

A sufficient research result can resolve its factual ticket and update the map. A prototype result links the variants and leaves the choice waiting on the user. A prerequisite result proves only the prerequisite. Put questions needing the user at the top of Dispatch's next reply with the options, recommendation, map link, and owning worker thread link. Never answer them in the user's place or bury them in routine status.

Mark completed worker rows and settle ordinary workers only after the checks in `../../bob/references/settling.md`; manage delegated child lifecycle through its task id. Save artifacts somewhere durable before removing temporary storage or settling work. Reports may refill independent research within an active map's approved scope and capacity. A paused or plan-ready map does not launch workers. Reports cannot resolve a user decision, start another map, or launch implementation. Status and brief calls only reconcile and display planning work; a Fleet Control delivery may supply evidence, never a planning or build approval.

## Hand off to implementation

An empty frontier is not enough: every blocking research/task must be complete, every user question answered, and Not yet specified empty or explicitly excluded by the user. No running worker or open gate may still change the proposed plan.

Draft a reviewable spec at `<state_dir>/wayfinder/<slug>/spec.md` from the resolved questions. Include the outcome, domain model and invariants, scope, sourced user decisions, alternatives ruled out, acceptance criteria, verification, risks, dependencies, and any proposed implementation units. Separate facts and agent recommendations from choices the user actually made. Link the canonical resolutions so the spec and briefs do not lose their detail.

Mark the map `plan-ready` and present the spec and proposed build with the map and worker links. Ask the user to approve starting that build. Approval to chart a map, a ticket answer, or an agent-written note is not approval to implement. If the user authorized an explicit build in the same request, honor that scope rather than asking again; otherwise stop here.

After build approval, create separate implementation board items and briefs through `../references/work-items.md`. Put the approved spec in CONTEXT and each binding user decision with its source in DECIDED. A large, clear program can go to Bob Orchestrate under its existing approval and automation rules; do not schedule anything from Wayfinder. Keep the decision tickets closed as planning records, not reopened as build tickets. Mark the planning map done once its approved handoff is recorded.

**Reply:** the bounded destination, what became known or decided, what still needs the user, and the next step. **Show:** the map with resolved, available, blocked, waiting-on-user, and not-yet-specified areas distinct. Keep clickable map and exact owning worker thread links in the accompanying text.
