---
id: EX-01m3xxz8n47x54q5h96d1cr41k
form: example
title: A vendored skill is neither evidence nor unspecified enforcement
subjects:
  - BR-01m3cqmt9yrasdj92kky1kcx0n
  - BR-01m3cqmtfyrpdzcppvy0565652
capability: evidence
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/proposal.md · Why"
  quote: "rp, 2026-10-02: csináld"
  inferred: "The scene is the health-ai repository, reduced to one file; the wording is the agent's."
---
# A vendored skill is neither evidence nor unspecified enforcement

## Given

A repository that keeps a copied skill under `.claude/skills/`. One of its scripts throws an error saying a flag is required, and its comment happens to name an accepted node's id. Nothing else in the repository names that node.

## When

`kotta gap --json` runs.

## Then

The node is at level `none`, and beside it the report names `agent-tooling` as the excluded class that mentions it. The script's refusal is not listed among the enforced behaviour with no specification trace. The head of the report counts the files under `agent-tooling` once.
