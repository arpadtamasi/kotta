---
id: BR-01m0fp2hdkfn519h1w84jsrqbe
form: business-rule
title: "The spec is the agreement"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
  quote: "rp, 2026-10-01 18:02 UTC: 5 ok"
  inferred: "The accepted rule is unchanged but for one added sentence, proposed by the agent and accepted by the operator: between approval and archive the approved delta binds for what it touches."
---

## Rule

The specification on the base branch is the accepted agreement. Shaping is free; landing on the base branch, on a human yes, is the acceptance. Between a change's approval and its archive, the approved delta SHALL be the agreement for the nodes it touches: the code that builds the change is held to the approved text, not to the accepted text it replaces, and everything the delta does not touch stays as accepted. A spec node carries no versioning of its own - no version field, no status, no changelog: every node states the current agreement in the present tense, and Git history is the versioning. (The form registry's files version the form, never the agreement.) Work is promised, bounded, and judged by spec nodes; a task only executes them.

## Rationale

One place holds the promise, and it is versioned by the repository itself - reviewable, diffable, shared. When the agreement lives in the spec, the work unit can stay light, and each accepted landing arrives as a delta: the diff names exactly what changed, so the delta is what generates the work.

## Scope

The whole spec namespace. Amendments arrive through shaping or through an observation's amend-spec disposition; acceptance is the human-approved landing, and the landed delta yields the tasks. Tasks reference the nodes they execute; the define check verifies that coverage against the control checkout's spec directory - landing on the base branch is the human act of acceptance, not a mechanical comparison the check performs.
