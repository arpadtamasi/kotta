---
id: F-01kz25qv5kenxezrzmm4m7q531
title: >-
  A kiadatlan changelog-bejegyzes a regi binaris nevet hasznalja abban a
  release-ben ami atnevezi
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-021
created_at: '2026-08-02'
---
# F-01kz25qv5kenxezrzmm4m7q531 — A kiadatlan changelog-bejegyzes a regi binaris nevet hasznalja abban a release-ben ami atnevezi

## Observation

A kiadatlan changelog-bejegyzes a regi binaris nevet hasznalja abban a release-ben ami atnevezi.

## Evidence

CHANGELOG.md [Unreleased] szakasz, ugyanaz a release ami kimondja hogy a binaris mostantol kotta: 'a-team ui opens the served URL...', 'a-team ticket execute <id> --agent <agent>', 'a-team package close <id> --approve', 'a-team ticket dedupe <id> --approve' es 'a-team package dedupe <id> --approve'. Ezek nem tortenelmi bejegyzesek (a 0.3.0 meg nem jelent meg), es a nev-feluletek atnevezese a T-020 kontraktusa volt. A T-021 csak a .a-team/ ut-hivatkozasokat sopörte, a binaris-nev emliteseket szandekosan nem.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
