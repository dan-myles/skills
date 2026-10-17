---
name: bob-verify
disable-model-invocation: true
description: "Write or maintain a repo's own verification skill, `bob-verify-APP`: how to launch the real app, drive it the way a user does, capture evidence, and clean up, plus a feature map with one recipe per user-facing feature. Create builds it from the codebase and proves it once. Maintain checks every feature against source and drives each one live, then fixes drift in one PR. Manual-only: `/bob-verify [create|maintain]` in Claude threads, `$bob-verify ...` in Codex threads. `bob` offers it when a repo has none."
---

# Verify

Every repo Bob works in needs a scripted way to prove behavior on the surface a user touches. That proof is specific to the repo, so it lives there as its own skill, `bob-verify-<app>`. This skill writes it and keeps it true.

## Where the verify skill lives

- `.claude/skills/bob-verify-<app>/`, committed in the repo it covers. `<app>` is the app's short name. Always the `bob-verify-` prefix, so every verify skill Bob made is easy to find and tell apart from the repo's other skills.
- `.agents/skills/bob-verify-<app>`, a relative symlink to that folder, so Codex finds the same copy.
- It has `SKILL.md` (launch, doctor, drive, evidence, cleanup, helpers) and `features/` (the feature map).
- It's written for an agent reading it cold, mid-task, who has never seen the app. Every command is real and every handle comes from this repo.

## Start

1. Find existing verify skills: `.claude/skills/bob-verify-*/` and `.agents/skills/bob-verify-*/`, or any repo skill with launch and drive steps and a feature map. One without the `bob-verify-` prefix gets renamed to it during Maintain, with every reference to the old name updated.
2. Pick the playbook.
   - **Create.** The repo has none, or the user asks for one for another surface. `playbooks/create.md`.
   - **Maintain.** One exists and the user asks to check it, or a Bob run found it wrong. `playbooks/maintain.md`. With several, ask which.
3. Put the playbook's steps on the todo list exactly as written. Steps you won't do stay on the list, marked `skip: <why>`.

## Rules

- Never edit product code here. When the app doesn't do what the map says, decide whether the map is wrong (fix it) or the app is broken (report it to the user, outside this change).
- Drive only instances this run started. Kill what you started, by PID or session, never by process name.
- Evidence survives cleanup. Check it's still at its named location after teardown.
- Subagents run on your own model and never drive the app; the main thread does all driving.
- Follow the repo's AGENTS.md for branches, commits, and PRs.
- Show replies per `../bob/references/visuals.md`, with short text around them. Ask per **How to ask** in `../bob/SKILL.md`.
