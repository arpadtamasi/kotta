---
name: start-task
description: Safely start a defined Kotta task with its claim, feature branch, and isolated worktree. Use when a user or batch coordinator asks an agent to begin or claim a task for implementation.
---

# Start a task

The canonical start operation is `kotta task start`; do not manually move task files or assemble claims, branches, or worktrees.

Prefer `kotta task execute <task-id> --agent <agent>`: it performs this start and then runs the task in a fresh agent context on the brief alone (D-009). Use `kotta task start <task-id> --agent <agent> --caller` only when the current caller should continue inside the returned worktree with explicitly inherited context. A bare start can still be resumed with `kotta task execute <task-id> --resume`.

1. Read the defined task, active profiles, dependencies, constraints, and repository configuration.
2. Summarize the outcome, in-scope work, non-goals, verification task, and unresolved risk before execution.
3. Confirm the repository is clean and the configured base branch is available. Do not implement on `main`, `master`, `develop`, or another protected branch.
4. Run `kotta task start <task-id> --agent <agent>` from any linked worktree; Kotta routes live state to the control worktree. Add `--caller` only for explicit inherited-context execution. Use `--json` when another tool will consume the result.
5. Verify that the control plane holds exactly one active task and claim, and that one correctly named feature branch and worktree exist. The feature branch must not contain a competing active lifecycle copy.
6. Perform all subsequent work only in the reported execution context.

Refuse duplicate claims, conflicting branches, dirty unsafe state, invalid defined tasks, and unexpected non-empty worktree paths. Do not recover with manual filesystem edits. A forced claim release must clearly describe risk and must never discard uncommitted work.
