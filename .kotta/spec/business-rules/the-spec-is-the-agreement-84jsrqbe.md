---
id: BR-01m0fp2hdkfn519h1w84jsrqbe
form: business-rule
title: "The spec is the agreement"
---

## Rule

The specification on the base branch is the accepted agreement. Shaping is free; landing on the base branch, on a human yes, is the acceptance. A spec node carries no versioning of its own - no version field, no status, no changelog: every node states the current agreement in the present tense, and Git history is the versioning. (The form registry's files version the form, never the agreement.) Work is promised, bounded, and judged by spec nodes; a task only executes them.

## Rationale

One place holds the promise, and it is versioned by the repository itself - reviewable, diffable, shared. When the agreement lives in the spec, the work unit can stay light, and each accepted landing arrives as a delta: the diff names exactly what changed, so the delta is what generates the work.

## Scope

The whole spec namespace. Amendments arrive through shaping or through an observation's amend-spec disposition; acceptance is the human-approved landing, and the landed delta yields the tasks. Tasks reference the nodes they execute; the define check verifies that coverage against the control checkout's spec directory - landing on the base branch is the human act of acceptance, not a mechanical comparison the check performs.
