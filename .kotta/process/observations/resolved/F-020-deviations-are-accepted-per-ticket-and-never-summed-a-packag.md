---
id: F-020
title: >-
  Deviations are accepted per ticket and never summed — a package of green
  tickets delivered non-working software
status: resolved
origin: agent
observation_type: process
confidence: high
severity: high
discovered_during: null
created_at: '2026-08-01'
disposition: attach-existing
resolved_at: '2026-08-02T15:04:29.248Z'
---
# F-020 — Deviations are accepted per ticket and never summed — a package of green tickets delivered non-working software

## Observation

A deviation is judged where it appears: inside one ticket, against that ticket's scope. Each is small and defensible there. Nothing adds them up at package level, so a package can pass every ticket and still ship nothing that runs.

## Evidence

oneanda P-018, closed 2026-08-01. Thirteen domain modules delivered, individually and jointly tested (542 mcp tests green, typecheck clean, 411 flutter tests). Every ticket closed with accepted evidence.

The package's own closing finding (oneanda F-041) states it plainly: the persistence and UI wiring is missing at **eight** points — the generator's session write, ad-hoc PRACTICE ONCE history, proposal storage, the Library HTTP endpoint and Saved persistence, the weekly view's daily input, activation events, and the plan snapshot. And the cause, in the finding's own words: *"minden érintett ticket Scope-ja a saját domain-szerződésére összpontosított, és a perzisztencia-fejezet egyikben sem volt külön acceptance-pont; a ticketek review-evidenciái ezt egyenként nevesítik deviációként."*

So the information was present, per ticket, at review time. Eight separate accepted deviations composed into "the package delivered the decision chain, not the working feature". The operator found out by opening the app and not seeing the feature.

This is a package-level blind spot, not a ticket-level failure. Every individual accept was reasonable.

## Impact hypothesis

The unit of truth is the ticket, but the unit the human cares about is the package. Without aggregation, A-Team can report a fully green package for software that does not run — which is the most expensive possible failure mode, because it is discovered last.

## Confidence

High: the package, its tickets, and its own post-mortem finding are all in the workspace.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Direction: a package cannot close while any member's deviations are unresolved — the accepted deviations roll up into a package-level list that must be explicitly dispositioned (accepted as debt, or turned into a wiring ticket) before the package is done. Relates to D-004's missing `assess` gate: the goal is not achieved because its tickets are done.
