---
id: EX-01m0zx29x1pnyjsa5dyg4dc6n5
form: example
title: "An unpublished version is never advertised"
subjects:
  - BR-01m0zx29x1nvccpr4xwyhjr153
---

## Given

A repository whose package declares 0.10.0, whose README still says 0.9.0 - tagged once and never published - and whose site still says 0.7.0.

## When

The published surfaces are checked against the package.

## Then

The check names each surface whose version differs from the declared one and fails, so the disagreement cannot survive a release. After the surfaces are brought into step, installing the version they name succeeds from a clean machine.
