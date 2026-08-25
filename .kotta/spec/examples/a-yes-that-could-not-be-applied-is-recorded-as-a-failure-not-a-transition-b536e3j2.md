---
id: EX-01m0vqr9k6w5923nksb536e3j2
form: example
title: "A yes that could not be applied is recorded as a failure, not a transition"
subjects:
  - BR-01m0vqr9k64ht9h70fpjy6rky9
---

## Given

A task in review whose close has been put to the operator, and a working tree that has since acquired uncommitted work.

## When

The operator answers yes, and the close refuses because the control plane is not clean.

## Then

The approval ends in its own failed phase carrying the error, the visible yes stays linked to it, and the task remains in review - the record never says done. Answering the same approval again returns that failed phase rather than retrying the close.
