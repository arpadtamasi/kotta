---
id: F-01kz9d5nqwdwb7r2c0jdzchspa
title: Live Pages quickstart still advertises kotta 0.3.0
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-01kz8tk2t53jbax6mrseka50v9
created_at: '2026-08-05'
---
# F-01kz9d5nqwdwb7r2c0jdzchspa — Live Pages quickstart still advertises kotta 0.3.0

## Observation

Live Pages quickstart still advertises kotta 0.3.0.

## Evidence

Post-deploy canary at https://arpadtamasi.github.io/kotta/ returned HTTP 200 with zero console errors and 603 ms total load, but visible quickstart text still says npm install --global kotta@0.3.0 after the v0.4.0 release merge.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
