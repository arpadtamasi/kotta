---
id: EX-01m0fpqfysk1bwdr53jdk7rtk6
form: example
title: "The gap report names the unimplemented promise"
subjects:
  - UC-01m0fpqfxjvet99wbz0v1ag64q
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

An accepted spec whose observation lifecycle names an amend-spec disposition, and a CLI that does not yet offer it.

## When

The operator asks for the implementation gap.

## Then

The report names "Observation lifecycle" and the missing disposition, reading the repository only and writing nothing. The follow-up task is defined from that entry - and a repeated run against the unchanged repository yields the same bytes.
