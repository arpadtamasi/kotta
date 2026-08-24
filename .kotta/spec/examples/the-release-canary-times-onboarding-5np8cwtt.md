---
id: EX-01m0f0wn8ajef1v52n5np8cwtt
form: example
title: "The release canary times onboarding"
subjects:
  - QA-01m0f0wn89h953x7kv3yykfept
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A release candidate and a fresh environment with Node, Git, and the supported host installed.

## When

The canary walks the documented path: install the package, sync the skills, init a repository, define the first task.

## Then

The path completes within five minutes and the measured result is recorded with the release; a regression fails the release, not the user.
