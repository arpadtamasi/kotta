---
id: F-01kz3yba9gswwqsd4y6mmdp86q
title: >-
  Nincs sprint vegi rendcsinalas: a close takarit, de a maradekot - tavoli
  branchek, elhagyott agak, tulelo konyvtarak - soha semmi nem jelenti
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-03'
---
# F-01kz3yba9gswwqsd4y6mmdp86q — Nincs sprint vegi rendcsinalas: a close takarit, de a maradekot - tavoli branchek, elhagyott agak, tulelo konyvtarak - soha semmi nem jelenti

## Observation

Nincs sprint vegi rendcsinalas: a close takarit, de a maradekot - tavoli branchek, elhagyott agak, tulelo konyvtarak - soha semmi nem jelenti.

## Evidence

Operatori eszrevetel, 2026-08-03: 'fejlesztokent pedig a sprint vegi rendcsinalast' hagyja el az ember. Ez a F-... (backlog review, ugyanaznap) fejlesztoi parja: ket elhanyagolt ritual ugyanabbol az okbol - egyiket sem TOLJA a termek, mindkettot fel kell idezni, tehat egyiket sem csinalja meg senki.

MI MUKODIK MA, hogy ez ne legyen igazsagtalan. A contract close alapos: eltavolitja a worktree-t (git worktree remove), torli a lokalis branchet (git branch -d), felszabaditja a claimet, es commitolja a workspace-t (src/commands/contract.ts:222-231). Elotte biztonsagi ellenorzest fut: a branch legyen HEAD-be mergelve, es a worktree ne tartalmazzon commitolatlan valtozast, kulonben megtagadja. A batch finalize ugyanezt teszi a koordinator-branchcsel, Git-osi bizonyitassal. A boldog uton tehat nincs szemet.

AMI MEGIS MARAD, es amirol semmi nem szol:

1. TAVOLI BRANCHEK. A close es a finalize is kifejezetten csak lokalis branchet torol - a README ki is mondja, hogy tavolit soha. Elleorizve ebben a repoban: origin/feat/T-008-publish-and-verify-the-a-team-cli-distribution meg mindig letezik, mikozben a T-008 contract a .kotta/done alatt van. A tavoli ag orokre ott marad, es egyetlen parancs sem emliti soha tobbe.

2. A .worktrees/ KONYVTAR TULELI A WORKTREE-KET. A git worktree list ma egyetlen bejegyzest ad (a fo munkafa), a .worktrees/ konyvtar megis letezik, es egy .DS_Store-t tartalmaz. Gitignore-olt, tehat lathatatlan - de a takaritas nem uritette ki, es egy korabbi eszrevetel szerint a vitest is benez ala.

3. ELHAGYOTT AGAK. Lokalisan all az agent/chat-first-pm-ui, a feat/m1-pm-surface es a backup/main-before-pr9-sync-20260721 (2026-07-21). Egyiket sem a Kotta hozta letre es egyik sem tartozik elo contracthoz - eppen ezert soha semmi nem fogja megemliteni oket. A Kotta csak azt takaritja, amit o maga csinalt, es csak akkor, ha a munka a close-ig eljutott.

A KERT ALAK. Nem uj takaritoparancs kell - a close es a finalize jol vegzi a dolgat -, hanem egy JELENTES, ami vegigmegy a repon es megnevezi a maradekot: mely tavoli agak tartoznak mar done contracthoz, mely lokalis agak nem tartoznak semmilyen elo contracthoz, hany worktree-konyvtar all ures, van-e arva claim, van-e done-unintegrated vagy cleanup-pending batch (ezt a batch status mar tudja, csak batchenkent kell kerdezni). A torles maradjon emberi dontes; a Kotta biztonsagi elve (soha nem eroltet, soha nem torol tavolit) ne valtozzon. Ami hianyzik, az a LATHATOSAG, nem a jogosultsag.

Rokon: T-019 ('Sweep: one command that answers what is unfinished and why') - az a munkarol kerdez, ez a munka NYOMAIROL. Erdemes lehet egy parancs ket szakasza.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
