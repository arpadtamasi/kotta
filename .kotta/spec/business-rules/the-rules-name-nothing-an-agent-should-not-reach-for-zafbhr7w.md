---
id: BR-01m40e0avfnth9evktzafbhr7w
form: business-rule
title: The rules name nothing an agent should not reach for
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · SZ2"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P3"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · P4"
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · P6"
  quote: "rp, 2026-09-29: „openspec/ mappát soha ne hozz létre … miről jutna eszébe csinálni?” — „van még ilyen csapda benne?”"
  inferred: "Extending the point from OpenSpec to retired process terms, the MCP instructions and the workshop skills, and the list of words a test keeps out, were the agent's reading of the operator's question about other traps."
---

# The rules name nothing an agent should not reach for

## Rule

The rules file Kotta writes, the skills it installs and the instructions its MCP server gives SHALL NOT name a tool the project may not use, or a concept Kotta has retired, not even to forbid it: no OpenSpec in the rules file, no task, claim, batch, observation, process layer or decision record. What applies only in some workspaces SHALL be said conditionally, on something the agent can see — „unless the config sets `narrative:`”, „if the repository already has an `openspec/specs/` folder” — and nowhere else. They SHALL NOT point to a command or tool that does not exist.

## Rationale

What the rules name, an agent reaches for. A prohibition plants the thing it prohibits in every project, including the ones that never had it; the list of retired process terms did the same with observations. The fix is to say what to do, not what not to do.

## Scope

`.kotta/AGENTS.md` as `kotta sync` writes it, every skill Kotta ships, and the MCP server's instructions. A test keeps the named words out of the rules file. The documentation, written for people, may name them.
