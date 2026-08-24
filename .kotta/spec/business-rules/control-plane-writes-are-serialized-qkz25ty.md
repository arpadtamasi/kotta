---
id: BR-01m0jksm9x99nr9vwq9qkz25ty
form: business-rule
title: "Control-plane writes are serialized"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

Lifecycle, claim, execution-outcome, discovered-work and chat/approval writers take a repository-wide mutation lock before touching canonical state. A writer that cannot take the lock within its deadline refuses with "no state was changed" rather than waiting indefinitely or writing anyway; a stale lock left by a dead process is reclaimed, never honoured.

## Rationale

The multi-worktree model routes every mutation to one control checkout. Without serialization, two agents finishing at once would interleave reads and writes of the same files and index, and the canonical record would depend on timing. The lock is what makes "the repository keeps the shared truth" true under parallel execution.

## Scope

Every mutation that reaches `.kotta/process/` through the CLI or MCP services. Reads take no lock. The refusal names the busy state and changes nothing, so a caller can simply retry.
