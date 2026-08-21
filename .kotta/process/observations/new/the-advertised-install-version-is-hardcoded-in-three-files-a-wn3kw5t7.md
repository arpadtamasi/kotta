---
id: F-01kz235wrjck3amwcjwn3kw5t7
title: >-
  The advertised install version is hardcoded in three files and silently drifts
  from package.json
status: new
origin: agent
observation_type: process
confidence: high
severity: medium
discovered_during: T-020
created_at: '2026-08-02'
---
# F-01kz235wrjck3amwcjwn3kw5t7 — The advertised install version is hardcoded in three files and silently drifts from package.json

## Observation

The advertised install version is hardcoded in three files and silently drifts from package.json.

## Evidence

Before T-020, package.json#version was 0.2.2 while README.md and site/index.html both advertised 'npm install --global @arpadtamasi/a-team@0.1.2', and site/tests/site.spec.ts asserted that same stale string — so the public onboarding path pinned a version two releases old and the test suite locked the drift in place. Nothing derives the advertised version from package.json, and the release workflow (.github/workflows/npm-release.yml) only checks the tag against package.json, never the docs. T-020 had to update the pin by hand in README.md, site/index.html and site/tests/site.spec.ts; the next version bump will drift again.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
