---
id: D-01m0zxbm2k60g0apj2f5ke6pb8
title: 'Ceremony is constant, not proportional to stakes'
date: '2026-08-26'
approved_by: cli
approved_at: '2026-08-26T20:49:32.242Z'
approval_basis: 'CLI --approve: decision.create'
---
# D-01m0zxbm2k60g0apj2f5ke6pb8 — Ceremony is constant, not proportional to stakes

## Decision

The ceremony a task carries does not vary with its stakes. Every spec-covered task crosses exactly
one human gate, at close, whatever it touches; the tool never decides that a change is small enough
to need less of the human, nor that it is large enough to need more.

## Context

A backlog capture from 2026-08-21, "Ceremony scales with stakes", proposed varying it: less for a
typo, more for a schema migration. The accepted quality attribute Proportionate ceremony already
promises the opposite, and with numbers - exactly one human gate per spec-covered task, receipts on
100% of gated transitions, at most three steps from captured intent to executing agent. The two
readings could not both stand, so the choice went to the operator, who kept the constant one.

## Consequences

The proposal is settled, and the capture that carried it becomes what keeping the promise requires:
the three measures are asserted rather than assumed. Scaling ceremony would have meant the tool
deciding when not to ask the human - the one authority Kotta refuses to take, and the same
authority rule 5 exists to deny it. A constant gate is also the cheaper promise to keep honest: it
can be counted, and a count is a test. If a future case genuinely needs a second gate, it arrives
as an amendment with its reason, not as a rule the tool applies on its own judgement of stakes.
