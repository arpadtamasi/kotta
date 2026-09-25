---
id: BR-01m3cqmtfyrpdzcppvy0565652
form: business-rule
title: The report names what it did not count
capability: evidence
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Requirement: A jelentés kimondja, mit nem számolt"
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 2. A kizárt említések nem tűnnek el, hanem megneveződnek"
    - "openspec/changes/bizonyitek-csak-kodbol/tasks.md · 1.2"
  quote: "A `gap` és a `modules` jelentés `--json` kimenete SHALL megnevezni a bizonyítékból kizárt forrásokat (útvonal-osztályok szerint)"
---

## Rule

The `--json` output of `kotta gap` and `kotta modules` SHALL name the sources it excluded from evidence, by path class — `openspec-change`, `openspec-archive`, `openspec-spec`, `published-spec` —, and SHALL say beside each node at level `none` which excluded class mentions it, so the reason a node reads `none` can be read from the report itself.

## Rationale

Excluding the specification's copies drops every node they alone mention to `none` — on the measured project, 184 cited nodes to 0. Without the classes named, "why is this node none?" has no answer in the report, and the reader goes looking for a defect. The classification is cheap: the id search is the same, only the hit is sorted differently.

## Scope

The `--json` output of `kotta gap` and `kotta modules`. The exclusion itself is stated in *A copy of the specification is not evidence*.

## Open decisions

- What is the field called in the `--json` output: `excluded`, `excludedMentions`, or another name? Neither the proposal nor the design names it.
- Where are exclusions reported: only beside each `none` node (the design's words), or also beside a cited node that an excluded source mentions too, and/or once per report as a summary of the excluded classes? The same question for the existing `published-spec` (`kotta-spec/`) class: per node or per report?
- Are mentions under `.kotta/` and `node_modules/` also named, as classes of their own, or only the four classes the design lists?
- Does the human-readable output say it as well, or only `--json`, as the proposal writes?
