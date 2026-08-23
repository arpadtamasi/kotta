---
id: EX-01m0pw5bc716gdz5qbb8yv6t2m
form: example
title: "A failed validation is not printed as completed"
subjects:
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
---

## Given

A workspace holding two specification nodes that violate their form's edge rules.

## When

An operator runs `kotta validate` without `--json`.

## Then

The output names each violated rule and the file it is in, and the command exits non-zero. No line reports that the command completed. The same run with `--json` carries the identical error set: the two renderings differ in form, never in outcome.
