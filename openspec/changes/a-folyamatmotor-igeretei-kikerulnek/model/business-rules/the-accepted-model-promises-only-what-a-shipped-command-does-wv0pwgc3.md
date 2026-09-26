---
id: BR-01m3f47dgh74a0dm9bwv0pwgc3
form: business-rule
title: The accepted model promises only what a shipped command does
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "openspec/changes/a-folyamatmotor-igeretei-kikerulnek/proposal.md · Why"
    - "CHANGELOG.md · 1.0.0-alpha.1 · Removed — BREAKING"
  quote: "The process layer. The commands task, batch, observation, decision, claim, status and sweep; every --approve gate and the approval receipts; the execution engine"
  inferred: "That a removed behaviour's promises leave the model through a change rather than staying as admitted gaps was chosen by the agent from the evidence rule; the release itself only removed the code."
---

## Rule

An accepted node SHALL promise behaviour that a command, a surface or a published artefact of the current release has or is meant to have. When a release removes a behaviour, the nodes that promise only that behaviour MUST leave the accepted model through a change - listed in its `model/REMOVED.md` and landed on the one human gate - and never stay behind as admitted gaps or be deleted by hand. A node that still promises something the release keeps is reworded in the same change instead of being removed.

## Rationale

The 1.0.0-alpha.1 release removed the process engine of the 0.x releases - tasks, batches, observations, decisions, claims, the approval requests and their receipts - but the nodes that promised its behaviour stayed accepted. `kotta gap` then counted two dozen promises no command could keep, and the only ways to quiet it were an admission saying "unimplemented" about something nobody intends to implement, or an id written into a comment where nothing keeps it. Both would make the report lie. A promise without a behaviour behind it is not a gap to admit; it is an agreement that ended, and ending it is a change like any other.

## Scope

The accepted nodes under `.kotta/spec/`, and the changes that remove or reword them. Not `.kotta/legacy/`, which is a read-only archive of how the project worked and governs nothing. Not a promise whose work has merely not begun: that one stays and is admitted as unimplemented.
