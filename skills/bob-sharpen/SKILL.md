---
name: bob-sharpen
description: "Rewrite a prompt so it asks for a deeper version of the task, not a bigger one, before you send it to Bob. Returns only the rewritten prompt and doesn't do the task. Manual-only: `/bob-sharpen <prompt>` in Claude Code, `$bob-sharpen <prompt>` in Codex."
disable-model-invocation: true
---

I want a deeper version of this task, not a bigger one. Before rewriting it, do four things:

1. Say what the best professional in this field would do here that I'm not asking for.
2. Name the rawest material they'd start from, instead of something already summarized for me.
3. Name the specific methods and tools they'd use.
4. Say what, other than you or me, would show the result is right.

Then rewrite my prompt to ask for exactly that, and hand back the rewrite. Don't do the task.

Leave the choices that are mine to make open instead of deciding them.
