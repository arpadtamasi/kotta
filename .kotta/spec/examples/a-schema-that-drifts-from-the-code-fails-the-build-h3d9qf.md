---
id: EX-01m0sj2f8m02k71b0d5ph3d9qf
form: example
title: "A schema that drifts from the code fails the build"
subjects:
  - BR-01m0sj2f8mxydc7zxz6y8xn6b1
---

## Given

A published schema whose permitted values for a field, or whose list of required fields, no longer match the constant the code enforces — the ordinary result of adding a value on one side of the pair.

## When

The suite runs.

## Then

It fails, naming the schema, the field, and which side carries the value the other lacks. The check reads the shipped schema file itself, so a suite that passes is evidence about what Kotta publishes rather than about a copy kept beside the test.
