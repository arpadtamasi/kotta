---
id: F-01kz25qf318bmn1t860n2rjcpt
title: >-
  A workspace-konyvtar atnevezese uressen mutatja a boardot amig a rename nem
  ert a base branchre
status: new
origin: agent
observation_type: risk
confidence: high
severity: medium
discovered_during: T-021
created_at: '2026-08-02'
---
# F-01kz25qf318bmn1t860n2rjcpt — A workspace-konyvtar atnevezese uressen mutatja a boardot amig a rename nem ert a base branchre

## Observation

A workspace-konyvtar atnevezese uressen mutatja a boardot amig a rename nem ert a base branchre.

## Evidence

A T-021 worktree-ben, a migracios commit utan: node -e readWorkspace('.') -> 'kotta ui: batch read of .kotta at b40be85 failed (fatal: pathspec .kotta did not match any files); falling back to per-file git reads' es tickets: 0, findings: 0, decisions: 0, packages: 0. A board a base refbol (main) olvas (T-016/D-001), ott meg .a-team van, a munkafa mar .kotta -- a fejlec a helyes utat mutatja, a tartalom ures. A figyelmeztetes csak a batch read bukasat mondja ki, az ures boardot nem. A T-022 minden migralt szomszed repoban ugyanezt fogja latni a merge elott.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
