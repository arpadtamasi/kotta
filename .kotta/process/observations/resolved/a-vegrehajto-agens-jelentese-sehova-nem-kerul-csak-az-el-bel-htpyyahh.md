---
id: F-01kz23nj69srgr2w13htpyyahh
title: >-
  A vegrehajto agens jelentese sehova nem kerul — csak az el belole, amit a
  koordinator kezzel atir a review-evidenciaba
status: resolved
origin: agent
observation_type: risk
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
disposition: create-contract
resolved_at: '2026-08-02T20:47:37.469Z'
contract: T-01kz23pvzscenqavzx4tg62x1b
---
# F-01kz23nj69srgr2w13htpyyahh — A vegrehajto agens jelentese sehova nem kerul — csak az el belole, amit a koordinator kezzel atir a review-evidenciaba

## Observation

A vegrehajto agens jelentese sehova nem kerul — csak az el belole, amit a koordinator kezzel atir a review-evidenciaba.

## Evidence

Megfigyeles a sajat repon, 2026-08-02, hat egymas utani agens-futas utan. A 'ticket execute' (T-035) felfogja az agens stdout-jat (src/commands/execute.ts: a child.stdout darabjait egy stringbe gyujti), de KIZAROLAG azert, hogy az ures kimenetet hibanak minositse — sehova nem irja ki. A jelentes tehat a folyamat memoriajaban el, majd eltunik. Ami a ticketbe kerul, az az, amit a koordinator kezzel atfogalmaz a 'ticket review --evidence' parameterebe. Ez ma harom modon romolhat el, es egyik ellen sincs kapu: (1) a koordinator kihagy valamit — a T-020 jelentese 161 tool-hivasnyi munkat foglalt ossze, ebbol az evidenciaba az kerult, amit en fontosnak lattam; (2) a koordinator ATFOGALMAZ, tehat az evidencia mar nem az, amit a vegrehajto allitott, hanem amit a review-zo ertett belole — a bizonyitek es a bizonyito kozott elveszik a kozvetlenseg; (3) ha a koordinator kontextusa kompaktalodik ket lepes kozott, a jelentes egyszeruen nincs meg tobbe. A masodik res ugyanezt erositi: a 'ticket review --evidence' EGYETLEN szoveget vesz at, es a sablon minden acceptance-sorba ugyanazt a blobot irja — ez az F-018 mert mintazata ('az evidencia mennyiseggel elegszik meg, nem alkalmassaggal'), most a masik oldalrol nezve. Javasolt irany: a vegrehajtas maga tegye le a jelentest — a 'ticket execute' irja az agens teljes kimenetet egy kanonikus helyre (a ticket melle vagy a ticketbe), es a review-evidencia erre HIVATKOZZON, ne helyettesitse. Igy a nyers jelentes akkor is megmarad, ha a koordinator rosszul foglal ossze, es a ketto elteres esetén osszevetheto. Rokon: F-018 (evidencia-alkalmassag), D-009 (a friss kontextus alapertelmezese), es a mai tapasztalat, hogy a skill-szintu kotelesseg nem eleg — a D-009-et is leirtuk, aztan ot ticket a koordinator kontextusaban keszult el.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
