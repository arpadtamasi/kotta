---
id: F-01kzrc4apc1660d4z37c1nf5nw
title: A decision that makes a contract moot has no path out and leaves no trace
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-11'
---
# F-01kzrc4apc1660d4z37c1nf5nw — A decision that makes a contract moot has no path out and leaves no trace

## Observation

A decision that makes a contract moot has no path out and leaves no trace.

## Evidence

Measured on 2026-08-11 in goschool-web. The active contract "A három újonnan írt magyar útvonal és a kérdőív angol slugra mozgatása" became objectless — not half-finished, but moot — after a decision established that Hungarian pages keep Hungarian slugs on goschool.hu. Finishing it would implement the opposite of the standing decision; closing it as completed would record work that was never merged and never wanted.

Kotta has the word and not the path. cancelContract accepts resolutions duplicate | obsolete | cancelled (src/commands/contract.ts:309), so "obsolete" is exactly the outcome needed, but the command accepts only backlog and defined states (src/commands/contract.ts:316) and refuses outright when a claim exists (src/commands/contract.ts:319). An active contract therefore cannot reach it. reopen from review lands in active, where cancel refuses again — the loop recorded as F-01kzm9hppbvg3gxzj48xccqsm9. The three exits offered to the operator were: leave it active forever, close --approve as completed (a false record), or hand-edit .kotta/ (the rule the workspace forbids).

T-01kzhnsncw8znqdn14rf5d4tfp closes half of it: revise takes active to backlog, from where cancel accepts. That is a path, in two commands, and the first one misnames what happened — revise records that the definition was incomplete, when the definition was correct and the world moved on.

The second half is unrecorded anywhere. A decision can invalidate a contract, and the two never reference each other. D-s4z256xv killed the contract above; after any cancellation, the contract's frontmatter carries a bare resolution, the lifecycle event says "Contract cancelled with resolution obsolete", and the decision names nothing it superseded. The reason a piece of work was retired — the thing a reader six months later needs — is the one fact the workspace does not keep.

Distinct from F-01kzm9hppbvg3gxzj48xccqsm9 (abandonment from review, cause unrecorded) and from F-01kzhna04m3pnghkchc26y53yb (repairing an incomplete active contract): here the contract is active, its definition is sound, and the cause of death is a decision Kotta already stores.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
