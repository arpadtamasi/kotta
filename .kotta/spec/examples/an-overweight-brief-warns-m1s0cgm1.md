---
id: EX-01m0f0wn8ah2ghnvh7m1s0cgm1
form: example
title: "An overweight brief warns"
subjects:
  - QA-01m0f0wn8981atnptrbdqa19y2
---

## Given

A task whose assembled brief is far above the default 12,000-token threshold.

## When

The brief is assembled.

## Then

The deterministic content is produced with its approximate token count and a warning that the task is probably too large or under-referenced - a prompt to split or reference, never to widen the executor's context.
