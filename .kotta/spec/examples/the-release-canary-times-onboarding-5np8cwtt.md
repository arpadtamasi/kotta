---
id: EX-01m0f0wn8ajef1v52n5np8cwtt
form: example
title: "The release canary times onboarding"
subjects:
  - QA-01m0f0wn89h953x7kv3yykfept
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A release candidate and a fresh environment with Node, Git, and the supported host installed.

## When

The canary walks the documented path: install the package, sync the skills, init a repository, define the first task.

## Then

The path completes within five minutes and the measured result is recorded with the release; a regression fails the release, not the user.
