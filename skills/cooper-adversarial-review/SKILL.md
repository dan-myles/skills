---
name: cooper-adversarial-review
disable-model-invocation: true
description: "Adversarial review of a change or design by adversaries on different models, Claude and GPT with explicit launch settings below. Each tries to break it and must prove every finding with a run; Cooper reruns each one and keeps only what reproduces and breaks the intent. Never applies fixes. Use for risky diffs, a contested design, or 'tear this apart'. Manual-only: `/cooper-adversarial-review [diff or files]` in Claude Code, `$cooper-adversarial-review ...` in Codex. `cooper` runs it from its Review step."
---

# Adversarial review

Adversaries try to break a change or a design. A finding survives only when a run proves it: a failing test, a repro script, or command output that shows the wrong behavior. Opinions about style, naming, structure, and risks that need some future change to matter don't survive, because nothing ran.

The output is a verdict. Don't change any code here. When `cooper` called this from its Review step, Cooper acts on the verdict there.

## 1. Frame

**Scope:**

- the files or diff the user points at, if any;
- on a branch, `git diff <base>...HEAD` plus the working tree, where `<base>` is the branch the PR targets;
- a design or plan before code works too: its files stand in for the diff, and adversaries probe the current tree or prototype against it.

Save the change for the adversaries: the branch's head SHA, and the uncommitted part as a patch (`git diff --binary HEAD > <tmp>/change.patch`), both outside the repo.

**Intent:** one paragraph on what the change is for and what it must do. When Cooper approved a design earlier in the session, take the intent from it. Otherwise build it from the user's words, commit messages, the PR body, and the code. If you can't state it with confidence, ask before going on.

**Decisions to keep:** under the intent, list the brief's DECIDED, the user's calls, and the repo's design docs. With none, write "none recorded".

## 2. Fan out

Start two adversaries at once per [launch mechanics](../cooper/references/delegation.md), each with `delegate_task` in its own T3-managed worktree (`isolation: "worktree"`). Adversary A uses `claude-opus-5-5` with `{effort: high}` on provider family `claudeAgent`. Adversary B uses `gpt-6.1-sol` with `{reasoningEffort: high}` on provider family `codex`. Give both the same filled [adversary prompt](references/adversary-prompt.md), with absolute paths, since they start with none of this session. Preserve the two-model panel unless the user explicitly changes it.

An unavailable model or options payload is a launch gate. If an adversary starts then fails, keep the survivor's evidence and report the gap. Do not claim the two-family review is complete or substitute a model without the user's explicit override.

## 3. Verify

Rerun each finding's command yourself, in a scratch worktree at the same head with the patch applied, never in the checkout under review. Keep a finding when the output shows the failure and the failure breaks the intent. Drop the rest, with the reason: it didn't reproduce, the output doesn't show what the finding claims, or the behavior is what the intent asks for. Merge findings that share a root cause.

A departure from a decision to keep needs no run. It is proven by the decision's words and the diff line that departs from them; check both yourself. It always survives: undo it or take it to the user.

Adversaries find different failures, so the verdict keeps every verified finding, not one adversary's list. Remove the scratch worktrees when done.

## Output

Show it per `../cooper/references/visuals.md`: each verified finding with its repro, marked with which adversaries found it. The sections below are the content.

### Intent
> the paragraph from step 1

### Adversaries
- One line each: label, model, findings reported, findings kept. Note any gap or override.

### Findings
For each verified finding: the command, the output it printed, the output the intent requires, how it breaks the intent, and who found it. Say "no verified findings" when none survive.

### Dropped
For each adversary, how many findings were dropped and why.
