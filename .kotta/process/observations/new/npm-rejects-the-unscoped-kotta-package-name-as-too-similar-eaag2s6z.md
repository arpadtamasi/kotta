---
id: F-01kz9c3h0jddvtwq4feaag2s6z
title: npm rejects the unscoped kotta package name as too similar
status: new
origin: agent
observation_type: blocker
confidence: high
severity: medium
discovered_during: T-01kz8tk2t53jbax6mrseka50v9
created_at: '2026-08-05'
---
# F-01kz9c3h0jddvtwq4feaag2s6z — npm rejects the unscoped kotta package name as too similar

## Observation

npm rejects the unscoped kotta package name as too similar.

## Evidence

The v0.4.0 OIDC publish returned E404 because the package does not yet exist. The authenticated first publish then returned E403: Package name too similar to existing packages koa,konva; npm recommends @arpadtamasi/kotta. GitHub Pages deployed successfully; npm publication requires a human product decision between a scoped package and an npm name appeal.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
