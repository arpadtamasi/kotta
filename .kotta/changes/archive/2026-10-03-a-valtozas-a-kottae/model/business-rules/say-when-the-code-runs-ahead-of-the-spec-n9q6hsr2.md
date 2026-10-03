---
id: BR-01m3kdq88m3bgye3xnn9q6hsr2
form: business-rule
title: The code never runs ahead of the spec
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
    - "chat with the operator, 2026-09-28"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · E1"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P7"
  quote: "rp, 2026-10-03 08:51 UTC: „1a / 2a” (the distiller left the answer unpaired; it answers the two gate questions of 08:31 UTC)"
  inferred: "The operator chose that the code never runs ahead of the spec, for every project and every agent (option a). The wording of the rule, and keeping work that touches no promise outside it, are the agent's."
---
# The code never runs ahead of the spec

## Rule

An agent SHALL NOT write code that keeps, changes or drops a promise the accepted model does not state, unless an approved change states that promise. When asked for such work, the agent SHALL first open a change (`kotta change new`), bring it through planning to the one gate, and SHALL write the code only after the human's yes; it SHALL say so to the human in one line, naming the promise in plain words, instead of writing the code. Code that builds an approved change, still open, is not ahead of the spec: that promise has been through the gate. Work that touches no promise — documentation, a pure refactor — needs no change and no word about the spec.

## Rationale

A one-line signal was the rule until 2026-10-03, so that Kotta would not turn into a process engine. In practice the signal was not enough: twice in a week the code shipped first — a release, then a board feature proposed code-first — and the accepted model fell behind and had to be caught up afterwards. The operator decided that the code never runs ahead of the spec. The gate stays the one gate; what changes is that an agent reaches it before it writes the code, not after.

## Scope

Every agent working in a Kotta repository, on any host, on any change. The rule is the agent's, carried by the shipped rules file and the `plan-change` skill; the CLI does not see code being written and enforces nothing. `kotta gap` remains the after-the-fact measure of drift.
