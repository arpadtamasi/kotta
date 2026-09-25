---
id: F-01m13v4tgdzbp2h2kqman0jzwt
title: >-
  An agent had to read Kotta's compiled CLI to learn what a specification node
  must contain
status: resolved
origin: human
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
disposition: amend-spec
resolved_at: '2026-08-28T13:32:28.788Z'
approved_by: cli
approved_at: '2026-08-28T13:32:28.788Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - UC-01m0f0wn89ny7vx515ke3ksnra
---
# F-01m13v4tgdzbp2h2kqman0jzwt — An agent had to read Kotta's compiled CLI to learn what a specification node must contain

## Observation

An agent had to read Kotta's compiled CLI to learn what a specification node must contain.

## Evidence

A first Kotta project on 2026-08-27, asked to turn a SPEC.md into spec nodes. The agent's own account of what it did: read all eleven form definitions to learn the required frontmatter, body headings and edges, then 'read the Kotta CLI source (registry.js, markdown.js) to see exactly what the validation does'. It then hand-generated ULIDs for a planned 44 nodes and stopped to ask whether 44 was the right granularity. The form registry is the contract and reading it is correct; reading the shipped dist to be sure is not. Nothing on either surface answers what a form requires - there is no command that describes a form, kotta validate only refuses after the file exists, and the workshop skills say to write the node with 'its registered ULID prefix and filename convention' without saying where that is stated. Two further costs the same account shows: an LLM spent effort producing 44 identifiers by hand where one command would mint them, and nothing anywhere says how fine a specification should be cut, so the agent had to ask.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
