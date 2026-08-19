---
id: F-014
title: a-team ui does not open the browser — auto-open the served URL on start
status: resolved
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-28'
disposition: create-contract
resolved_at: '2026-08-02T15:04:39.124Z'
contract: T-01kz1g2vyhfn5ezzvvyzn4w2gr
---
# F-014 — a-team ui does not open the browser — auto-open the served URL on start

## Observation

a-team ui does not open the browser — auto-open the served URL on start.

## Evidence

a-team ui starts the server and prints the URL (src/commands/ui.ts:340) but does not open a browser (confirmed 2026-07-28: no open/xdg-open/start invocation; child_process is used only for the codex app-server and --version checks). Standard dev servers auto-open (vite --open, next dev). Add a browser-open on start — default, with a --no-open escape hatch — cross-platform (macOS 'open', Linux 'xdg-open', Windows 'start'). Small DX win: removes the manual copy-paste of the localhost URL every session, and pairs with the fact that the operator's main entry to A-Team is 'a-team ui'.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
