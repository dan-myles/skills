# T3 → Grok Bot update bridge

A small background process, one per T3 Code environment, that follows T3's live streams and posts every relevant thread update to a Grok Bot webhook. Reports are routed per project. Grok Bot keeps controlling T3 through the remote MCP endpoint; this bridge only reads.

It reports run starts, progress, waiting, needs-input, errors, failures, stops, run completion, settlement, linked pull requests, and thread creation and removal. It does not report worktree creation or branch changes.

Status on 2026-10-29: tested against fixtures (22 tests) and run live, read-only, against T3 `0.1.5-nightly.20261029.3877` on the Mac Studio with delivery held. It has **not** delivered to the real Grok Bot receiver. The receiver's URL, auth scheme, accepted payload, batching, and idempotency behavior are still unknown. See [What is verified](#what-is-verified).

## How it works

```text
T3 server (127.0.0.1:3773)
  orchestration.subscribeShell ── all projects and threads: status, runs, requests, errors, settlement
  orchestration.subscribeThread ── live threads only: messages, commands, file changes, questions
        │  Effect RPC over WebSocket, orchestration protocol 2, read-only bearer session
        ▼
bridge (Node, no dependencies)
  SQLite in the state directory: captured updates + delivery queue + resume cursors, one transaction
        │  standalone reports for state changes; progress batched per thread
        ▼
Grok Bot webhook (POST JSON, Authorization from report.env)
```

- **Shell stream.** One subscription covers every project. Each shell row is compared with the last stored row for that thread. The differences become updates such as `run.started`, `thread.needs_input`, `run.failed`, `run.completed`, and `thread.settled`. Rows are routed by project ID.
- **Thread streams.** The shell does not carry each message or tool call, so live threads also get a detail subscription. Settled items become progress fragments: assistant messages, commands, file changes, todo lists, subagents, and searches. Questions and approvals become needs-input reports. The subscription closes after the thread goes idle.
- **Durability.** Captured updates, the outbox, and the cursor commit together before the chunk is acknowledged to T3. A crash repeats work and loses nothing that T3 can still replay.
- **Delivery.** Reports go out oldest first, one at a time per target. A report is marked delivered only after a 2xx response. Delivery retries independently of the T3 connection, so a queue fills while the receiver is down and drains afterwards.

The client follows T3's own V2 client (`packages/client-runtime`): it mints a ticket, opens the socket, sends `Ack` after each chunk, and pings every 5 seconds. It refuses servers that do not advertise orchestration protocol 2. This is an internal contract, not a public SDK. Recheck it on every T3 upgrade, as [Upgrading T3](#upgrading-t3) describes.

## Setup on a machine

Requires Node 22.13 or newer, for `node:sqlite`, and a running T3 server. On the Studio, that server is the desktop app or `t3 service`. Runtime files stay in `~/.crabstock-dispatch/`, outside Git.

1. **Mint a read-only T3 session.** Use the CLI that matches the server version. On the Studio the `t3` launcher is 0.1.2 and the app is 0.1.5, and `auth session issue` writes the server database directly. So run the CLI bundled with the app:

   ```sh
   APP="/Applications/T3 Code (Nightly).app"
   ( umask 077; set -C
     ELECTRON_RUN_AS_NODE=1 "$APP/Contents/MacOS/T3 Code (Nightly)" \
       "$APP/Contents/Resources/app.asar/apps/server/dist/bin.mjs" \
       auth session issue --scope orchestration:read --ttl 365d \
       --label grokbot-bridge --subject grokbot-bridge --token-only \
       > ~/.crabstock-dispatch/t3-token )
   ```

   Where `t3 --version` matches the server, plain `t3 auth session issue …` works. List sessions with `auth session list` and revoke one with `auth session revoke`. The bridge needs only `orchestration:read`.

2. **Write the config.** Copy [`config.example.json`](config.example.json) to `~/.crabstock-dispatch/bridge/<env>.json` (mode 600). Set the environment key and URL. Give each project that has its own Dispatch a target of its own, and point the project's route at it. `t3-grokbot-bridge check` prints every project ID. With `unmatchedProjects: "ignore"`, projects without a route send nothing. With `report`, they go to `defaults.target` under a slug of their title.

