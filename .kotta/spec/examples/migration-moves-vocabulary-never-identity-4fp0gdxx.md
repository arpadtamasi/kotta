---
id: EX-01m0f0wn8axw5hjaed4fp0gdxx
form: example
title: "Migration moves vocabulary, never identity"
subjects:
  - UC-01m0f0wn89x00jkpqpqc2esx9h
  - BR-01m0f0wn89c50fe1mz5yn1nw85
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A pre-rename workspace: the old directory name, findings/ready/packages vocabulary, sequential ids like T-034.

## When

A dry run lists every change; the migration applies them; the command runs a second time.

## Then

The shape and vocabulary are current, the id set before and after is identical - the command refuses to lose one - and the second run reports the workspace already current. Until then, every other command refuses the old shape by naming the migrate command.
