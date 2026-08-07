---
name: execute-batch
description: Coordinate a Kotta batch of validated contracts, dependency-aware ordering, bounded parallelism, and isolated worktrees. Use when a user asks to start or execute a batch of contracts.
---

# Execute a batch

Use `kotta batch start` as the canonical batch mutation. Never bypass contract-level validation or manually manufacture claims and worktrees.

1. Run `kotta batch validate <batch-id>` and inspect every referenced contract.
2. Reject non-defined contracts unless an explicit supported configuration allows them. Surface missing dependencies, cycles, and likely file or branch conflicts.
3. Explain the calculated execution order, mode, parallelism, and stop-on-failure behavior.
4. Ensure the configured base branch is checked out in the control worktree, then run
   `kotta batch start <batch-id> --agent <agent>` from any linked worktree. Kotta creates or reuses
   `.worktrees/batches/<batch-id>` for `coord/<batch-id>` and leaves the control checkout on its
   configured base branch.
5. Start no more contracts than the configured parallelism permits. Parallel contracts must have separate claims, branches, and Git worktrees.
6. **Fresh context per contract (D-009, default):** launch every contract with `kotta contract execute <contract-id>` — never with your accumulated conversation. Use `--resume` for a contract whose execution context `batch start` already created, and `--agent <agent>` for one that has none yet. The command starts the contract, assembles its brief and runs the contract agent on that brief alone; do not hand-assemble start + brief + agent launch, and never implement a contract in your own context. The coordinator stays thin: it sequences, gates and records. Record each contract's brief token count — `execute` reports it in its output and in `--json` — in the run log. Context carry-over is an explicit, logged exception: `--inherit-context "<reason>"`.
7. **Handle execution outcomes through the command:** `agent-failed` (non-zero exit or empty result) keeps the claim and worktree for inspection — retry with `kotta contract execute <contract-id> --resume`, which reuses that context instead of creating a second one. `no-change` means the agent finished and the worktree still matches its pre-run baseline: nothing was implemented, whatever the agent reported, so read the agent's output in the execution record before resuming — never submit it for review. A plain repeat `execute` on a claimed contract refuses by design. `execute` never enters review, merge or close.
8. For each active contract, the fresh agent follows the `execute-contract` contract. Poll with `kotta batch status <batch-id>` and start newly unblocked work through supported CLI operations.
9. On failure, stop or continue exactly as configured. Report blocked dependencies and conflicts without weakening validation.
10. Keep batch status current through CLI-backed contract transitions. Closing or cancelling the
    last member contract completes the batch on its own, from any batch state. If its contracts
    reached `done` some other way, prepare batch close in chat for the human. The human-run CLI
    fallback is `kotta batch close <batch-id> --approve`; it refuses while any member is not `done`
    and never edits a contract.

One contract maps to one feature branch and one review target. Kotta never auto-merges contracts;
the dedicated coordinator branch is their explicit batch integration target and is cleaned only by
`kotta batch finalize` after Git proves it was integrated.
