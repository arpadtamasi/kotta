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
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Meaning

The unit of work: one bounded, executable slice of the accepted specification, with an observable outcome, acceptance conditions, and verification. The unit of delegation, and the asset the workspace accumulates.

A task's title states the outcome that ends the work, never the symptom that prompted it. A task minted from an observation therefore does not inherit that observation's title: the two kinds say opposite things by construction, and a backlog titled by symptoms is a list of complaints rather than of work.

## Identity

T- plus a time-sortable 26-character ULID, minted without coordination; identifiers created before that rule keep their sequential form forever. Filename: slug plus short id suffix.

## Attributes

status (backlog/defined/active/review/done), origin (human/agent/observation/imported), types, profiles, spec references (the accepted nodes the task executes), risk, batch membership, depends_on/blocks, branch, worktree, execution_mode (fresh/inherited), resolution (completed/cancelled/duplicate/obsolete), and per gated transition: approved_by, approved_at, approval_basis.

## Invariants

Only a validated, defined task whose acceptance conditions are covered by accepted spec executes. Every question under Open decisions must be resolved, each naming the decision that settled it, before defining completes; an entity with no questions is the empty case. At most one claim at a time. A task never creates agreement: needs outside its coverage become observations. A terminal task carries a resolution saying how it ended; duplicate and obsolete also name what superseded it.
