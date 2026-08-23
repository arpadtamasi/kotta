---
id: EX-01m0fpqfysk1bwdr53jdk7rtk6
form: example
title: "The gap report names the unimplemented promise"
subjects:
  - UC-01m0fpqfxjvet99wbz0v1ag64q
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

An accepted spec whose observation lifecycle names an amend-spec disposition, and a CLI that does not yet offer it.

## When

The operator asks for the implementation gap.

## Then

The report names "Observation lifecycle" and the missing disposition, reading the repository only and writing nothing. The follow-up task is defined from that entry - and a repeated run against the unchanged repository yields the same bytes.
