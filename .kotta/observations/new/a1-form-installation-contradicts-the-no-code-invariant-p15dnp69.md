---
id: F-01m0as3gk50qm7d8hfp15dnp69
title: A1 form installation contradicts the no-code invariant
status: new
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-18'
---
# F-01m0as3gk50qm7d8hfp15dnp69 — A1 form installation contradicts the no-code invariant

## Observation

A1 form installation contradicts the no-code invariant.

## Evidence

Contract T-01m0apvt0hm3wcmwa6qbvwqess requires fresh init and sync to install templates/workspace/forms/*.yaml (A1), while invariant I1 forbids code changes. In the start commit, src/filesystem/workspace.ts initializeWorkspace creates a hard-coded directory list and copies only ../../profiles/*.yaml; src/commands/sync.ts syncCommand installs skills and AGENTS.md only. No existing path reads templates/workspace/forms, so adding YAML files alone cannot satisfy A1.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
