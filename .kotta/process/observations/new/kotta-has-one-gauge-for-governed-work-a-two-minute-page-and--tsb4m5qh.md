---
id: F-01m0f2zh16pvet8pz3tsb4m5qh
title: >-
  Kotta has one gauge for governed work: a two-minute page and a schema
  migration cost the same five steps and two human gates
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0f2zh16pvet8pz3tsb4m5qh — Kotta has one gauge for governed work: a two-minute page and a schema migration cost the same five steps and two human gates

## Observation

Kotta has one gauge for governed work: a two-minute page and a schema migration cost the same five steps and two human gates.

## Evidence

Observed 2026-08-20 in a Kotta-governed project (GROWSCOPE Staffing). The requested change was one short user-facing page, docs/felhasznaloi-gyorskezdes.md: a pilot status line, admin and user steps, product names, one copyable read-only first question, three troubleshooting branches, a link to the manual. To deliver it the agent first wrote a contract document of its own (growscope-quickstart-contract.md, +54 lines), then put the sign gate to the human ('Jovahagyod a Ketperces GROWSCOPE Staffing gyorskezdes munkat? Igen vagy nem?'). Ahead of it still lie execute in a claim, branch and worktree, review with acceptance-to-evidence mapping, and a second human gate at close. This is not the classification defect of F-01kzwwsjvcbcxf5vpee4g2s4mc or T-01m00afb9wt2vrbs3qgrgv0mtw: docs/ in the governed repository is product work and the gate is right to hold it. The defect is that the gate has only one setting. The lifecycle is fixed at defined -> active -> review -> done with require_human_sign_approval and require_human_done_approval, and the profile axis measures kind, not weight: bug, discovery, metric, performance, refactor, ui and workflow each only add required_sections, ready_checks and done_checks, so every profile makes a contract heavier and none makes it lighter. A quickstart page and a schema migration therefore traverse identical ceremony. The cost is not the minutes. It is that the human gate stops reading as 'this needs your judgement' and starts reading as 'say yes again' — the same approval reflex rule 5 exists to prevent, arriving through the front door. Related but distinct: F-01m0nnn... the spec-namespace finding is about material with no writing service, while this is about governed work with no proportionate lane.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
