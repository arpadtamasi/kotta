---
id: F-01kz2a97prz9g94726cahhcmt5
title: >-
  A vitest a .worktrees ala is benez — egy elo ticket-worktree megduplazza a
  tesztkeszletet
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
---
# F-01kz2a97prz9g94726cahhcmt5 — A vitest a .worktrees ala is benez — egy elo ticket-worktree megduplazza a tesztkeszletet

## Observation

A vitest a .worktrees ala is benez — egy elo ticket-worktree megduplazza a tesztkeszletet.

## Evidence

Elesben elkapva, 2026-08-03 hajnal, a T-023 lezarasa kozben. A fokonyvtarban futtatott 'npx vitest run' 69 tesztfajlt es 424 tesztet jelentett, kozte egy bukot — holott a repoban 34 tesztfajl van. Ok: a T-023 worktree-je (.worktrees/T-023) meg elt a futas pillanataban, es a vitest include-mintaja belenez a .worktrees konyvtarba, tehat a MASIK ag teszteit is osszeszedte es lefuttatta. Miutan a 'contract close' eltavolitotta a worktree-t, ugyanaz a parancs 34 fajlt / 211 tesztet adott, tisztan. A vitest.config.ts kizarja a site/tests-et, de a .worktrees-t nem. Miert szamit: (1) HAMIS EREDMENY mindket iranyban — egy masik agon fejlesztes alatt allo, meg nem kesz teszt megbuktatja a fokonyvtar futasat, es forditva, egy masik ag zold tesztjei elfedhetik, hogy ITT hianyzik valami; (2) LASSU — dupla annyi teszt fut; (3) FELREVEZETO a review-ban: en magam is majdnem ugy zartam le a T-023-at, hogy egy bukott tesztet lattam, ami nem is ehhez az aghoz tartozott. A parhuzamos vegrehajtas alapertelmezes lett (D-009, T-035), tehat elo worktree szinte mindig van — ez nem ritka eset, hanem a normal allapot. Javasolt irany: a vitest.config.ts exclude-ja zarja ki a .worktrees-t (es altalaban a workspace-konfigban rogzitett worktree_root erteket, ami ma '.worktrees').

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
