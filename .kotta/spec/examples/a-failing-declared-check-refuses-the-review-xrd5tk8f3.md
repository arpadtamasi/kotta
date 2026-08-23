---
id: EX-01m0m33yxvyppm683xrd5tk8f3
form: example
title: "A failing declared check refuses the review"
subjects:
  - BR-01m0m33yxt2vqxb3jvqc186ssy
  - UC-01m0f0wn89dy38s6whbfa0jafn
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

An active task whose acceptance condition "Filtered export is produced" is submitted with the evidence `run: npx vitest run tests/export.test.ts`, and that test currently fails.

## When

The executing agent runs `kotta task review` with that evidence mapping.

## Then

The submission is refused naming the check and the non-zero exit code; the task stays active with its claim, and nothing is written to the review evidence. When the test is fixed and the same submission repeats, the command exits zero and the recorded evidence carries the command, the commit it ran on, and `exit 0`.
