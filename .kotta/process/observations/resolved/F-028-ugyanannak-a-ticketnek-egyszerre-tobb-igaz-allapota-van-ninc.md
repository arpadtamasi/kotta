---
id: F-028
title: >-
  Ugyanannak a ticketnek egyszerre tobb igaz allapota van — nincs kimondott
  olvasasi szabaly a git-kontextusok folott
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T15:04:39.219Z'
contract: T-01kz1g2w1fs2qx0bs72e9pkmg4
---
# F-028 — Ugyanannak a ticketnek egyszerre tobb igaz allapota van — nincs kimondott olvasasi szabaly a git-kontextusok folott

## Observation

Ugyanannak a ticketnek egyszerre tobb igaz allapota van — nincs kimondott olvasasi szabaly a git-kontextusok folott.

## Evidence

oneanda P-021, 2026-08-02, harom felulet harom allapotot mond ugyanarrol: T-107 a UI-ban review, az agens prozajaban ready; T-110 a UI-ban active, a prozaban ready es 'nincs futo claim'; T-115 a UI-ban backlog, a prozaban done (tegnap merge-olve). Mechanizmus: a start a worktree-branchre, a review a koordinator-branchre commitol, a close a merge utan el; a UI a T-016 ota stabil refrol olvas, az agens a coord/p021 munkafajabol — minden felulet mas git-kontextust nez, es mindegyik mas pillanatot tart. A T-016 a churnt javitotta, cserebe staleness jott: az in-flight munka a stabil refrol lathatatlan. Gyoker: irasra van kapu (claim/lock), olvasasra nincs szabaly — es a nezo nem tudja meg, melyik kontextust latja. Javasolt irany: kanonikus olvasat = base ref + claim-overlay; ahol eltres van, a node MINDKET allapotot mutassa (pl. 'review @coord/p021 - backlog @main'); a drift ne kulon panel legyen, hanem jelveny a kartyan. Kapcsolodik: F-006 (a T-016 elozmenye), F-024 (a bizalomvesztes miatt a sweep-kerdesek chatbe mennek vissza).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
