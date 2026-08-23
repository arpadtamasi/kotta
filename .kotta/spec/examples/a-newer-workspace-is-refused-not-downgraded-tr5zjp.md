---
id: EX-01m0q89b1693yvwzx0j8tr5zjp
form: example
title: "A newer workspace is refused, not downgraded"
subjects:
  - BR-01m0q89b16xcfasfj1z8mc2hgg
---

## Given

A workspace whose configuration records a shape version higher than the one the installed Kotta implements — the ordinary result of upgrading Kotta in one checkout before another.

## When

Any command runs against it, including `kotta migrate` and `kotta migrate --dry-run`.

## Then

Each refuses, naming both versions and saying the workspace was written by a newer Kotta, with upgrading Kotta as the remedy. No migration plan is printed and nothing is written. The refusal does not call the workspace legacy and does not name `migrate`, because neither is true of this direction.
