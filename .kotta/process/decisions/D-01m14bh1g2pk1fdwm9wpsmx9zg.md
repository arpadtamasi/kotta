---
id: D-01m14bh1g2pk1fdwm9wpsmx9zg
title: 'Evidence is a citation, and the citation is part of the agreement'
date: '2026-08-28'
approved_by: cli
approved_at: '2026-08-28T14:14:07.617Z'
approval_basis: 'CLI --approve: decision.create'
---
# D-01m14bh1g2pk1fdwm9wpsmx9zg — Evidence is a citation, and the citation is part of the agreement

## Decision

A promise is evidenced when the site that keeps it names the node id. The gap report looks for that
id and nothing else, because the check has to be fast and exact: a string search over the base ref
is deterministic, needs no interpretation, and gives the same answer to every reader.

That makes the citation a term of the agreement rather than a detail of the report. A site that
keeps an accepted promise names the node it keeps, and where it does not, the promise is
unaccounted for however well the code behaves.

## Context

A project reported nineteen UNADMITTED_PROMISE entries for nodes that were functionally satisfied -
the secrets really were in Secret Manager, the slug really was an enum - because no task had
introduced the convention of naming the node id at the site. Measured in src/commands/gap.ts:287,
evidence is files.filter(file => file.text.includes(node.id)). This repository adopted the
convention early, which is why its own count reads zero, and nothing ever stated it to anyone else.

The alternative was to have the report recognise more than an identifier match. It was rejected on
the operator's reasoning: the check must be quick to run and quick to trust.

## Consequences

The convention has to be said out loud, in the specification and in the rules every project's
agents read, because it is now something a task can fail to do rather than a habit this repository
happens to have. The refusal stops advising the reader to implement a promise they have already
kept, and asks for the citation it actually looked for. The cost is accepted deliberately: a
correct implementation with no citation reads as unaccounted, and that is the price of an answer
every reader can reproduce in one pass.
