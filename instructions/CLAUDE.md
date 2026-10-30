# Worktrees

Never use Claude Code's built-in worktrees. Do not call EnterWorktree or use Claude's `--worktree` / `-w` option or native Agent `isolation: "worktree"`.

Work in the checkout supplied to you. When a task requires an isolated checkout, use the project's approved worktree workflow, such as T3-managed worktrees, rather than Claude-managed worktrees.
