---
id: F-01kz9drtga1vdpmggzxwja20bg
title: contract new human output hides the created contract ID
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-01kz8tk2t53jbax6mrseka50v9
created_at: '2026-08-05'
disposition: merge-duplicate
resolved_at: '2026-08-21T15:07:16.694Z'
approved_by: cli
approved_at: '2026-08-21T15:07:16.694Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01kz9drtga1vdpmggzxwja20bg — contract new human output hides the created contract ID

## Observation

contract new human output hides the created contract ID.

## Evidence

In the calling chat workflow, the human ran kotta contract new successfully, but the terminal printed only 'kotta contract new completed.' The agent then asked the human to send back the new ID, while the user could not see it. The command result already contains data.id; human output must print the ID and path, and the caller-chat adapter should consume structured JSON without asking the human to relay identifiers.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
