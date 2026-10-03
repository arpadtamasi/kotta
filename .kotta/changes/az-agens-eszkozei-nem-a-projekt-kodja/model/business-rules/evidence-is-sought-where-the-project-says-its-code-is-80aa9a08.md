---
id: BR-01m40e512w8y3mc0nm80aa9a08
form: business-rule
title: Evidence is sought where the project says its code is
capability: evidence
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md · P2"
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md · P3"
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md · P5"
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/proposal.md · Why"
  quote: "rp, 2026-10-03 08:32 UTC: a gap kapja meg paraméterben és a modell majd megmondja neki"
  inferred: "The operator set the direction (name where evidence is, not where it is not), that the paths are a parameter the calling agent supplies, that without it the whole repository is read as today (1a), and that archive keeps searching the whole repository (2b). The option name `--in`, that the six excluded sources stay excluded inside the named paths, and that `kotta modules` is left as it is were proposed by the agent."
---
# Evidence is sought where the project says its code is

## Rule

`kotta gap` SHALL take the paths where the project's code and tests are as a parameter - `--in <path>`, repeatable on the command line, and the same list on the read-only `gap_report` tool - and the agent that calls it SHALL supply them from what it knows of the repository. Given paths, the report SHALL seek a node's evidence, and enforced behaviour with no specification trace, only in them: a file outside them counts for nothing, whatever it names or enforces. Without the parameter it SHALL read the whole repository, as before. Either way the head of the report SHALL name what it read, and the sources *A copy of the specification is not evidence* excludes stay excluded inside the named paths. `kotta archive` SHALL keep seeking a change's evidence in the whole repository: a wider search only lets more evidence count, and archive runs no reverse search.

## Rationale

A list of what not to read is always behind: the next repository keeps a vendored skill set, a generated client or a copied tool where no list foresaw it, and its lines drown the report - in the health-ai repository 141 of 145 lines of unspecified enforcement came from a copied skill set. The operator: "tiltás helyett inkább azt kéne megmondani, hogy miben igen", "a determinisztikus tiltás mindig rossz lesz", and "a gap kapja meg paraméterben és a modell majd megmondja neki". The agent that asks for the report knows where the project's code is; the report reads there. Without the parameter nothing changes, so no existing use breaks.

## Scope

The evidence search and the reverse search of `kotta gap` and of its MCP tool. Not `kotta modules`, and not `kotta archive`, which keep reading the whole repository. Not what evidence is: a citation of the node's id, as *Every accepted promise is kept or admitted* says.
