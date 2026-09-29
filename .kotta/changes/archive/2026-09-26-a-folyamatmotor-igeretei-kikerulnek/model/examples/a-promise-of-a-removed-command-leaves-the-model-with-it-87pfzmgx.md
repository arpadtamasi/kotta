---
id: EX-01m3f47dqm80hbznzm87pfzmgx
form: example
title: A promise of a removed command leaves the model with it
subjects:
  - BR-01m3f47dgh74a0dm9bwv0pwgc3
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - "openspec/changes/a-folyamatmotor-igeretei-kikerulnek/proposal.md · Why"
  quote: "Egy megszűnt megállapodás change-dzsel távozik, nem kézi törléssel."
  inferred: "The scenario is this change itself, generalised by the agent."
---

## Given

An accepted state machine, "Task lifecycle", whose every transition is a `kotta task` command that the current release no longer ships, and `kotta gap` naming it as a promise without evidence.

## When

The project accounts for it.

## Then

The node is listed in a change's `model/REMOVED.md`, together with every accepted node that names it and promises nothing the release keeps; `kotta plan` measures the removal, and the node leaves `.kotta/spec/` only when the human approves the change and it is archived. Admitting it as unimplemented, citing it in a comment, or deleting the file by hand is not how it leaves.
