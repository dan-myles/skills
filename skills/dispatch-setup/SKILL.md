---
name: dispatch-setup
disable-model-invocation: true
description: "Set up or reconcile a Dispatch Grok Bot's identity, repo, Executor destination, standing orders, and local state. Use on first run or when Dan explicitly changes that scope."
---

# Setup

Read the [Dispatch role](../dispatch/SKILL.md). This setup runs on the Grok Bot box, not in a T3 coordinator thread.

1. Read `~/.bob-n-frank/config.yaml`; copy [the default config](../dispatch/references/config.example.yaml) only if it is missing. Preserve existing entries and stores. Do not create `models.yaml` on the box.
2. Get the bot's actual ID from its startup identity or Dan, and find `instances["grokbot:<bot id>"]`. Determine the assigned repo and role, actual Executor app/account and T3 `projectId`, tracker, standing orders, and distinct absolute `state_dir`. Ask only for missing facts. A shared skill folder makes instructions available; it does not choose the role or enforce access isolation.
3. Add or update only this instance. Put the selected role and instance key in the bot's startup instructions through an already-authorized configuration interface, or give Dan the exact startup text. Do not create a bot, rename a T3 thread, edit another bot, or guess its identity. Keep sensitive connection material out of config and briefs.
4. Verify the destination's tools with Executor search/describe and read the configured T3 project. Record the repo and role with the settings below. Preserve active worker routing and legacy T3-keyed entries until a migration is explicitly approved. A matching display name is not enough to migrate an instance.
5. Hand Fleet Control the bot ID, repo/role, configured native bot delivery destination, and existing approved cadence. Missing native delivery or cadence stays pending. Do not create or recreate routines, T3 schedules, webhooks, or sweeps. Run the digest in status mode for the initial board.
6. Create this instance's board page from the saved board, following [the board page](../dispatch/references/board-page.md): a Segmented tab strip whose first tab is Now (work in progress), then Backlog, What landed, and Watch and links. Never add a recent-activity or a waiting-on-you section. Record its canvas id and url in `decisions.tsv` and keep it in the instance's config under `board_page` when the schema allows. Reuse an existing page for the same repo and role instead of making a second one; a page already recorded for this instance is edited, never replaced.

Example instance shape, filled from verified values rather than copied literally:

```yaml
instances:
  "grokbot:<actual bot id>":
    role: general
    repos: ["dan-myles/skills"]
    state_dir: /home/box/.bob-n-frank/dispatch/skills/general
    executor:
      connection: user-executor-dans-team
      app: t3-code-mac-studio
      projectId: "<verified T3 project id>"
    board_page: "<canvas id and url, once created>"
    validator_model: null
    delivery: null
    cadence: null
    standing_orders: []
```

`board_page` is the Page Dan opens for this project; it is created once and edited in place. `validator_model` is null unless Dan configured a different validator with verified instanceId/model/options; use it only to satisfy the existing second-model validation gate. `delivery` and `cadence` hold only the verified native bot route and approved routine details when known. Null means unconfigured, not permission to improvise a T3 proxy. Support uses role `support` and its supplied Paperclip project. Fleet Control has its own bot instance and state directory; it reads project instances without owning their boards.

A useful startup instruction is: "You are the Skills Dispatch Grok Bot. Read the dispatch skill and use instance grokbot:<actual bot id>." Support selects the support skill instead. Do not put the full shared workflow into every bot's prompt.
