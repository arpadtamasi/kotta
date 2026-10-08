---
id: EX-01m4ej5pndmcaajrrvz6vwhc7r
form: example
title: Measuring the test chat's drop while planning
capability: technical-model
subjects:
  - BR-01m4ee23h66jzr4wzd0a3grf02
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/impact-valtozasban/proposal.md · Why"
  quote: "oktat-ai session, 2026-10-08: „a `kotta spec impact` csak elfogadott use case-t fogad el … Jó lenne egy `--change <név>` opció.”"
  inferred: "The case is the agent's illustration of the oktat-ai planning."
---

# Measuring the test chat's drop while planning

## Given

An open change whose model holds the use case *The teacher tries the course chat*, which the accepted specification does not have yet, refining *Own test chat*; *Citation to the place* is refined by it and by an accepted use case.

## When

`kotta spec impact "The teacher tries the course chat" --change <that change>` runs.

## Then

It reports *Own test chat* as falling out and *Citation to the place* as staying, measured on the change's model over the accepted one; without `--change` it says that no accepted use case has that name, as before.
