---
id: F-027
title: >-
  Backlog-ticketnek nincs duplikatum/torles utja a CLI-ben — a finding resolve
  auto-ticketje utkozott a kezzel irt szerzodessel
status: resolved
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T02:56:11.619Z'
contract: T-030
---
# F-027 — Backlog-ticketnek nincs duplikatum/torles utja a CLI-ben — a finding resolve auto-ticketje utkozott a kezzel irt szerzodessel

## Observation

Backlog-ticketnek nincs duplikatum/torles utja a CLI-ben — a finding resolve auto-ticketje utkozott a kezzel irt szerzodessel.

## Evidence

F-023 lezarasakor a 'finding resolve --disposition create-ticket' automatikusan letrehozta T-028-at, mikozben a szerzodest mar T-027-kent kezzel megirtam. A ticket-parancsok kozt (new/define/ready/start/review/close/reopen) nincs cancel/duplicate diszpozicio backlog-ticketre — a close csak review-bol megy es branchet kovetel. A duplikatumot igy csak git rm-mel lehetett eltavolitani, ami a kapuk megkerulese (F-022 mintaja). Kell: 'ticket cancel <id> --resolution duplicate|obsolete --approve' backlog/ready allapotra.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
