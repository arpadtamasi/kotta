---
id: BR-01m3cqmtfyrpdzcppvy0565652
form: business-rule
title: The report names what it did not count
capability: evidence
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-09-26 (the operator's answers to the planning questions)"
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Requirement: A jelentés kimondja, mit nem számolt"
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 2. A kizárt említések nem tűnnek el, hanem megneveződnek"
    - "openspec/changes/bizonyitek-csak-kodbol/tasks.md · 1.2"
  quote: "rp, 2026-09-26, chat: beside the none-level nodes and once as a summary; workspace and dependency classes too, six in all; the human-readable output names them in one summary line."
  inferred: "The JSON field name `excluded` was chosen by the agent and not put to the operator: a field name is not a product decision."
---

## Rule

`kotta gap` and `kotta modules` SHALL name the sources they excluded from evidence, by path class. There are six classes: `workspace` (`.kotta/`), `openspec-change`, `openspec-archive`, `openspec-spec`, `published-spec` (a package's `kotta-spec/`) and `dependency` (`node_modules/`). Beside each node at level `none` the report SHALL say which excluded classes mention it, and the head of the report SHALL summarize the exclusions once; every class, `published-spec` included, follows the same rule. In the `--json` output this SHALL be the field `excluded`. The human-readable output SHALL name the exclusions in one summary line.

## Rationale

Excluding the specification's copies drops every node they alone mention to `none` — on the measured project, 184 cited nodes to 0. Without the classes named, "why is this node none?" has no answer in the report, and the reader goes looking for a defect. The classification is cheap: the id search is the same, only the hit is sorted differently.

## Scope

The `--json` and the human-readable output of `kotta gap` and `kotta modules`. The exclusion itself is stated in *A copy of the specification is not evidence*.

## Open decisions

None
