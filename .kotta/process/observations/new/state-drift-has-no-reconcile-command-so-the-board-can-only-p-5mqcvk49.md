---
id: F-01kz20ghs2e8ym44v45mqcvk49
title: >-
  State drift has no reconcile command, so the board can only point at a-team
  validate
status: new
origin: agent
observation_type: product
confidence: high
severity: medium
discovered_during: T-01kz1xrxw4aheeqv1ca0bv0fcq
created_at: '2026-08-02'
---
# F-01kz20ghs2e8ym44v45mqcvk49 — State drift has no reconcile command, so the board can only point at a-team validate

## Observation

State drift has no reconcile command, so the board can only point at a-team validate.

## Evidence

The Kotta Console v2 design (design/kotta/Kotta Console v2.dc.html, contradictions array) hands the operator 'kotta ticket reconcile <id>' for a state-drift row, and the pre-v2 board printed 'a-team ticket reconcile {id}' in its drift block. No such command exists: src/cli/index.ts offers ticket new/validate/define/ready/start/execute/review/close/cancel/brief/dedupe/reopen. While implementing T-01kz1xrxw4aheeqv1ca0bv0fcq the board was pointed at 'a-team validate' instead, because whatever the board displays must agree with what the CLI reports. That leaves the operator with a diagnosis and no verb: when .worktrees/<id> disagrees with the committed contract, nothing in the CLI resolves it in one step.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
