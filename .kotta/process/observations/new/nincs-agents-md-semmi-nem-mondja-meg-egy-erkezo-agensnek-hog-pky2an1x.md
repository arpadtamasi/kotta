---
id: F-01kz24pa29b5yhhzpcpky2an1x
title: >-
  Nincs AGENTS.md — semmi nem mondja meg egy erkezo agensnek, hogy ez a repo
  Kottaval dolgozik
status: new
origin: agent
observation_type: product
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
---
# F-01kz24pa29b5yhhzpcpky2an1x — Nincs AGENTS.md — semmi nem mondja meg egy erkezo agensnek, hogy ez a repo Kottaval dolgozik

## Observation

Nincs AGENTS.md — semmi nem mondja meg egy erkezo agensnek, hogy ez a repo Kottaval dolgozik.

## Evidence

Operatori eszrevetel, 2026-08-02 ejjel. A repoban nincs AGENTS.md (sem CLAUDE.md), tehat egy ide erkezo kodolo agens semmibol nem tudja meg, hogy a munka Kottan keresztul megy: hogy a valtoztatas elott contract kell, hogy a vegrehajtas sajat worktree-ben fut claimmel, hogy a kesz munka bizonyitekot es emberi elfogadast igenyel, es hogy a szandekon kivuli eszrevetel observationkent rogzitendo, nem csendben javitando. Ma este ezt a tudast mindig EN adtam at kezzel, minden egyes agens-promptban ujra megfogalmazva — hat futasnal hatszor. A skillek (setup-kotta, define-ticket, start-ticket, execute-ticket, submit-review, close-ticket, execute-package, validate-finding, explore-workspace, report-kotta-bug) leirjak a HOGYANT, de csak akkor talalja meg oket valaki, ha mar tudja, hogy leteznek — es a skill-telepites nem minden agens-kornyezetben adott. Az AGENTS.md a belepesi pont, ami erre ramutat. Miert most szamit: a T-035 ota van 'kotta ticket execute', tehat a friss-kontextusu vegrehajtas parancs — de a parancsot is ismerni kell. Es a rename utan a szomszed repok (oneanda, crm-kit, flowbench) mindegyike ugyanezt a belepesi pontot kerne, kulonben minden projektben ujra kell magyarazni. Nyitott kerdes a definiciohoz: egyetlen AGENTS.md a Kotta repoban mint minta, amit a 'kotta init' kiir minden uj workspace-be — vagy projektenkent kezzel irt. Az elobbi illik a termekhez: az init ma is ir konfigot es konyvtarakat.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
