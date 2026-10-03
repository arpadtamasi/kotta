---
id: BR-01m3cqmtfyrpdzcppvy0565652
form: business-rule
title: The report names what it did not count
capability: evidence
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md · J1"
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/proposal.md · Why"
  quote: "rp, 2026-10-03 08:28 UTC: a"
  inferred: "The seventh class follows from the operator's choice (a); its name `agent-tooling` was chosen by the agent."
---

## Rule

`kotta gap` and `kotta modules` SHALL name the sources they excluded from evidence, by path class. There are seven classes: `workspace` (`.kotta/`), `openspec-change`, `openspec-archive`, `openspec-spec`, `published-spec` (a package's `kotta-spec/`), `dependency` (`node_modules/`) and `agent-tooling` (the agent hosts' directories at the repository root). Beside each node at level `none` the report SHALL say which excluded classes mention it, and the head of the report SHALL summarize the exclusions once; every class, `published-spec` included, follows the same rule. In the `--json` output this SHALL be the field `excluded`. The human-readable output SHALL name the exclusions in one summary line.

## Rationale

Excluding the specification's copies drops every node they alone mention to `none` — on the measured project, 184 cited nodes to 0. Without the classes named, "why is this node none?" has no answer in the report, and the reader goes looking for a defect. The classification is cheap: the id search is the same, only the hit is sorted differently.

## Scope

The `--json` and the human-readable output of `kotta gap` and `kotta modules`. The exclusion itself is stated in *A copy of the specification is not evidence*.
