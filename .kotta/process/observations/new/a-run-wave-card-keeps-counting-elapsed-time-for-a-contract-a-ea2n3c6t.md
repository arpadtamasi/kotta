---
id: F-01m0f2mtcnq0cgvdt3ea2n3c6t
title: >-
  A run wave card keeps counting elapsed time for a contract already in review,
  because it branches on the claim, not on active
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0f2mtcnq0cgvdt3ea2n3c6t — A run wave card keeps counting elapsed time for a contract already in review, because it branches on the claim, not on active

## Observation

A run wave card keeps counting elapsed time for a contract already in review, because it branches on the claim, not on active.

## Evidence

Observed 2026-08-20 on a kotta ui board (kotta 0.6.0) showing a Wave 2 group with '1 ACTIVE · 1 REVIEW'. The card tagged REVIEW and the card tagged ACTIVE both read 'codex · running 10m 19s', and the review card's number keeps growing. In ui/src/App.tsx (main, 602c6ac) RunContractCard's meta line reads: claimed ? <ClaimDot/>{assigned_agent} · running {elapsedSince(contract.claim?.started_at, now)} : metric ? executionSummary(metric) : status === 'done' ? 'completed · metrics not recorded' : status === 'review' ? 'awaiting review · metrics not recorded' : runWaitingReason(...). A claim is released only at close or cancel, so it survives the move to review and the 'claimed' guard shadows both the metric branch and the explicit review branch below it — those two are dead for every claimed contract. The sibling call sites do gate correctly: the Running strip and the loose-work rows iterate board.running (active only), the contracts table uses status === 'active' ? running … : executionSummary(metric), and the contract detail renders 'Not running' off the same status check. Only the wave card differs. The data for the correct label already exists: ExecutionMetric carries durationMs and completedAt, so a review card can show the frozen run duration plus tokens instead of a live timer. The board is read-only and derived, so no stored state is wrong — only this one rendering.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
