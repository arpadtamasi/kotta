---
name: execute-task
description: Implement and verify one active Kotta task within its approved scope and isolated Git context. Use when an agent is asked to carry out, continue, or finish implementation for an active task.
---

# Execute a task

Work only in the branch and worktree recorded by the task's claim. Kotta state mutations belong to the `kotta` CLI; normal product-code edits use the repository's regular tools.

**Context task (D-009):** execution starts in a FRESH agent context whose intent input is `kotta task brief <id>` — the task body, its referenced decisions, its profiles and its claim. The code lives in the worktree. If the brief plus the worktree is not enough to start, that gap is a task defect: record it (observation or definition contradiction), do not silently pull in wider context. The explicit exception is `task start --caller`, which records inherited execution and lets the current caller continue in that worktree; it never makes inheritance the default.

**Launching that context is a command, not a manual step.** A coordinator runs `kotta task execute <id> --agent <agent>`: it performs the start, assembles the brief and launches the task agent with the brief as its only input, then reports the brief's token count, the agent, the branch and the worktree. Never re-implement that sequence by hand and never implement a task in the coordinator's own context. Use `--resume` to retry inside an existing execution context (also after `agent-failed` or `no-change`, and for a context created by `task start`); a plain second `execute` refuses instead of starting a second agent. The recorded state comes from comparing the worktree against its pre-run baseline, never from what the agent claims: a run that changed nothing is `no-change`, and reporting success does not make it an implementation. Carrying context beyond the brief requires `--inherit-context "<reason>"` and is logged. The steps below are the task the launched task agent follows.

1. Validate the active task, claim, branch, worktree, dependencies, and protected-branch safety before editing. Obtain the task with `kotta task brief <id>`.
2. Convert acceptance conditions and active-profile done checks into a concrete verification plan.
3. Make the smallest implementation that produces the task outcome. Preserve non-goals and constraints.
4. Classify discoveries as required for outcome, required for safe implementation, optional improvement, separate observation, or definition contradiction.
5. Include only the first two categories when supported by the task. Create unrelated work with `kotta observation new`; do not silently expand scope.
6. Stop for missing product intent, an unsafe expansion, or a definition contradiction. Record the issue and use a legal CLI transition back to defined or backlog when required.
7. Run the repository checks and task-specific verification. Capture exact, reproducible evidence for every acceptance condition and profile requirement.
8. Keep implementation changes committed on the feature branch and leave the working tree clean before review. Lifecycle state, claims and visible chat remain on the control branch and are mutated only through Kotta.

A task that turns out to have no object — a decision has since settled the opposite, or another
task already covers it — is not finished and not left running. Say so in chat and retire it with
`kotta task cancel <id> --resolution obsolete --reason "…" --superseded-by <id> --approve` on an
explicit human yes. The command works from `active`, releases the claim, removes the worktree and
keeps the branch, so nothing already built is lost.

Do not merge, close, or claim acceptance. Execution produces an implementation candidate and evidence; review remains a separate state.
