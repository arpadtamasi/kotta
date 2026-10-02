---
id: BR-01m0qtshfqhcrrqtz051zm9svr
form: business-rule
title: "Every accepted promise is kept or admitted"
capability: evidence
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P1"
    - ".kotta/changes/fejlesztes-az-archive-elott/proposal.md · Why"
  quote: "rp, 2026-10-01 18:02 UTC: 1 ok / 2 ok / 3 ok — after 17:46 UTC: a gap tulajdonképpen kód -> change, ugye?"
  inferred: "The operator named the direction and accepted the agent's proposals on how the open change is asked for, which commit is read and that archive refuses. That the open change is counted apart, is not refused over by the gap report and needs no admission until archive were supplied by the agent."
---

## Rule

An accepted specification node either has evidence — code, a test, or a command definition naming it by its id — or it declares an accepted implementation gap saying why it does not yet. There is no third state. Evidence SHALL be what keeps or checks the promise — code, a test, a command definition — and never what states or copies it: the specification and every copy of it, in the workspace, in a change, in the archive or in a generated narrative, MUST NOT count as evidence. `kotta gap` refuses a workspace holding one: it names each node that is neither, says where evidence was sought, and exits non-zero. Admitting a gap does not dispose of a promise. It is a readable statement that the promise stands and is not yet kept, and removing the admission is part of the work that keeps it.

A promise is evidenced by citation: the site that keeps it names the node id, and the report looks for that identifier and nothing else, because the check has to be fast and exact (D-01m14bh1g2pk1fdwm9wpsmx9zg). Naming the node is therefore a term of the agreement, not a habit of this repository: a task that keeps a promise without citing it leaves the promise unaccounted for, however well the code behaves, and the refusal asks for the citation rather than for an implementation the reader may already have written.

A promise whose work has not begun is not an unaccounted one. Where an agreement lands before the code that keeps it - which the advised order no longer does, and nothing forbids - the ratchet asks what is true of each node, not whether it is implemented yet, and a workspace that has just written its specification is not refused for having written it. What the ratchet exists to stop is a promise nobody has accounted for, and "the work has not started" is an accounting.

The promises of an approved change that is still open are measured the same way and counted apart. `kotta gap` SHALL name, unasked and in a section per change, each node of such a change's delta that no code, test or command definition names yet on the commit that is checked out: that list is the work that remains in the change. It SHALL NOT refuse over them, and they need no admission while the change is open; an admission is written only for what is still unkept when the change is archived, and `kotta archive` refuses a change that holds a node which is neither.

## Rationale

Coverage already binds the front of the lifecycle: a task cannot become defined until every acceptance condition cites a node that has landed. Nothing bound the other end, so the number of accepted promises with no evidence could only grow. On the day this rule was written it stood at 108 of 119 nodes; eleven were named anywhere in the repository.

Driving that number to zero is not the remedy and would be the opposite of one — writing node ids into comments produces exactly the narration this project keeps removing. The remedy is to make the number a choice. Every promise sits in one of two columns, and a promise reaches the admitted column only when someone writes down why it is there.

## Scope

`kotta gap`, and the specification nodes it reads: the accepted ones, and those of an approved change that is still open. Not `validate`, which never reads the repository tree and would have to scan all of it to answer this. Not the task lifecycle: no gate moves, no task changes shape, and a task's coverage map means what it meant before.
