---
id: EX-01m0m33yxvyppm683xrd5tk8f3
form: example
title: "A failing declared check refuses the review"
subjects:
  - BR-01m0m33yxt2vqxb3jvqc186ssy
  - UC-01m0f0wn89dy38s6whbfa0jafn
---

## Given

An active task whose acceptance condition "Filtered export is produced" is submitted with the evidence `run: npx vitest run tests/export.test.ts`, and that test currently fails.

## When

The executing agent runs `kotta task review` with that evidence mapping.

## Then

The submission is refused naming the check and the non-zero exit code; the task stays active with its claim, and nothing is written to the review evidence. When the test is fixed and the same submission repeats, the command exits zero and the recorded evidence carries the command, the commit it ran on, and `exit 0`.
