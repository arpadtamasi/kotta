---
id: EX-01m0mzvcvdvxzpr59p8v7387n3
form: example
title: "A captured task is drafted in place"
subjects:
  - SM-01m0f0wn89gjy6dbk1j6fjpv6j
---

## Given

A backlog capture whose acceptance list has a typo, in a workspace with no spec node covering it yet.

## When

The agent runs `kotta task define <id> --draft --from <corrected.md>`.

## Then

The stored file carries the corrected text and stays in backlog; a changed title renames the file within `process/tasks/`; no coverage is demanded and no spec reference is required. The same definition submitted without `--draft` is refused until every acceptance condition cites a landed specification node, and `--draft` on a task that already left backlog is refused — a defined task is amended only at full definition strength.
