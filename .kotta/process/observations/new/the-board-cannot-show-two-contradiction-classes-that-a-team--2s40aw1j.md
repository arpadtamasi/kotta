---
id: F-01kz20fzmjvj7hpcdn2s40aw1j
title: The board cannot show two contradiction classes that a-team validate reports
status: new
origin: agent
observation_type: risk
confidence: high
severity: medium
discovered_during: T-01kz1xrxw4aheeqv1ca0bv0fcq
created_at: '2026-08-02'
---
# F-01kz20fzmjvj7hpcdn2s40aw1j — The board cannot show two contradiction classes that a-team validate reports

## Observation

The board cannot show two contradiction classes that a-team validate reports.

## Evidence

T-01kz1xrxw4aheeqv1ca0bv0fcq built the Home band 'Doesn't add up' from what /api/workspace carries: diagnostics, dangling references and package-membership disagreements. Two classes that 'a-team validate' reports stay invisible to it. (1) MISSING_CLAIM / INVALID_CLAIM: claims live in .a-team/claims/*.yaml, which readWorkspace (src/commands/ui.ts) never reads; the board shows the claim from the ticket's assigned_agent frontmatter instead, so an active contract with no claim file looks claimed. (2) DUPLICATE_STATE: readWorkspace keeps the first file it finds per id (ticketBase.has(id) guard), so an entity a merge left in two state directories reads as a single, healthy entity — exactly the case 'a-team ticket dedupe' exists for. The board and the CLI must agree (ticket Constraints); today they disagree by omission on these two.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
