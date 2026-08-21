---
id: SM-01m0f0wn89gjy6dbk1j6fjpv6j
form: state-machine
title: "Task lifecycle"
entity:
  - E-01m0f0wn898ayyrvy613zjx3ye
---

## Governed lifecycle

How one task moves from captured intent to a terminal record, and which transitions are human gates.

## States

backlog (captured, not yet executable) - defined (validated, coverage-checked) - active (claimed, isolated, executing) - review (submitted with evidence) - done (terminal, with resolution completed, cancelled, duplicate, or obsolete).

## Transitions

backlog -> defined: define + validate - every required section present, Open decisions empty, and every acceptance condition covered by a spec node the task references that has landed on the control branch. By default there is no separate sign gate: the agreement was accepted when the referenced spec landed. A workspace that retains the compatibility gate (workflow.require_human_sign_approval) keeps the task in backlog until a human-approved sign (gate, receipt recorded), and its pre-coverage tasks keep their exemption from the coverage check. defined -> active: start or execute creates claim, branch, worktree - or, where the only checkout sits on an unprotected branch, adopts that branch and checkout, recording that it created neither. active -> defined: claim release (--force) returns the task, deliberately preserving branch and worktree so the next start resumes them. active -> review: submit with acceptance-to-evidence mapping. review -> done(completed): human close after accepted review and integration (gate, receipt recorded). any state before done -> done(cancelled/duplicate/obsolete): human cancel with reason, naming the successor for duplicate and obsolete (gate). Two gated ways back: reopen from review returns the task to active with its claim (changes requested; the review evidence is withdrawn), and reopen from done returns it to backlog with its resolution and branch cleared (gate). Until a claim exists, define may amend the task in place. There is no other path and no silent transition. A merge that leaves one task in two state directories is not a transition but damage; dedupe repairs it by keeping the furthest-advanced copy, under its own approval.
