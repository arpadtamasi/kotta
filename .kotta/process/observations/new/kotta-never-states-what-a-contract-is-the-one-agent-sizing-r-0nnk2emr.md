---
id: F-01m0ajs9kn72tenfgg0nnk2emr
title: >-
  Kotta never states what a contract is: the one-agent sizing rule is enforced
  in three places and written down in none
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-18'
---
# F-01m0ajs9kn72tenfgg0nnk2emr — Kotta never states what a contract is: the one-agent sizing rule is enforced in three places and written down in none

## Observation

Kotta never states what a contract is: the one-agent sizing rule is enforced in three places and written down in none.

## Evidence

Found on 2026-08-18 while discussing why contracts are hard to read. The operator stated the definition from scratch in chat — "a contract egy agent által önállóan végrehajtható feladat" — and the repository was then searched for it. It is not there.

WHERE THE DEFINITION IS NOT. Neither README.md, .kotta/AGENTS.md, templates/AGENTS.md nor any of the 16 files in .kotta/decisions/ contains a sentence defining what a contract is or how big one should be. `grep -rin "independently executable"` over the whole repository returns exactly one hit: skills/define-contract/SKILL.md:12, "Propose the smallest independently executable outcome, bounded scope, non-goals…". That is step 3 of a numbered procedure, not a definition — and .kotta/AGENTS.md states the skills are optional: "If they are not installed, the CLI above is the whole contract; nothing depends on the skills being present." So the closest thing to a definition of Kotta's central concept is procedural, optional, and stated nowhere else.

WHERE IT IS ENFORCED ANYWAY, THREE TIMES.
(1) D-009 fixes the execution model: every contract runs in a fresh agent context receiving only the brief, and the coordinator never carries contract work in its own context. That determines how much a single executor can hold.
(2) src/commands/contract.ts:596 sets `warnTokens = 12000` and warns above it — a concrete number asserting when a brief, and therefore a contract, is too large.
(3) .kotta/AGENTS.md rule 8 gives the negative test: "If the brief plus the code in the worktree is not enough to finish the contract, the contract is incomplete."
Three mechanisms guard a rule none of them states. Nothing can be measured against it, so contract size and shape drift with no reference point.

WHY IT WENT MISSING. D-01kz240dn155hb97h6px6n2p85 (2026-08-02, "A szótár lezárva") settled the name deliberately and against `task`: "A task munka; a contract megállapodás, acceptance-szel és bizonyítékkal. A Kotta alapállítása pont ez — a 'task' gyengítené a terméket a saját állításában." The reasoning is sound and the name is the right one, but it fixes only the agreement half of the concept. The chosen word foregrounds acceptance and evidence and does not prompt anyone to write the sizing half — which is precisely the half that was never written. Two weeks later the operator re-derived it from zero, which is what surfaced this gap.

SUPPORTING MEASUREMENT. Splitting .kotta/defined/one-operation-registry-derives-both-the-cli-and-the-mcp-surf-06fw8n0g.md by section: 1161 words (72%) are work-order and agreement material (Scope, Invariants, Excluded redesign, Verification, Acceptance, Constraints, Non-goals, Execution notes) against 448 words (28%) of description (Outcome, Current structural problem, Demonstrated cost or risk, Target structural property). The document already behaves as the name says, which is evidence for keeping `contract` and against a third rename — the missing piece is the sizing rule, not the word.

RELATED BUT DISTINCT. F-…cdtrdt8d ("The define-contract skill never says what 'complete' means") concerns whether a contract carries everything its executor needs relative to the calling conversation. This observation concerns what a contract *is* — the unit of work it represents and how it is bounded. A contract can be complete in that sense and still be the wrong size, and neither rule is written down.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
