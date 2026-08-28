---
id: F-01m149fa1y9hg036ewp9dse950
title: 'The gap measures whether a node id is cited, not whether the promise is kept'
status: resolved
origin: human
observation_type: risk
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
disposition: amend-spec
resolved_at: '2026-08-28T14:14:46.213Z'
approved_by: cli
approved_at: '2026-08-28T14:14:46.213Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - BR-01m0qtshfqhcrrqtz051zm9svr
---
# F-01m149fa1y9hg036ewp9dse950 — The gap measures whether a node id is cited, not whether the promise is kept

## Observation

The gap measures whether a node id is cited, not whether the promise is kept.

## Evidence

Reported from a project on 2026-08-27: 19 UNADMITTED_PROMISE for nodes that are functionally satisfied - 'a titkok tenyleg Secret Managerben vannak, a slug tenyleg enum' - because 'a riport az id explicit emliteset keresi tesztben vagy doc-kommentben, es ezt egyik task sem vezette be'. Measured here: src/commands/gap.ts:287 computes evidence as files.filter(file => file.text.includes(node.id)) - a plain string search for the identifier, nothing more. So the report's signal is a citation convention: a site that keeps a promise must also name the node it keeps. This repository adopted that convention early, every enforcement comment carries a BR id, which is why its own count reads zero; nothing states the convention to a project that has not, and the refusal that names UNADMITTED_PROMISE tells the reader to implement the node or admit a gap, neither of which is what is actually missing. A promise can be kept perfectly and reported as unaccounted, which is the one thing the ratchet must not do if its number is to be believed.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
