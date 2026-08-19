---
id: F-01kz1n3j32rjr526dtrb71ckkr
title: >-
  A markdown H1 a teljes azonositot hordozza, igy a mintazott ULID elnyomja az
  entitas nevet
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
---
# F-01kz1n3j32rjr526dtrb71ckkr — A markdown H1 a teljes azonositot hordozza, igy a mintazott ULID elnyomja az entitas nevet

## Observation

A markdown H1 a teljes azonositot hordozza, igy a mintazott ULID elnyomja az entitas nevet.

## Evidence

Operatori eszrevetel, 2026-08-02, a oneanda workspace-en. A T-01kz1mgqwm8xvn67gztca3jh7v ticket H1-e: '# T-01kz1mgqwm8xvn67gztca3jh7v — A USER-STORY-MAP hozasa a v2-re, es a P1-P6 kanonjanak atadasa neki'. A 26 karakteres azonosito elnyomja a nevet mindenhol, ahol a torzs megjelenik: a UI drawerben, a 'ticket brief' kimeneteben, a diffekben es a code review feluleteken. Amig az azonosito 'T-042' volt, ez elviselheto zaj volt; a T-034 ota nem az. Az operator megfogalmazasa: 'a neve olvashato legyen, az id ok igy' — vagyis maga az azonosito rendben van, a megjelenitese nem. A fajlnev es a frontmatter title mar ma is olvashato (a-user-story-map-hozasa-a-v2-re-...-tca3jh7v.md), tehat a H1 az egyetlen hely, ahol a nyers azonosito a nev ele kerul. Negy iro allitja elo ugyanazt a mintat: src/commands/ticket.ts:31, src/commands/finding.ts:30, src/commands/package.ts:74, src/core/decision.ts:72 — mind '# <id> — <title>'. Ellenorizve: a H1-et a kodbol SENKI nem olvassa vissza (nincs startsWith('# ') vagy /^# / minta sem a src-ben, sem a tesztekben), tehat tisztan megjelenites, es biztonsagosan csak a cimre valtoztathato. Az azonosito a frontmatterben marad, ahol a gep amugy is keresi. Rokon: F-013 (csupasz azonositok szoveges feluleteken) — ez annak a legkonkretabb, legolcsobb szelete.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
