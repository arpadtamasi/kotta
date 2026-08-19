---
id: F-01kz2as3kq6j8t3g0b9m3dkmxv
title: >-
  crm-kit and flowbench cannot be migrated: unrelated dirty trees, and the
  contract says stop
status: new
origin: agent
observation_type: process
confidence: high
severity: medium
discovered_during: T-022
created_at: '2026-08-02'
---
# F-01kz2as3kq6j8t3g0b9m3dkmxv — crm-kit and flowbench cannot be migrated: unrelated dirty trees, and the contract says stop

## Observation

crm-kit and flowbench cannot be migrated: unrelated dirty trees, and the contract says stop.

## Evidence

T-022 Constraints: 'Migrate on a clean tree; if a repository is dirty, stop and report rather than committing around it.' At execution time /Users/rp/Dev/progos/crm-kit had modified README.md and untracked crm-kit.png; /Users/rp/Dev/thalesnano/flowbench had modified .gitignore (removing a self-ignoring '.gitignore' line) and untracked data/. None of it is workspace state and none of it touches .a-team, so a path-scoped commit would have been technically clean -- but 'kotta migrate' moves ~300 files in one non-transactional pass, and on a dirty tree there is no safe rollback: 'git checkout .' would destroy the owner's uncommitted work. That recoverability gap is what the constraint protects, so both repositories were left exactly as found (crm-kit HEAD 6d870c5, flowbench HEAD 4f12fc3, both still on .a-team, no .gitattributes, working trees byte-identical to the pre-run state). Both are otherwise ready: dry-run plans 19 changes / 15 identifiers for crm-kit and 49 identifiers for flowbench, and a rehearsal on copies validates 0 errors for each. Unblocking needs the owner to commit or stash their own work; the migration is then a single command per repository.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
