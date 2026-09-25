---
id: BR-01m3cqmt9yrasdj92kky1kcx0n
form: business-rule
title: A copy of the specification is not evidence
capability: evidence
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/evidence/spec.md · Requirement: A specifikáció másolata nem bizonyíték"
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 1. Egy szűrő, egy szabály"
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 3. Modul-levezetés ugyanazon a szűrőn"
  quote: "A bizonyíték-szűrő SHALL kizárni a `.kotta/` workspace-t, az `openspec/` fát, a csomagok kiadott `kotta-spec/` mappáit és a `node_modules/` alatti fájlokat."
---

## Rule

The evidence filter SHALL exclude, from every search for a node's id, the `.kotta/` workspace, the `openspec/` tree — its changes, its archive and its generated narrative specs —, the published `kotta-spec/` directories of packages, and everything under `node_modules/`. `kotta gap` and the module derivation SHALL use this one filter, so that a node's module never follows from where a copy of the specification lies. A file in an excluded source SHALL NOT count as a test because its path contains `specs/`. The exclusion MUST name the specification sources Kotta itself knows, never a directory name pattern: a project's own `specs/` directory keeps counting as tests.

## Rationale

Since 1.0 the repository holds a second place where node ids appear by necessity. An archived change's `model/` is a copy of the nodes, its `approval.yaml` lists the approved ids, and every generated narrative requirement carries a `<!-- kotta: ID -->` binding. None of them says the code keeps the promise. Measured on 2026-09-25 on a project with 184 accepted nodes, every node read as cited while the code named none; the generated spec even counted as a test file because its path runs through `specs/`, and the same filter placed such nodes in the `(root)` pseudo-module.

## Scope

`isEvidencePath` and everything that reads through it: `kotta gap`, `kotta modules` and the module derivation. Not the narrative binding itself, which `kotta plan` still reads to report drift; not the `bound` level's test-run status, which this change leaves out.

## Open decisions

- Is `openspec/` excluded only at the repository root, as the design names it, or also where a package of a monorepo keeps its own `openspec/` tree — which would otherwise still count as evidence under this rule's own principle?
