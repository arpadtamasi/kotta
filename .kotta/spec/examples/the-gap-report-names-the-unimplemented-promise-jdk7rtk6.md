---
id: EX-01m0fpqfysk1bwdr53jdk7rtk6
form: example
title: "The gap report names the unimplemented promise"
subjects:
  - UC-01m0fpqfxjvet99wbz0v1ag64q
---

## Given

An accepted spec whose observation lifecycle names an amend-spec disposition, and a CLI that does not yet offer it.

## When

The operator asks for the implementation gap.

## Then

The report names "Observation lifecycle" and the missing disposition, reading the repository only and writing nothing. The follow-up task is defined from that entry - and a repeated run against the unchanged repository yields the same bytes.
