---
id: EX-01m0t6j1pt1qn47e2ncx52dqjq
form: example
title: "A shared reason is given once"
subjects:
  - BR-01m0t6j1ptng5afw60aa77kk4x
---

## Given

A workspace where fifty nodes were admitted in bulk and carry the identical reason, beside two admitted individually with reasons of their own.

## When

`kotta gap` runs without `--json`.

## Then

The shared reason appears once, with the fifty named beneath it, and the two individual admissions keep their own text. Adding a fifty-first node to the bulk group lengthens the report by one name, not by a paragraph. The same run with `--json` still carries every admission's reason in full, because nothing there is reading it.
