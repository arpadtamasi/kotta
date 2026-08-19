---
id: F-01kz3k6tn1mnv74fd5dm37tkv3
title: >-
  A resolve disposition enumja eltér a publikalt sematol: attach-existing vs
  attach-to-existing-contract
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: F-01kz3k2axqqy6r4rgqmgt5ybtt
created_at: '2026-08-03'
---
# F-01kz3k6tn1mnv74fd5dm37tkv3 — A resolve disposition enumja eltér a publikalt sematol: attach-existing vs attach-to-existing-contract

## Observation

A resolve disposition enumja eltér a publikalt sematol: attach-existing vs attach-to-existing-contract.

## Evidence

src/commands/observation.ts:66 az engedelyezett dispositionok kozott 'attach-existing'-et hasznal, a schemas/observation.schema.json:16 viszont 'attach-to-existing-contract'-ot ir elo. A CLI tehat elfogad es kiir egy erteket, amit a publikalt sema ervenytelennek tart: 'kotta observation resolve <id> --disposition attach-existing --approve' sikerrel fut, es az igy megirt observation frontmatterjere a sema nem illik. A masik irany is torik: a semaban dokumentalt 'attach-to-existing-contract'-ot a CLI 'Unknown disposition' hibaval utasitja el. A README CLI-attekintese egyik valtozatot sem emliti, csak a create-contract peldat, tehat a helyes ertek sehol nincs kimondva. Felfedezve F-01kz3k2axqqy6r4rgqmgt5ybtt vizsgalata kozben, a resolve szemantikajanak ellenorzesekor. Kapcsolodik ahhoz a korabbi eszrevetelhez, hogy a publikalt JSON semakat semmi nem ellenorzi (F-...ge5asz8x).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
