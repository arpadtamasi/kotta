---
id: F-01kz20ghvyn7zfbjffa4dg5622
title: >-
  ui/UX-SPEC.md describes the pre-v2 board and has no owner after the Kotta v2
  switch
status: new
origin: agent
observation_type: process
confidence: high
severity: medium
discovered_during: T-01kz1xrxw4aheeqv1ca0bv0fcq
created_at: '2026-08-02'
---
# F-01kz20ghvyn7zfbjffa4dg5622 — ui/UX-SPEC.md describes the pre-v2 board and has no owner after the Kotta v2 switch

## Observation

ui/UX-SPEC.md describes the pre-v2 board and has no owner after the Kotta v2 switch.

## Evidence

T-01kz1xrxw4aheeqv1ca0bv0fcq replaced the pipeline board (inbox/shape/packages/run/done, chat dock, needs-you strip) with the Kotta Console v2 design. ui/UX-SPEC.md, 16KB, still specifies the replaced board section by section and was the binding UX document until now; the ticket added a 'superseded' banner pointing at design/kotta, but the body is unrevised. Two specifications for one surface is the condition the board itself calls 'doesn't add up'. Decide whether UX-SPEC is retired into a decision record, rewritten against the v2 design, or kept as a historical redesign brief with a dated header.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
