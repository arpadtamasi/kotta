---
id: BR-01m0f1djtb5dkb76tjzq4x3ffh
form: business-rule
title: "Kotta owns its rules file, never the project's"
---

## Rule

Kotta fully owns .kotta/AGENTS.md: it writes it, keeps it current with the running package's real install line, and reports a hand-edited copy as drifted rather than replacing it. The project's own AGENTS.md belongs to the project - Kotta appends at most one referencing line, only after an explicit yes, idempotently; a non-interactive run never writes the project's file.

## Rationale

The rules must reach every project without a human copying them by hand - they once did not travel at all, install line included - but a generator that rewrites a project's own conventions file would lose exactly the trust the rules ask for (D-01kztp2e).

## Scope

kotta init and kotta sync, including sync --link-agents. Skill installation follows the same drift rule: a byte-identical copy is updated, an edited one is reported and left alone, and another tool's file under the same name is never overwritten.
