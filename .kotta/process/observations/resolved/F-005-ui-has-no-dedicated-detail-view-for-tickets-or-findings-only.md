---
id: F-005
title: UI has no dedicated detail view for tickets or findings (only packages do)
status: resolved
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-26'
disposition: create-contract
resolved_at: '2026-07-27T15:16:43.576Z'
contract: T-017
---
# F-005 — UI has no dedicated detail view for tickets or findings (only packages do)

## Observation

UI has no dedicated detail view for tickets or findings (only packages do).

## Evidence

On 2026-07-26, reviewing ui/src/App.tsx (rebuilt console UI, v0.2.x): clicking an entity id routes through openEntity() (App.tsx:870), which only switches stage — it never opens a full entity detail view. Per entity:

- Ticket: no contract view. In the Shape stage, clicking a ticket id reveals nothing beyond its row; the full contract (outcome / scope / acceptance / verification) is reachable only via the raw read-only SourceDrawer (App.tsx:768), or partially via the Run-stage RunRow expansion (App.tsx:539), which shows acceptance + verification only. The v0 'ticket brief' drawer (ui/spec-assets/03-ticket-drawer-brief.png) was dropped in the rebuild.
- Finding: InboxStage (App.tsx:214) expands only the evidence/observation section inline; there is no full finding detail (impact hypothesis, confidence, suggested disposition, provenance/discovered_during).
- Package: PackagesStage (App.tsx:373) is the only entity with a real master-detail panel.

ui/UX-SPEC.md specifies these detail surfaces (§4.3 finding, §4.4 package detail, §4.5 ticket acceptance-vs-evidence) but there is NO visual design deliverable for a unified ticket/finding detail view, and no existing finding or ticket tracks the gap. This finding requests a design for consistent ticket + finding detail views, aligned with the existing package detail panel and UX-SPEC §4.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