3. **Add the webhook credentials, one pair per target.** Each target names an env file and two variable names. The example keeps them all in `report.env`, the file the legacy `~/.crabstock-dispatch/report` script already sources, so CrabStock keeps the legacy `CRABSTOCK_DISPATCH_WEBHOOK` and `CRABSTOCK_DISPATCH_AUTH` names. Collect each project's URL and full Authorization header value as two separate private secret files, never in chat. Then, per target:

   ```sh
   bin/t3-grokbot-bridge.mjs set-credentials --config <config> --target crabstock \
     --url-file <url-secret-file> --auth-file <auth-secret-file>
   ```

   The auth file holds the header value, such as `Bearer <key>`. A pasted `Authorization:` prefix is dropped. The command writes the file with mode 600 and single-quoted values, keeps other variables, and never prints values. The bridge rereads it before each attempt, so no restart is needed. Only `https` URLs are accepted. A target without credentials holds its own queue and leaves the others alone.

4. **Check, then test once.** `check` verifies the token, protocol, routes and credential readiness and sends nothing. `test-send --target <name>` posts one clearly fake `bridge.setup_test` report (`item: "setup-test"`, `status: "test"`) and prints only the HTTP status. Run it only with Dan's go-ahead, since it reaches the real receiver.

5. **Run.** In the foreground: `node --no-warnings=ExperimentalWarning bin/t3-grokbot-bridge.mjs run --config <config>`. To keep it running at login, `launchd --config <config>` renders a plist into `<stateDir>/launchd/` and prints the `cp` and `launchctl bootstrap` commands. It installs nothing itself. Logs go to `<stateDir>/logs/bridge.log`. The plist pins the absolute paths of the current `node` and of this checkout, so render it again after an nvm Node upgrade or after moving the repo.

On the first run the bridge records a baseline and sends one `project.snapshot` per routed project: current state, not invented history. Updates start from there.

## Commands

| Command | Does |
| --- | --- |
| `run` | Streams and delivers until SIGTERM/SIGINT. |
| `check` | Connects, prints environment, shell counts, the route for each project, and credential readiness. Writes and sends nothing. |
| `status` | Prints `status.json` (written every 15 s) and queue counts. |
| `set-credentials` | Writes a target's URL and auth from two one-line secret files. |
| `test-send` | Sends one fake setup-test report; prints the status code only. |
| `requeue-dead` | Retries reports the receiver rejected with a 4xx payload error. |
| `launchd` | Renders a launchd plist; installs nothing. |

## Config

| Key | Default | Meaning |
| --- | --- | --- |
| `environment.key` | required | Slug for this environment, used in reports and file names. |
| `environment.httpBaseUrl` | required | The T3 server, e.g. `http://127.0.0.1:3773`. |
| `environment.tokenFile` | required | Mode-600 file holding the read-only bearer token. |
| `stateDir` | `~/.crabstock-dispatch/bridge/<key>` | SQLite state, `status.json`, logs, rendered plist. One per environment. |
| `targets.<name>` | required | `envFile`, `urlVar`, `authVar` of a webhook. Several targets can share one env file. |
| `defaults.*` | see below | Route settings for listed projects that omit them and for unmatched projects. |
| `projects[]` | `[]` | `key` plus one of `projectId`, `workspaceRoot`, `title` to match; optional `target`, `report`, `detail`, `subagents`, `userMessageText`. |
| `unmatchedProjects` | `report` | `report` under a title slug, or `ignore`. |
| `ignoreThreadIds`, `ignoreProjectIds` | `[]` | Never report these, e.g. a T3 thread that processes these reports. |
| `progress.flushAfterMs` | 30000 | Oldest fragment age that triggers a progress report. |
| `progress.maxFragments` | 40 | Fragments per progress report; more are split across reports, never dropped. |
| `detail.maxThreads` | 25 | Concurrent thread streams; beyond this, live threads report shell state only, and a warning is logged. |
| `detail.idleGraceMs` | 20000 | How long a stream stays open after its thread goes idle. |
| `delivery.timeoutMs` | 15000 | Per-request timeout. |
| `retentionDays` | 14 | Delivered reports and their captures are pruned after this. |

Route settings:

- `detail` turns thread streams on or off.
- `subagents` is `attention`, `all` or `off`. With `attention`, subagent threads report only needs-input, plan-ready, errors, failures and limits. Their starts and results still show up in the parent's progress.
- `userMessageText` includes up to 500 characters of each message sent to a thread. It is off by default, which sends only who sent it and how.

## Receiver contract

Each report is a `POST` with a JSON body and these headers:

- `Authorization`: the stored value, verbatim, such as `Bearer …`.
- `Content-Type: application/json`
- `Idempotency-Key`: the report's `event_id`.
- `User-Agent: t3-grokbot-bridge/0.1`

