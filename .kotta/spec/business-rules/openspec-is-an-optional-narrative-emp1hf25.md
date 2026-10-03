---
id: BR-01m40e0ankvnv82me5emp1hf25
form: business-rule
title: OpenSpec is an optional narrative
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · SZ1"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P2"
  quote: "rp, 2026-09-29: „a kottában nem kell megtartani az openspecet, csak mint lehetséges alapot”"
  inferred: "The setting's three values, none as the default, narrative: generated for a workspace migrated with OpenSpec specs, and tying the SHALL/MUST keyword to a kept narrative were the agent's design."
---

# OpenSpec is an optional narrative

## Rule

Whether a project keeps an OpenSpec narrative beside the model SHALL be its setting, `narrative:` in the workspace config: `none`, `generated` or `authored`, and `none` when nothing sets it. With `none`, archive SHALL write and check nothing under `openspec/`, and `plan` SHALL report no narrative drift. With `generated`, archive SHALL regenerate the touched capabilities of `openspec/specs/` from the model; with `authored`, it SHALL only report where a bound requirement disagrees with its node. The obligation keyword (SHALL or MUST) SHALL be required of a node only while an OpenSpec narrative is kept; with `none`, an obligation is written plainly, in the project's language.

## Rationale

The keyword, the drift check and the generated specs exist for OpenSpec. A project that does not use OpenSpec should not pay for them, nor be pushed towards OpenSpec by a default that writes its files. A project that does use it keeps what it had, by saying so.

## Scope

Every workspace, from 1.0.0-alpha.3. A workspace that had OpenSpec specs and no setting before then gets `narrative: generated` from `kotta migrate`, so its archive keeps doing what it did; `kotta validate` names the case when the setting is still missing.
