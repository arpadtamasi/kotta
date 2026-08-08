---
id: F-01kzdjxzvmajrstw4eccfd497m
title: >-
  Kotta hand-enumerates the agents and hosts it can work with, and falling
  outside the list fails silently
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
---
# F-01kzdjxzvmajrstw4eccfd497m — Kotta hand-enumerates the agents and hosts it can work with, and falling outside the list fails silently

## Observation

Kotta hand-enumerates the agents and hosts it can work with, and falling outside the list fails silently.

## Evidence

Two hand-maintained enumerations decide what Kotta can cooperate with, and neither reports an omission. (1) Agents: AGENT_ARGUMENTS in src/commands/execute.ts holds exactly two entries, claude: ['-p'] and codex: ['exec','-']. resolveAgentCommand returns args: AGENT_ARGUMENTS[agent] ?? [], so any third agent is invoked bare with the brief on stdin and no flags. The doc comment states this is intentional, but nothing validates the result: an agent invoked without the arguments it needs typically exits 0 and prints something while changing nothing, which the executor then records as 'implemented' (F-01kzdax5af5edadf83rq792eky). An unsupported agent is therefore indistinguishable from a successful one. This is exactly how the claude defect stayed hidden - F-01kzdebgbn97ve9bby1me3jkh4 is that same table being wrong for an agent that IS listed. (2) Hosts: kotta integrate rejects every host but codex at src/cli/index.ts:315 and writes .codex/config.toml, so a Claude Code session in this repository starts with no Kotta MCP tools (F-01kzd9sh03y7hwwbeen5cp4s0q). Consequence: Kotta is documented and structured as agent-neutral, but in practice codex is the only agent and host combination that works end to end without manual intervention. Adding a third agent, or a second host, is currently undefined rather than merely unimplemented. Related pattern, different surface: T-01kzda6nj9hd2z45tt06fw8n0g addresses the same hand-curated-enumeration failure mode for the CLI and MCP surfaces.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
