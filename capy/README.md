# Bob for Capy

This folder is a skills-only Capy plugin. It contains Bob, his engineering helpers, and 24 principles. Captains own program coordination. No lead skills, personal skills, MCP servers, credentials, hooks, or scheduled jobs are included.

## Install after publishing

In Capy, open **Settings → MCP & plugins → From GitHub repository** and select this repository's `capy/` folder on the published branch. Choose **Only me** and the intended project scope. For a private repository, the Capy GitHub App needs access first. Inspect **Warnings**, then start a cloud thread and check that `$bob` appears. Invoke `$bob <goal>` or select Bob with `/`.

Click **Sync** after publishing an update. GitHub plugins do not update automatically. A same-named repository or Drive skill takes precedence over the plugin, so inspect which copy the thread loaded.

**Local-machine limitation:** Capy's documentation says local threads receive only a plugin's remote servers. This package has none, so installing it does not make Bob available in Mac Studio threads. For those threads, use the same complete skill folders under the target repo's `.agents/skills/`, or investigate personal Drive skills separately. This change does not install either workaround or alter local symlinks.

## What changed for Capy

| Bob behavior | Capy edition |
| --- | --- |
| Feature, Bug, Refactor, Perf | Keep the playbooks, checks, checkpoints, and local commit stopping point. Publishing is a separate request. |
| Investigation, Prototype | Keep evidence and visual explanations; use native pages with a Markdown fallback. |
| Design and review panels | Native shared-machine read-only subagents. Model families resolve against Capy's catalog. |
| Implementation children | Fresh machines from a verified upstream base. They cannot see uncommitted parent edits. Inspect their diff before accepting it. |
| PR opening and babysitting | Native GitHub association and event wakes. Bot comments need an explicit supported watch or bounded background checks. |
| Program orchestration | Handoff to a Captain. No coordinator store, heartbeat, or automation. |
| Completion and cleanup | Native parent/crew reports. Preserve work; never manually prune Capy-managed machines or checkouts. |
| Models and saved decisions | Explicit model IDs and effort per role, Claude subscription IDs by default, and optional `.bob/capy/` project overrides. Transfer context explicitly across machines. |
| Improving Bob | Edit this source package on an authorized branch, not Capy's installed cache. Publish only when requested, then Sync. |

`disable-model-invocation: true` is retained from Bob's source, and instructions preserve explicit invocation intent. Capy does not document enforcement of that flag; verify the picker and invocation behavior during the trial.

## Choose models

The defaults recommend Claude Opus 5.5 high for the Bob thread, Sonnet 5.5 medium for readers, GPT-6.1 Sol high for build workers, and explicit Opus/GPT combinations for design and review. All Claude defaults use `claude-code/` IDs to select the Claude subscription harness. The original per-role effort settings are retained, including xhigh for the design roles. Availability and support must be checked in Capy before starting a child.

Use `/bob-models` to inspect or change individual roles, or name a model and effort in a task for a temporary override. Saved project choices go in `.bob/capy/models.yaml`. Explicit task choices win, then project role entries, then the packaged defaults. Missing roles fall through individually; a panel override replaces its whole list. The parent thread stays on its current model until changed through the picker or an authorized native control.

These defaults do not change Capy account settings. Connection availability and run-out policies determine actual billing. The skill must report subscription problems and ask before deliberately changing the model or billing route.

## Maintenance and validation

This is a maintained Capy port, not generated output. The starting source is repository commit `702b0218d4b8f2eeb129eb49e4ee8f9278dfb2f1`. Compare subsequent changes to root `bob/` and `bob-*/` against `capy/skills/` and port the relevant behavior. Never overwrite Capy's runtime references with the original orchestration instructions. Keep the existing root library, registry, and deployments independent.

Run the package validator from the repository root in a Python environment with `PyYAML` and `jsonschema` installed:

```sh
python scripts/validate-capy-plugin.py
```

The validator fetches the specification's versioned schemas from its GitHub source because the canonical schema URLs currently return 404. For offline validation, pass `--schema-dir <folder>` containing `plugin.schema.json` and `mcp.schema.json`. It checks schemas, skill metadata, package limits, contained file references, model roles, and excluded runtime dependencies. It cannot prove Capy imported or executed the package.

Before adopting it, run a small throwaway task in a Capy cloud thread. Confirm Bob loads from the plugin, a shared reviewer sees the parent diff, a fresh writer uses the intended published base, the parent receives completion and blocked questions, and PR events arrive under the effective event policy. Check the actual selected models and options. No import or live Capy task has been run as part of this port.

Sources checked on 2026-10-23: [plugins](https://docs.capy.ai/integrations/plugins), [skills](https://docs.capy.ai/skills), [subagents](https://docs.capy.ai/subagents), [async work](https://docs.capy.ai/async-work), [Captains](https://docs.capy.ai/captains), and the [Agent Plugins schemas](https://github.com/agentplugins/agent-plugins-spec/tree/main/schemas/1.1.0).
