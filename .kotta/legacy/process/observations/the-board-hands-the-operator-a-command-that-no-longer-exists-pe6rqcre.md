---
id: F-01m160xnbayygms7y1pe6rqcre
title: >-
  The board hands the operator a command that no longer exists, because a third
  surface prints commands nothing derives or checks
status: resolved
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-29'
disposition: amend-spec
resolved_at: '2026-08-29T05:47:39.145Z'
approved_by: cli
approved_at: '2026-08-29T05:47:39.145Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - BR-01m0nsyasfnjc9s4073r8zb33j
---
# F-01m160xnbayygms7y1pe6rqcre — The board hands the operator a command that no longer exists, because a third surface prints commands nothing derives or checks

## Observation

The board hands the operator a command that no longer exists, because a third surface prints commands nothing derives or checks.

## Evidence

Measured on the running board (kotta ui, 2026-08-29). Two sites in ui/src/App.tsx print 'kotta task sign <id> --approve': line 642, the empty 'What runs next?' panel, and line 1534, the CLI fallback sheet under 'tasks'. Running it: "error: unknown command 'sign'". 'sign' is the pre-rename word for what is now 'task define'; the CLI, the MCP surface, the skills and the rules file all moved, and the board did not. Line 642's prose is inverted with it — 'Shape a backlog task until it validates, then define it' — when defining is what validates. Root cause: BR-01m0nsyasfnjc9s4073r8zb33j derives the CLI and MCP surfaces from one operation registry and asserts totality as a set comparison, and tests/integration/operation-registry.test.ts enforces it. The board's command strings are hand-written literals in a third surface that the rule's Scope does not name and no test reads, so a whole vocabulary rename passed it by unnoticed. Reported by the operator as 'A kotta ui meg a regi!'

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
