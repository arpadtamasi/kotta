---
id: EX-01m0f0wn8ah2ghnvh7m1s0cgm1
form: example
title: "An overweight brief warns"
subjects:
  - QA-01m0f0wn8981atnptrbdqa19y2
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

A task whose assembled brief is far above the default 12,000-token threshold.

## When

The brief is assembled.

## Then

The deterministic content is produced with its approximate token count and a warning that the task is probably too large or under-referenced - a prompt to split or reference, never to widen the executor's context.
