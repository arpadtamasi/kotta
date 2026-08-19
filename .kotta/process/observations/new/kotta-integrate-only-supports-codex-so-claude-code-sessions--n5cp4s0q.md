---
id: F-01kzd9sh03y7hwwbeen5cp4s0q
title: >-
  kotta integrate only supports codex, so Claude Code sessions start with no
  Kotta MCP tools
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-07'
---
# F-01kzd9sh03y7hwwbeen5cp4s0q — kotta integrate only supports codex, so Claude Code sessions start with no Kotta MCP tools

## Observation

kotta integrate only supports codex, so Claude Code sessions start with no Kotta MCP tools.

## Evidence

src/commands/integrate.ts accepts only the 'codex' host and writes .codex/config.toml. src/commands/mcp.ts already serves approval_request and the full tool set over stdio, and AGENTS.md instructs every calling agent to use those tools instead of the CLI. A Claude Code session opened in this repository therefore has zero Kotta tools: 'claude mcp list' showed no kotta entry and ToolSearch matched none, so the human was told to run 'kotta contract close --approve' in a terminal for T-01kz8tk2t53jbax6mrseka50v9 and T-01kz9de36qw55z9g73ynebm578 - exactly the terminal round-trip the merged chat-first approval contract set out to remove. Registering it manually with 'claude mcp add kotta --scope local -- kotta mcp --workspace .' connects successfully, which confirms the server works and only the host wiring is missing.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
