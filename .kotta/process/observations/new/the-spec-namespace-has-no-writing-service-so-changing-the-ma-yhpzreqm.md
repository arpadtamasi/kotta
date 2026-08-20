---
id: F-01m0f2wmyf10jrfge4yhpzreqm
title: >-
  The spec namespace has no writing service, so changing the material contracts
  are defined from can only happen as a contract
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0f2wmyf10jrfge4yhpzreqm — The spec namespace has no writing service, so changing the material contracts are defined from can only happen as a contract

## Observation

The spec namespace has no writing service, so changing the material contracts are defined from can only happen as a contract.

## Evidence

Observed 2026-08-20 in a Kotta-governed project (goschool). The human asked for the open-questions register to be tidied so the next contract could be defined. The agent's answer: 'Ebben a repoban a Kotta-szabaly szerint ez is contract, mert a kert specifikacio-takaritas ellenorizheto, elfogadott deliverable' — so it signed a 'Nyitott kerdesek regiszterenek takaritasa' contract and asked for the human gate, before the 'Monorepo scaffold' contract the cleanup was preparing for. Editing the specification became a contract whose definition depends on that same specification. The two shipped exemptions do not reach this case by construction: T-01kzwxfdabqvrtct2vzfzqzpfd (done) exempts process-only documentation and non-product tool or agent context, and T-01m00afb9wt2vrbs3qgrgv0mtw (in review) exempts standalone one-off generated artifacts that change no governed surface. The spec register is neither — it is governed repository material, so the gate keeps it inside. Structural cause: '.kotta/spec/' is a first-class namespace (12 node kinds, 82 nodes in this workspace; 'migrate' creates it and 'validate' reads it) but 'kotta --help' exposes no 'spec' command. Contracts, observations and decisions each have a service that writes their own lifecycle material without needing a contract for the act — 'contract new' and 'contract define' write to .kotta/ under no contract of their own. The spec has no equivalent, so an agent holding the 'never hand-edit .kotta/' rule has exactly one path left: wrap the edit in a contract. T-01m0bvztry5z4j3k72m9zs70ym (in review) makes contracts reference and validate spec nodes, which raises the stakes — it makes the spec load-bearing for definition and execution without giving it a way in.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
