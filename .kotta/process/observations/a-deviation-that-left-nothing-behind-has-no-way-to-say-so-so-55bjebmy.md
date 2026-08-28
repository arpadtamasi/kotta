---
id: F-01m14zy142ex24a3q355bjebmy
title: >-
  A deviation that left nothing behind has no way to say so, so the sweep list
  can only grow
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
---
# F-01m14zy142ex24a3q355bjebmy — A deviation that left nothing behind has no way to say so, so the sweep list can only grow

## Observation

A deviation that left nothing behind has no way to say so, so the sweep list can only grow.

## Evidence

Read all 19 undeclared-deviation items reported by 'kotta sweep' on 2026-08-28. Two were false positives an existing observation already answered and only the link was missing; one of them cleared with 'kotta observation link'. Of the remaining, the large majority declare an interpretation argued and accepted at review and nothing else: T-014 (two judgement calls on a port range, both explained), T-01kz1g2vra99x0xhw144x6rke4 (a changelog entry and endsWith in a test), T-030, T-031, T-035, T-01kzda6nj9hd2z45tt06fw8n0g, T-01m0bvztry5z4j3k72m9zs70ym, T-01m0v2d804h1pk95y4bmq7fk8m. A handful do name something left behind — T-026 and T-029 both declare a verification that was not performed. The sweep cannot tell the two apart, and its only offered action is to record an observation, so the honest exit for a benign deviation is to leave the item on the list forever. Eighteen items, all 26 days old, none of which the operator can clear without either inventing an observation or ignoring the sweep.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
