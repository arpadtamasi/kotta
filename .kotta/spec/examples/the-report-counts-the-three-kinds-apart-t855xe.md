---
id: EX-01m0swjgrrnzqgx83v95t855xe
form: example
title: "The report counts the three kinds apart"
subjects:
  - BR-01m0swjgrreeby1pyfdzf4mf7d
---

## Given

A workspace holding one admission of each kind — a use case admitted as structural, a rule admitted as unexamined, and an example admitted as unimplemented — beside a node with evidence.

## When

`kotta gap` runs.

## Then

It reports the three counts separately rather than one total, and lists each admission under its own kind with its reason. An admission whose entry names no kind fails the command the way an unadmitted promise does, naming the node and the kinds it may choose from.
