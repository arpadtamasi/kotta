---
id: SM-01m0f0wn89gjy6dbk1j6fjpv6j
form: state-machine
title: "Contract lifecycle"
entity:
  - E-01m0f0wn898ayyrvy613zjx3ye
---

## Governed lifecycle

How one contract moves from captured intent to a terminal record, and which transitions are human gates.

## States

backlog (captured, not yet executable) - defined (validated and human-signed) - active (claimed, isolated, executing) - review (submitted with evidence) - done (terminal, with resolution completed, cancelled, duplicate, or obsolete).

## Transitions

backlog -> defined: define + validate + human sign (gate). defined -> active: start or execute creates claim, branch, worktree. active -> review: submit with acceptance-to-evidence mapping. review -> done(completed): human close after accepted review and integration (gate). any state before done -> done(cancelled/duplicate/obsolete): human cancel with reason, naming the successor for duplicate and obsolete (gate). Two gated ways back: reopen from review returns the contract to active with its claim (changes requested; the review evidence is withdrawn), and reopen from done returns it to backlog with its resolution and branch cleared (gate). There is no other path and no silent transition.