The body uses schema `t3-grokbot-bridge.report.v1`. It keeps the legacy `report` fields (`item`, `thread`, `status`, `summary`, `at`) and adds:

```json
{
  "schema": "t3-grokbot-bridge.report.v1",
  "event_id": "700ff53a-…/thread-id/run:run-id:completed",
  "kind": "run.completed",
  "status": "completed",
  "summary": "Run completed",
  "at": "2026-10-29T10:05:00.000Z",
  "observed_at": "2026-10-29T10:05:00.120Z",
  "observation": "live",
  "item": "crabstock",
  "environment": { "id": "700ff53a-…", "label": "Dan's Mac Studio", "key": "studio" },
  "project": { "id": "mcp:6742af54-…", "title": "gs/crabstock", "key": "crabstock" },
  "thread": "thread-id",
  "thread_title": "Fix ledger rounding",
  "thread_link": "t3-thread://v2/700ff53a-…/thread-id",
  "parent_thread_id": null,
  "relationship": null,
  "origin": { "created_by": "agent", "creation_source": "mcp" },
  "run_id": "run-id",
  "state": { "status": "completed", "activity": null, "pending_request": null, "plan_ready": false, "last_error": null, "settled_at": null, "…": "…" },
  "update": { "latest_message": { "id": "…", "role": "assistant", "text": "Done. PR #94 is green." } }
}
```

| `kind` | `status` | `update` carries |
| --- | --- | --- |
| `thread.created`, `thread.appeared` | `created`, `appeared` | origin of the thread |
| `run.queued`, `run.started` | `queued`, `started` | |
| `run.waiting` | `waiting` | reason, background task count |
| `thread.needs_input` | `needs_input` | request id and kind; questions and option labels, approval prompt, secret label, or link reason when the thread stream supplied them |
| `thread.plan_ready` | `needs_input` | latest message |
| `thread.input_resolved` | `resumed` | the request that was answered |
| `thread.error` | `error` | class, code, redacted message |
| `thread.blocked` | `blocked` | usage limit reset time |
| `run.failed` | `failed` | error, latest message |
| `run.stopped` | `interrupted`, `cancelled`, `rolled_back` | latest message |
| `run.completed` | `completed` | final visible message |
| `thread.settled`, `thread.unsettled` | `settled`, `unsettled` | latest message |
| `thread.pull_request` | `pull_request` | PR URL and number |
| `thread.removed`, `thread.gone` | `removed` | (T3 does not say whether it was archived or deleted) |
| `thread.progress` | `progress` | `count`, `first_at`, `last_at`, and `fragments`: each settled message, command (command line only), file change, todo list, subagent start/result, search, notice, or `detail_gap` note, in order |
| `project.snapshot` | `snapshot` | counts and the live, attention-needing, and unsettled threads of the project at startup |
| `project.resynced` | `resynced` | the same after a gap, with previous and new sequence |
| `bridge.setup_test` | `test` | sent only by `test-send` |

`observation` says how the update was seen. `live` means as it happened. `resume` means replayed after a reconnect. `subscribe` means found when a thread stream opened. `resnapshot` means inferred from current state after a gap. `startup` marks the baseline. `mixed` appears on progress reports that combine these.

**Delivery semantics:** at-least-once, ordered per thread in T3 event time, not exactly-once. The same report can arrive more than once with the same `event_id`, for example after a timeout where the receiver did commit. Receivers must deduplicate on `event_id`, which is stable across retries and restarts. Respond 2xx once the report is stored. 408, 425, 429 and 5xx are retried with backoff up to 15 minutes, honoring `Retry-After`. 401, 403, 404 and 410 hold the queue and retry every 10 minutes without dropping anything. Other 4xx responses dead-letter the report, which `requeue-dead` can resend. Redirects are not followed.

**Avoid feedback loops.** The bridge never writes to T3; its token is `orchestration:read` only. A receiver should act on `needs_input`, `failed`, `error`, `blocked`, `completed` and `settled`, not reply to every progress report. Messages sent to a thread come back as `user_message` fragments carrying T3's `creation_source` and `created_by` (the V2 schema marks MCP-sent messages `mcp`; not yet observed from Grok Bot), and the runs they trigger come back as `run.started`. Use `origin` and those fields to recognize the bot's own actions. If report handling ever runs inside a T3 thread, list that thread in `ignoreThreadIds`.

## Privacy

