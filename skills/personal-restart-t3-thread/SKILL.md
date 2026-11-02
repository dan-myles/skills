---
name: personal-restart-t3-thread
description: "Restart a T3 thread's provider session so it reloads its MCP servers, then continue the thread with a given prompt. Use when a thread needs MCP tools that were added or authorized after its session started (for example Dan just approved a new MCP server), or when Dan asks to restart a T3 thread so it picks up new MCP connections. Works on this thread (through a temporary helper thread) or on another thread."
---

# Restart a T3 thread's session

T3 reuses a thread's Claude session across messages, so a message in any mode, including `t3_thread_send` with `mode: "restart"`, keeps the old MCP connections. A thread can't restart its own active run either: that send fails with "Claude-pool cannot redirect an active run".

T3 ends the session only when it detaches it. It does that for two reasons, recorded on `provider-session.detached` events: "Thread settled." (`t3_thread_organize` `settle`) and "Workspace changed." (`t3_worktree_handoff`). The thread's next run then attaches a fresh session, which loads MCP servers from scratch. So the restart is: settle the thread, wait for the detach, unsettle it, send the continuation. The new message also unsettles the thread on its own; unsettle first anyway, so a failed send doesn't leave it settled.

Verified on Claude threads (`claude-pool`) on 2026-11-02, read-only from T3's event log: settle and detach at 19:01:16Z, a new message at 19:03:05Z, then `provider-session.attached`, after which the new MCP tools were available. The reattached session kept the same `providerSessionId` string, so confirm the restart by an attach event with a later sequence, not by a new id. Other providers weren't checked: report what their events show and don't promise a reload.

## Watch the event log

[`scripts/session_events.py`](scripts/session_events.py) reads `~/.t3/userdata/statev2.sqlite` (`orchestration_events`) read-only. A thread's events have `stream_id` equal to its T3 `threadId`. Run it with `python3 -I`, using the absolute path of the installed skill folder:

- `mark --thread <id>` prints the newest event `sequence` and the thread's latest session event. Take it before anything that could detach the thread.
- `wait --thread <id> --after <sequence> --event provider-session.detached [--reason "Thread settled."] [--timeout 600]` exits 0 with the matching event, or 2 on timeout with the thread's latest session event. Use `--event provider-session.attached` to confirm the new session.

Never write to this database, and never edit or restart T3 to force a detach. When the target lives on another machine, run everything there: pass that `environmentId` to the T3 tools and launch the helper in the same environment, so the script reads that machine's database.

## Inputs

- **Target:** a T3 `threadId` (this thread when unnamed) and its `environmentId` if it's on another machine.
- **Continuation:** the prompt the fresh session should run, written for an agent that sees the thread's history but none of your current turn's tool output. Say what changed (for example "the executor-gst-crabstock MCP server is now authorized") and what to do next. When nobody gave one, use "Your session restarted to reload MCP servers. Confirm the new tools are available, then continue where you left off."

Invoking this skill authorizes the settle, unsettle, and continuation message on the target, and, for a self-restart, the one temporary helper thread below. It doesn't authorize interrupting someone else's run.

## Another thread

1. `t3_thread_read` the target (`runLimit` 3, low `limit`). When a run is active, stop and report it. Interrupt it only when Dan asked for that explicitly. A thread waiting on Dan's input or approval counts as active.
2. `t3_queue` `list` on the target. A queued message keeps it active, so the settle won't apply. Report it and stop, unless Dan says to cancel it or fold its text into the continuation.
3. `mark` the target. When its latest session event is already `provider-session.detached`, or it has none, its next run attaches fresh: skip to step 5. Otherwise `t3_thread_organize` `settle` it.
4. `wait` for `provider-session.detached` after the mark. On a timeout, unsettle the target, report its latest event, and stop.
5. `mark` again, `t3_thread_organize` `unsettle` the target, then `t3_thread_send` the continuation with `mode: "auto"` and a `clientRequestId`.
6. `wait` for `provider-session.attached` after the second mark (`--timeout 120`). Report the detach and attach times and the reasons. If no attach shows, say so; don't claim the reload.

## This thread

The thread can't settle while its turn runs, so a helper thread finishes the job after this turn ends. No scheduled message.

1. `t3_queue` `list` with no `threadId`. If anything is queued, the settle won't apply: report it to Dan and stop. Cancel only a message you queued yourself for this restart, or when Dan says to.
2. `mark` this thread.
3. `t3_thread_launch` the helper: `scratch: true` (it edits no code), the same `environmentId` as this thread, `title: "restart <short target title>"`, and the helper brief below with every placeholder filled. Note the link it returns.
4. `t3_thread_organize` `settle` with no `threadId`. It applies at turn end.
5. End the turn now with one short line saying the session will restart and the helper's link. Start no other tool calls, sends, or background work after the settle, since anything still running keeps the thread active.

### Helper brief

```text
You are a temporary helper that restarts one T3 thread's provider session so it reloads MCP servers. Do only this.

Target thread: <threadId>  (environmentId: <id or "this machine">)
Mark taken by the target before it settled: <sequence>
Event script: python3 -I <absolute path>/scripts/session_events.py
Continuation prompt, send verbatim:
---
<continuation>
---

1. Run `t3_thread_wait` on the target with timeoutMs 600000 so its current run finishes. Then run the script's
   `wait --thread <threadId> --after <sequence> --event provider-session.detached --reason "Thread settled." --timeout 300`.
2. On a timeout, read the target with `t3_thread_read` and check its queue with `t3_queue list`. Don't interrupt it,
   cancel anything, or send it the continuation. Leave it as it is, report what blocked the detach, and stop.
3. After the detach: `mark` the target, `t3_thread_organize unsettle` it, then `t3_thread_send` the continuation with
   mode "auto" and clientRequestId "restart-<threadId>-<sequence>".
4. Run `wait --after <new mark> --event provider-session.attached --timeout 120` and report the detach and attach
   times and the target's link.
5. When the attach is confirmed, `t3_thread_organize settle` this helper thread. On any failure, leave the helper
   unsettled so Dan sees it.
```

## Edge cases

- **The settle never takes effect:** usually a queued message, a failed turn, or work still running. The helper times out and reports. Nothing retries on its own.
- **Dan or another thread sends to the target between the settle and the detach:** that message unsettles it and runs on a session that may still be the old one. Report it and ask before trying again.
- **"Workspace changed." instead of "Thread settled.":** a worktree handoff detached the session. It still counts as a fresh session on the next run, so report the reason and continue.
- **A new MCP server that needs Dan's approval:** the restart only reconnects to servers T3 or Claude already allows. Say which tools the continuation found missing; don't approve servers on Dan's behalf.
