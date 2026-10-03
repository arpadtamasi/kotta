---
id: BR-01m3cqmt9yrasdj92kky1kcx0n
form: business-rule
title: A copy of the specification is not evidence
capability: evidence
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md · J1"
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/proposal.md · Why"
  quote: "rp, 2026-10-03 08:28 UTC: a"
  inferred: "The operator chose the agent's option (a): the agent hosts' whole directories at the repository root, `.claude/` and `.codex/`. That the same filter bounds the reverse search, and the wording, are the agent's."
---

## Rule

The evidence filter SHALL exclude, from every search for a node's id, the `.kotta/` workspace, the `openspec/` tree at the repository root — its changes, its archive and its generated narrative specs —, the published `kotta-spec/` directories of packages, everything under `node_modules/`, and the agent hosts' own directories at the repository root — `.claude/` and `.codex/` —, which hold the skills, settings and hooks an agent host reads: somebody else's code, or the agent's tooling, never the product's. The same filter SHALL bound the search for enforced behaviour with no specification trace. `kotta gap` and the module derivation SHALL use this one filter, so that a node's module never follows from where a copy of the specification lies. A file in an excluded source SHALL NOT count as a test because its path contains `specs/`. The exclusion MUST name the specification sources Kotta itself knows, never a directory name pattern: a project's own `specs/` directory keeps counting as tests, and an `openspec/` tree a package keeps below the root is not excluded.

## Rationale

Since 1.0 the repository holds a second place where node ids appear by necessity. An archived change's `model/` is a copy of the nodes, its `approval.yaml` lists the approved ids, and every generated narrative requirement carries a `<!-- kotta: ID -->` binding. None of them says the code keeps the promise. Measured on 2026-09-25 on a project with 184 accepted nodes, every node read as cited while the code named none; the generated spec even counted as a test file because its path runs through `specs/`, and the same filter placed such nodes in the `(root)` pseudo-module.

## Scope

`isEvidencePath` and everything that reads through it: `kotta gap` — its hint about uncommitted paths included —, `kotta modules` and the module derivation. Not the narrative binding itself, which `kotta plan` still reads to report drift; not the `bound` level's test-run status, which this change leaves out.
