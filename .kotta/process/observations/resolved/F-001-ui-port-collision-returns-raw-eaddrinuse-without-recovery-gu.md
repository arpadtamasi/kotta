---
id: F-001
title: UI port collision returns raw EADDRINUSE without recovery guidance
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-23'
disposition: create-contract
resolved_at: '2026-07-23T16:41:20.944Z'
contract: T-014
---
# F-001 — UI port collision returns raw EADDRINUSE without recovery guidance

## Observation

UI port collision returns raw EADDRINUSE without recovery guidance.

## Evidence

On 2026-07-23, running 'a-team ui --workspace .' in the a-team repository failed with 'Error: listen EADDRINUSE: address already in use 127.0.0.1:4311'. lsof showed PID 35831 listening on 127.0.0.1:4311; its cwd was /Users/rp/Dev/ezchops/oneanda and its command was 'a-team ui --workspace .'. GET /api/workspace confirmed the existing server was healthy and serving the one&a workspace. Port 4312 was free. The CLI exposed the raw Node error without identifying an existing A-Team server, its workspace, or suggesting '--port 4312'. No outcome-equivalent finding or ticket was found.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
