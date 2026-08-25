---
id: F-01m0qz4ryygynhfp3hsjzf28q5
title: The MCP server reports version 0.5.0 while the package is 0.7.0
status: resolved
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-23'
disposition: reject
resolved_at: '2026-08-25T23:42:42.277Z'
approved_by: cli
approved_at: '2026-08-25T23:42:42.278Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0qz4ryygynhfp3hsjzf28q5 — The MCP server reports version 0.5.0 while the package is 0.7.0

## Observation

The MCP server reports version 0.5.0 while the package is 0.7.0.

## Evidence

src/commands/mcp.ts:44 hardcodes { name: 'kotta', version: '0.5.0' } in the server info, while package.json says 0.7.0. A host's handshake therefore reports a version Kotta has not been for two releases; the CLI reads its version from package.json (src/cli/index.ts:30-31) and does not. Seen at d1c27d6 while spawning the recorded invocation for T-01m0qz128k7h6vtnhnykj5sba8.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
