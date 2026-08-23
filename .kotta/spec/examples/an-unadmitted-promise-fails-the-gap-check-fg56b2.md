---
id: EX-01m0qtshfq4gx91qt7zhfg56b2
form: example
title: "An unadmitted promise fails the gap check"
subjects:
  - BR-01m0qtshfqhcrrqtz051zm9svr
---

## Given

Three accepted specification nodes: one a test names by id, one whose frontmatter admits an implementation gap with a reason, and one that has neither.

## When

`kotta gap` runs.

## Then

It names the third node and where evidence was sought, and exits non-zero. The first is reported as evidenced and the second as an admitted gap, and neither contributes to the refusal. Adding the missing admission, with its reason, is enough to make the command pass — and says in the node itself that the promise is not yet kept.
