# Captain handoff

Capy Captains own long-running programs. Bob handles a scoped engineering unit and its checks.

1. Summarize the goal, decided calls, proposed units, dependencies, acceptance checks, and current PRs.
2. If this is a Captain assignment, report the proposed split or blocking decision through the crew report flow. Work only the assigned unit using its Bob playbook.
3. In a regular thread, present the handoff for the user's existing Captain. If none exists, explain how a Captain would own the program and ask where to hand it off. Do not create or promote one automatically.
4. For ordinary parallel work inside one unit, use native subagents per `references/runtime.md`, with fresh writers and shared read-only reviewers.

Do not recreate a coordinator board, heartbeat, sweep, scheduled automation, or separate lead skill. Legacy drain/resume requests get this handoff, not a scheduler operation. Never merge without the user's explicit request.
