---
id: EX-01m0f0wn8ah2ghnvh7m1s0cgm1
form: example
title: "An overweight brief warns"
subjects:
  - QA-01m0f0wn8981atnptrbdqa19y2
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A task whose assembled brief is far above the default 12,000-token threshold.

## When

The brief is assembled.

## Then

The deterministic content is produced with its approximate token count and a warning that the task is probably too large or under-referenced - a prompt to split or reference, never to widen the executor's context.
