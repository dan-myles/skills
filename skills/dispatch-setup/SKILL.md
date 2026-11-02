---
name: dispatch-setup
disable-model-invocation: true
description: "Onboard a repository to the shared Beads graph and initialize, resume, or explicitly take over its Dispatch root from a T3 project thread. Verify thread identity, client compatibility, database access and worker access; pin the coordinator when supported."
---

# Setup

Read the [Dispatch role](../dispatch/SKILL.md) and [project-state contract](../dispatch/references/project-state.md). Setup is the only Dispatch mode that may run `bd init` or touch server accounts, and only for this repository.

1. **Identity.** Verify the current exact thread ID from T3 context or `t3_thread_list`'s `currentThreadId`, then `t3_thread_read` it. Read its project with `t3_project_read` and compare the repository with the current checkout. Do not infer identity from a title, account, branch, or working directory alone. Missing identity/access stays a setup gate, with no onboarding or launch.
2. **Client.** Check `bd version`. A missing or older client than the database expects is a gate: the loadout installs it; never work around a schema refusal per project-state.
3. **Inspect.** Run `bd where` and `bd context` in the checkout, read any committed `.beads/config.yaml` and `.beads/metadata.json`, and list legacy `.dispatch/` stores. Change nothing yet. Report legacy stores and offer migration; never adopt or modify one silently.
4. **Join an onboarded repository.** When `.beads/` is committed with server mode, never re-init. Verify `bd context` shows server mode and the committed database, then `bd ping`. Skip to step 6.
5. **Onboard a new repository.** The shared server is Stapler's Dolt, `stapler.tail156535.ts.net:3307`, unless Dan names another. Confirm it answers before anything else.
   - Choose a short issue prefix and database name for the repository. List the server's databases (`dolt --host <host> --port <port> --user beads --password '' --no-tls sql -r csv -q 'SHOW DATABASES'`) and confirm the name is unused; `bd init` creates it, and would silently reuse another project's database of the same name.
   - In a clean, up-to-date `main` checkout (or a dedicated checkout from `origin/main` when the current branch has other work), run `bd init --server --external --server-host <host> --server-port <port> --server-user beads --database <db> --prefix <prefix> --skip-agents --skip-hooks --non-interactive`. Leave `agent.profile` at its default and `node_id` unset. bd commits its files itself.
   - Verify `bd where`, `bd context` (server mode, the new database) and `bd ping`.
   - Review bd's commit with `git show --stat HEAD` and its diff: only `.beads/config.yaml`, `.beads/metadata.json`, `.beads/.gitignore`, `.beads/README.md` and bd's root `.gitignore` block. No credentials, hosts with tokens, `node_id`, `AGENTS.md`, `CLAUDE.md`, agent settings or hooks. Check the root `.gitignore` patterns (`*.db`, `.dolt/`) don't hide files the repo tracks or needs; if they do, stop and ask. Remove anything else bd generated.
   - Amend that commit to `onboard Beads tracking [skip ci]` and push it to `main`: fetch first, never force-push or change protection settings. A rejected push is a reported blocker, not a retry with more force.
6. **Root.** Resume the unique `dispatch` root assigned to `dispatch:<this thread>`, or the explicitly named one. Multiple owned roots need a selection. Roots owned by other threads are shown with their owners; offer an independent root or explicit takeover. For takeover, perform the complete procedure in project-state. For a new root, create the pinned `dispatch` epic with its identity metadata, the ownership source, and the working rules (existing defaults plus sourced standing orders and any user-supplied validator selection), assigned to `dispatch:<this thread>`.
7. **Workers.** Verify the available T3 thread/project/read/send tools and worker launch model selection through live capabilities. Remote routing uses `t3_environment_links` only when needed, followed by the same-repository project check and a `bd context` check in that checkout; a remote checkout that is not joined yet needs step 4 there. Do not launch a worker merely to test setup, change model policy, or create schedules/bots.
8. **Pin** this coordinator with `t3_thread_organize` and `action: "pin"`, explicitly naming its ID. Record the outcome honestly; a missing pin tool leaves a manual pin step for the user. Do not rename, settle, archive, or retarget another thread.
9. **Present** the [board](../dispatch/references/board-page.md), reconciling only already-known accessible workers. Report the database, root ID, owner, access gaps, legacy stores found, and the onboarding commit if one was made.
