---
id: EX-01m3xxz8n47x54q5h96d1cr41k
form: example
title: A vendored skill is neither evidence nor unspecified enforcement
subjects:
  - BR-01m40e512w8y3mc0nm80aa9a08
capability: evidence
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md · P2"
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/proposal.md · Why"
  quote: "rp, 2026-10-02: csináld"
  inferred: "The scene is the health-ai repository, reduced to one file; the wording is the agent's."
---
# A vendored skill is neither evidence nor unspecified enforcement

## Given

A repository whose project says its code is in `src/` and its tests in `tests/`, and that also keeps a copied skill under `.claude/skills/`. One of the skill's scripts throws an error saying a flag is required, and its comment happens to name an accepted node's id. Nothing in `src/` or `tests/` names that node.

## When

`kotta gap --json` runs.

## Then

The node is at level `none`. The script's refusal is not listed among the enforced behaviour with no specification trace. The head of the report says it read `src/` and `tests/`.
