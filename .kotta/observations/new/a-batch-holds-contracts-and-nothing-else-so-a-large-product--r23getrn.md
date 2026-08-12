---
id: F-01kztt37st3xy3dmfnr23getrn
title: >-
  A batch holds contracts and nothing else, so a large product has no way to
  group work above one level
status: new
origin: agent
observation_type: enhancement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-12'
---
# F-01kztt37st3xy3dmfnr23getrn — A batch holds contracts and nothing else, so a large product has no way to group work above one level

## Observation

A batch holds contracts and nothing else, so a large product has no way to group work above one level.

## Evidence

Reported by the operator on 2026-08-12: Kotta's model does not support nested batches, and a larger product would want them.

The model is flat by construction. schemas/batch.schema.json:11 types `contracts` as an array whose items must match a contract id (`T-…` or the imported `O-…`), with `minItems: 1`; there is no `batches` member and no parent field. A contract carries a single `batch` string (src/commands/contract.ts reads `typeof entity.data.batch === "string"`), and `updateContainingBatch` is named for the assumption: one containing batch, not a chain of them. So the tree has exactly two levels — batch above, contracts below — and a product with modules, milestones or workstreams has to flatten all of them into either one batch of many contracts or many unrelated batches with nothing above them.

The idea of another level already leaks into the schema without a model behind it: `authority.create_subcontracts` (schemas/batch.schema.json:28) is a permission for something the entity graph cannot express. It is written as `false` by `newBatch` (src/commands/batch.ts:92) and nothing reads it.

Execution assumes the same flatness. A started batch takes a deterministic coordinator branch `coord/<batch-id>` and a worktree at `.worktrees/batches/<batch-id>` (src/commands/batch.ts:197). Nesting would have to answer what a child batch's coordinator branches from, whether it merges into the parent coordinator or the base branch, and whether `default_parallelism` is per level or shared — none of which the current shape has a place to record. Batch closure walks its member contracts (`batch close` refuses while any member is not `done`) and would need to walk child batches too.

Not urgent for this repository, whose batches are small; the request comes from wanting to run Kotta on a larger product. Sizing it needs the operator's shape of that product — how deep, and whether a child batch is a grouping for reading or a unit of execution with its own coordinator.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
