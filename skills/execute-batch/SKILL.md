---
name: execute-batch
description: Coordinate a Kotta batch of validated tasks, dependency-aware ordering, bounded parallelism, and isolated worktrees. Use when a user asks to start or execute a batch of tasks.
---

# Execute a batch

Use `kotta batch start` as the canonical batch mutation. Never bypass task-level validation or manually manufacture claims and worktrees.

1. Run `kotta batch validate <batch-id>` and inspect every referenced task.
2. Inspect every member state. Only unclaimed `defined` tasks are dispatch candidates; `review`
   and `done` members remain lifecycle evidence for dependency checks. Surface missing dependencies,
   cycles, and likely file or branch conflicts.
3. Explain the calculated execution order, mode, parallelism, and stop-on-failure behavior.
4. Ensure the configured base branch is checked out in the control worktree, then run
   `kotta batch start <batch-id> --agent <agent>` from any linked worktree. Kotta creates or reuses
   `.worktrees/batches/<batch-id>` for `coord/<batch-id>` and leaves the control checkout on its
   configured base branch. Every newly dispatched task starts from the coordinator's exact
   current commit; retain the start ref and resolved commit printed by the command in the run log.
5. Start no more tasks than the configured parallelism permits. Parallel tasks must have separate claims, branches, and Git worktrees.
6. **Fresh context per task (D-009, default):** launch every task with `kotta task execute <task-id>` — never with your accumulated conversation. Use `--resume` for a task whose execution context `batch start` already created, and `--agent <agent>` for one that has none yet. The command starts the task, assembles its brief and runs the task agent on that brief alone; do not hand-assemble start + brief + agent launch, and never implement a task in your own context. The coordinator stays thin: it sequences, gates and records. Record each task's brief token count — `execute` reports it in its output and in `--json` — in the run log. Context carry-over is an explicit, logged exception: `--inherit-context "<reason>"`.
7. **Handle execution outcomes through the command:** `agent-failed` (non-zero exit or empty result) keeps the claim and worktree for inspection — retry with `kotta task execute <task-id> --resume`, which reuses that context instead of creating a second one. `no-change` means the agent finished and the worktree still matches its pre-run baseline: nothing was implemented, whatever the agent reported, so read the agent's output in the execution record before resuming — never submit it for review. A plain repeat `execute` on a claimed task refuses by design. `execute` never enters review, merge or close.
8. For each active task, the fresh agent follows the `execute-task` task. Poll with
   `kotta batch status <batch-id>` and start newly unblocked work through supported CLI operations.
   In a dependency-aware batch, `done` releases a dependent normally. A predecessor in `review` also
   releases a same-batch dependent only after Git proves its feature branch is an ancestor of the
   recorded coordinator branch. Review without that ancestry remains waiting.
9. On failure, stop or continue exactly as configured. Report blocked dependencies and conflicts without weakening validation.
10. Keep batch status current through CLI-backed task transitions. Closing or cancelling the
    last member task completes the batch on its own, from any batch state. If its tasks
    reached `done` some other way, prepare batch close in chat for the human. The human-run CLI
    fallback is `kotta batch close <batch-id> --approve`; it refuses while any member is not `done`
    and never edits a task.

Technical wave handoff never grants human acceptance. Do not close a reviewed predecessor merely to
release its dependent, and do not treat coordinator integration as approval: every `review → done`
transition still requires the human gate, and reviewed members keep the batch active.

One task maps to one feature branch and one review target. Kotta never auto-merges tasks;
the dedicated coordinator branch is their explicit batch integration target and is cleaned only by
`kotta batch finalize` after Git proves it was integrated.