Text passes through redaction for bearer tokens, URL credentials, key-like assignments, common API key formats, JWTs and long hex or base64 runs. That reduces exposure but cannot prove text is secret-free. So the bridge never captures:

- command output, tool output, file diffs or contents
- reasoning text
- answers to questions or approvals
- secret-card reasons, placeholders or values; only the card label and status
- user message text, unless `userMessageText` is on

Credentials never appear in logs, `status.json`, command output or error text.

## What is verified

| Claim | Evidence |
| --- | --- |
| Transport, auth, and V2 schemas match T3 `0.1.5-nightly.20261029.3877` | Read from source at tag `v0.1.5-nightly.20261029.3877` (`6d450a4`) and the installed app bundle; `check` and live runs against the Studio's server. |
| Shell snapshot, enrichment and live items; thread bounded snapshot and live events | Live, read-only run on the Studio with delivery held: baseline of 479 threads in 11 projects, per-project snapshots and progress queued from this development thread. |
| Ordering, dedupe, reconnect resume, crash-before-ack, gap resnapshot, durable retry across restarts | `npm test` with an in-memory T3 speaking the same frames. |
| HTTP behavior: headers, Retry-After, dead letters, no redirects, no URL in errors | `npm test` against a loopback HTTP server. |
| Real Grok Bot ingestion | **Not verified.** No credentials were available and no request reached Grok Bot. |

Limits of recovering missed activity, from the server source at the installed tag:

- **Shell resume** replays up to 1,000 application sequences and 8 MiB. Replay is coalesced to each thread's current row, so a thread that changed several times in the gap shows only its latest state. The bridge reports those transitions with `observation: "resume"`. Beyond the limit the server sends a full snapshot. The bridge then reports differences against its stored rows as `resnapshot` and adds a `project.resynced` note. A run that started and finished inside the gap is still reported as started and finished; several runs inside the gap appear as the latest one.
- **Thread resume** replays up to 128 events. Beyond that the server sends a bounded snapshot. The bridge adds a `detail_gap` fragment and reports only the latest run's items newer than its last cursor. Older items in the gap are lost.
- **The live shell** groups changes within 50 ms, so a state that lasts a few milliseconds, such as `queued`, can be skipped. Terminal states persist and are always seen.
- **Threads not streamed in detail** report progress only through the shell's latest visible message. This covers subagents by default, threads past `detail.maxThreads`, and projects with `detail: false`.
- **Shell and thread streams are independent.** The shell can report the end of a run before the thread stream delivers its last items. For streamed threads, terminal and needs-input reports are held for 3 seconds, and pending captures flush in T3 event-time order.
- **Archive or delete:** T3's shell sends `thread.removed` for both, so the bridge cannot tell them apart.
- **Server offline:** while the T3 server is off nothing happens, so there is nothing to miss, but the bridge cannot report that work stopped. Work continues without an open chat or browser while the server runs.

## Operations

- Health: `status` or `<stateDir>/status.json` shows the connection, the shell cursor, open thread streams, queue counts by state, the oldest pending report and why delivery is blocked.
- Token expiry: T3 refuses the ticket and the bridge logs `T3 refused the bridge token` and retries every 10 minutes. Mint a new token into the same file. No restart is needed; the next attempt reads it.
- Another environment, such as Paperclip: run a second bridge with its own config, token and state directory. Each state directory refuses a different environment ID.
- Reset: stop the bridge and delete the state directory. The next start takes a new baseline and sends new project snapshots, without replaying history.

### Upgrading T3

Before trusting a new T3 version, run `check`. If the protocol version changed, the bridge refuses to connect and logs why. Otherwise compare `packages/contracts/src/orchestrationV2.ts` (`OrchestrationV2ShellStreamItem`, `OrchestrationV2ThreadShell`, `OrchestrationV2ThreadStreamItem`, `OrchestrationV2TurnItem`) and `apps/server/src/ws.ts` (resume limits) at the new tag against the fields used in `src/shell.mjs` and `src/thread.mjs`. Unknown thread events and turn item types are skipped, and the cursor still advances.

## Development

```sh
cd tools/t3-grokbot-bridge
npm test
```

No dependencies. Source is plain ES modules: `src/rpc.mjs` (T3 transport), `src/shell.mjs` and `src/thread.mjs` (what counts as an update), `src/store.mjs` (SQLite), `src/report.mjs` (report bodies and batching), `src/delivery.mjs` (webhook), and `src/bridge.mjs` (wiring).
