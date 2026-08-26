---
id: EX-01m0xt48tj8p7jm88vp8n22hjh
form: example
title: "A remedy that adds a capability amends the specification"
subjects:
  - BR-01m0xt48tjhkd5pxv30p6c7a46
accepted:
  - >-
    unimplemented: Examined on 2026-08-26 when this example was written. Kotta cannot check it: nothing in the tool reads a proposed remedy, compares it against the accepted specification, and judges whether the disposition chosen was the right one. The rule it illustrates reaches agents as instruction - rule 3 of the shipped rules file and step 4 of validate-observation - and is kept by reading, not by refusal. This is what a test would assert if the judgement were mechanisable; until then the admission says so rather than an id written into a comment saying otherwise.
---

## Given

An observation that a release left the workspace rules file permanently drifted, and an accepted rule saying Kotta keeps that file current and reports a hand-edited copy as drifted rather than replacing it.

## When

The remedy is chosen: a deliberate command that discards the local edits and takes Kotta's copy, and a refusal that names it.

## Then

The disposition is amend-spec, because the accepted rule promises the opposite of what the remedy does and says nothing about drift having an exit at all. The amended rule states the exit, and the task follows from it. Had the remedy been only to stop the release from editing the file by hand - restoring behaviour the rule already promised - a plain task would have been the right exit, and the argument for it would have been that nothing new was promised.
