---
id: BR-01m0qtshfqhcrrqtz051zm9svr
form: business-rule
title: "Every accepted promise is kept or admitted"
---

## Rule

An accepted specification node either has evidence — code, a test, or a command definition naming it by its id — or it declares an accepted implementation gap saying why it does not yet. There is no third state. `kotta gap` refuses a workspace holding one: it names each node that is neither, says where evidence was sought, and exits non-zero. Admitting a gap does not dispose of a promise. It is a readable statement that the promise stands and is not yet kept, and removing the admission is part of the work that keeps it.

## Rationale

Coverage already binds the front of the lifecycle: a task cannot become defined until every acceptance condition cites a node that has landed. Nothing bound the other end, so the number of accepted promises with no evidence could only grow. On the day this rule was written it stood at 108 of 119 nodes; eleven were named anywhere in the repository.

Driving that number to zero is not the remedy and would be the opposite of one — writing node ids into comments produces exactly the narration this project keeps removing. The remedy is to make the number a choice. Every promise sits in one of two columns, and a promise reaches the admitted column only when someone writes down why it is there.

## Scope

`kotta gap`, and the specification nodes it reads. Not `validate`, which never reads the repository tree and would have to scan all of it to answer this. Not the task lifecycle: no gate moves, no task changes shape, and a task's coverage map means what it meant before.
