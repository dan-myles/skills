---
name: dispatch-setup
disable-model-invocation: true
description: "Initialize, resume, or explicitly take over a repository's Git-shareable Dispatch store from a T3 project thread. Verify thread identity, owner, scope, and worker access; pin the coordinator when supported."
---

# Setup

Read the [Dispatch role](../dispatch/SKILL.md) and [project-state contract](../dispatch/references/project-state.md).

1. Verify the current exact thread ID from T3 context or `t3_thread_list`'s `currentThreadId`, then `t3_thread_read` it. Read its project with `t3_project_read` and compare the repository with the current checkout. Do not infer identity from a title, account, branch, or working directory alone. Missing identity/access stays a setup gate, with no store creation or launch.
2. Inspect `.dispatch/` and Git state without changing existing stores. Select the explicitly named store or the unique store currently owned by this thread. Multiple owned stores need a selection. If existing stores belong to other threads, show their identities and offer an independent store or explicit takeover; never adopt one silently. A new store uses the digest of this exact initial thread ID and exclusive directory creation per project-state. No global `~/.bob-n-frank/config.yaml` lookup is involved.
3. For a new store, verify repository scope, record shareable user identity if known, applicable standing orders and their sources, and the existing policy defaults in `store.md`. Initialize an empty `board.md`, `journal.md`, and `decisions.md`. Keep optional directories absent until needed. Confirm Git does not ignore the selected store, without overriding repo ignore policy silently. For resume, verify owner and generation before any mutation. For takeover, perform the complete explicit takeover procedure in project-state instead of initialization.
4. Verify the available T3 thread/project/read/send tools and worker launch model selection through live capabilities. Remote routing uses `t3_environment_links` only when needed, followed by the same-repository project check. Do not launch a worker merely to test setup, change model policy, copy runtime credentials into the store, or create schedules/bots.
5. Pin this coordinator with `t3_thread_organize` and `action: "pin"`, explicitly naming its ID. Record the outcome honestly; a missing pin tool leaves a manual pin step for the user. Do not rename, settle, archive, or retarget another thread.
6. Present initial status from [the board](../dispatch/references/board-page.md), reconciling only already-known accessible workers. Report store path, stable ID, owner generation, Git branch/share status, and access gates. Explain save/share/takeover from project-state. Save state under the repo's normal commit/push policy; setup grants no automatic publication.
