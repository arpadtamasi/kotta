---
id: EX-01m40e0bkfgmn68mjppatt5yag
form: example
title: "The rules file does not name OpenSpec, not even to forbid it"
capability: planning-phase
subjects:
  - BR-01m40e0avfnth9evktzafbhr7w
provenance:
  level: stated
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · SZ2"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P3"
  quote: "rp, 2026-09-29: „openspec/ mappát soha ne hozz létre … miről jutna eszébe csinálni?”"
---

# The rules file does not name OpenSpec, not even to forbid it

## Given

A fresh workspace created by `kotta init`.

## When

The rules file `.kotta/AGENTS.md` is read.

## Then

It says where a change lives and how it opens; it contains none of „openspec”, „opsx”, „observation”, „batch”, „process layer” or „decision record”.
