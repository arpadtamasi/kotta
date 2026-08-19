---
id: F-017
title: >-
  Findings caused by an earlier ticket's under-specification are never written
  back — the ticket corpus decays instead of staying regenerable
status: new
origin: human
observation_type: improvement
confidence: high
severity: high
discovered_during: null
created_at: '2026-07-31'
---
# F-017 — Findings caused by an earlier ticket's under-specification are never written back — the ticket corpus decays instead of staying regenerable

## Observation

A large share of findings are not bugs in the world — they are the delayed cost of a ticket that did not say enough. The finding names a gap, a new ticket fixes the CODE, and the original ticket keeps its incomplete text forever. The repair lives only in the diff. The specification drifts away from the software it produced.

## Evidence

Operator observation on a live findings queue (2026-07-31). Findings such as "the vendored v2 validator and Library JSON still use pre-T-086 STICK_CONTROL names/IDs" (F-037) or "the ReadTake facade does not carry the device and partialReason fields" (F-039) carry a `discovered_during` pointer to the ticket that was running when they surfaced — but that pointer records WHEN the finding appeared, not WHICH ticket's definition was insufficient. Those are different questions and A-Team only models the first.

Today the loop is: finding → new ticket → code changes → finding resolved. The originating ticket is never amended. After N rounds the ticket corpus describes an app that no longer exists, and the only complete description of the system is the source itself. That is exactly how a codebase becomes legacy: the spec stops being able to reproduce it.

The operator's proposal turns this around: if the repair is written back into the ticket that under-specified it, the ticket corpus stays a COMPLETE and CURRENT specification. Then the code becomes regenerable — the whole app can be rebuilt from the tickets in one pass, on a newer stack or a newer model, without carrying the accumulated patch history. The code becomes disposable; the tickets become the asset.

This needs a distinction A-Team does not have yet:
- `discovered_during` — the ticket that was running (already modelled)
- `caused_by` — the ticket whose definition was insufficient (missing)

And a disposition A-Team does not have yet: amend the originating ticket, versioned, with the finding as provenance — instead of only spawning a forward-fix ticket. Note the tension to resolve: done tickets are currently immutable, so writing back needs an explicit amendment model rather than a silent edit.

## Impact hypothesis

Without write-back, ticket text is a historical record instead of a live specification. Regeneration is impossible, the same gap gets re-discovered by later tickets, and A-Team's core claim — that the markdown corpus is the source of truth — quietly stops being true.

## Confidence

High: the causal field does not exist in the schema, and no skill amends an originating ticket.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Likely first slice: add `caused_by` to the finding schema and have `validate-finding` ask the question, before any amendment machinery is built.
