---
id: E-01m0f0wn898ayyrvy613zjx3ye
form: entity
title: "Task"
used_by:
  - UC-01m0f0wn89tta6w4w3a7zw45xr
  - UC-01m0f0wn89b2ymcw1c3qd4vcxb
  - UC-01m0f0wn89vwta48p95exahgmv
  - BR-01m0f0wn89zb3wfb3t3y4d20a7
  - BR-01m0fp2hdkqz08arp5ebt122r9
interfaces:
  - IF-01m0f0wn897newtcbva7xqgvx6
---

## Meaning

The unit of work: one bounded, executable slice of the accepted specification, with an observable outcome, acceptance conditions, and verification. The unit of delegation, and the asset the workspace accumulates.

## Identity

T- plus a time-sortable 26-character ULID, minted without coordination; identifiers created before that rule keep their sequential form forever. Filename: slug plus short id suffix.

## Attributes

status (backlog/defined/active/review/done), origin (human/agent/observation/imported), types, profiles, spec references (the accepted nodes the task executes), risk, batch membership, depends_on/blocks, branch, worktree, execution_mode (fresh/inherited), resolution (completed/cancelled/duplicate/obsolete), and per gated transition: approved_by, approved_at, approval_basis.

## Invariants

Only a validated, defined task whose acceptance conditions are covered by accepted spec executes. Open decisions must be empty before defining completes. At most one claim at a time. A task never creates agreement: needs outside its coverage become observations. A terminal task carries a resolution saying how it ended; duplicate and obsolete also name what superseded it.
