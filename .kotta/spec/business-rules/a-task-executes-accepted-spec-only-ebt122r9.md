---
id: BR-01m0fp2hdkqz08arp5ebt122r9
form: business-rule
title: "A task executes accepted spec, and nothing else"
---

## Rule

A task executes accepted specification, and nothing else: its acceptance conditions are covered by the spec nodes it references. When execution meets a need or a choice outside that coverage, the task raises an observation - it never widens itself, and it never creates agreement.

## Rationale

When every task is covered, one close gate is enough: the agreement gate already happened when the spec landed. The moment a task could extend the agreement, every gate would have to interrogate every task again.

## Scope

All execution, fresh or inherited. Define refuses a task whose acceptance is not covered. The uncovered need travels the human line - observation, disposition, spec amendment or decision - and the landed delta yields the next task.
