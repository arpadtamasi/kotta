---
id: D-01kztv9ysf77134nbqnw28mwg5
title: >-
  A végrehajtási környezet ága nyer, ha már létezik; Kotta csak akkor nevez el
  ágat, ha nincs mit átvennie
date: '2026-08-12'
---
# D-01kztv9ysf77134nbqnw28mwg5 — A végrehajtási környezet ága nyer, ha már létezik; Kotta csak akkor nevez el ágat, ha nincs mit átvennie

## Decision

Ha a végrehajtás olyan checkoutban indul, amely **már egy saját, nem védett ágon áll**, Kotta azt az
ágat **átveszi**: a szerződésbe és a claimbe azt írja be, és nem hoz létre se másik ágat, se másik
worktree-t. A harness ága nem azért nyer, mert harness, hanem mert **létezik**.

Ahol nincs mit átvenni — a szokásos lokális eset, ahol a checkout a `base_branch`-en áll —, Kotta
továbbra is maga nevez el és hoz létre ágat. A nevet ilyenkor a `git.branch_pattern` adja, ami ezzel
**élő beállítássá válik**: eddig kötelező, sémával validált mező volt, amit senki nem olvasott.

Két dolog nem tárgya az átvételnek:

- **Védett ág soha.** Ha a környezet a `base_branch`-et vagy más védett ágat ad, az elutasítás marad.
  Ez a szabály erősebb, mint az átvétel.
- **Amit Kotta nem hozott létre, azt nem is takarítja el.** Az átvett ág és a hozzá tartozó checkout
  a környezeté; a `close` és a `cancel` nem törli és nem távolítja el őket, csak a claimet engedi el.

## Context

2026-08-12. Egy felhőben futó Claude Code munkamenet a következőt kérdezte az operátortól:

> „A kotta `branch_pattern` értéke `{prefix}/{id}-{slug}`, tehát a `contract start` saját branchet
> akar nyitni — a harness viszont a `claude/banalis-antitezisek-inkonzisztenciak-cb78cx` branchre
> köti a pusht. Melyiken fusson a végrehajtás?"

Az operátor válasza: *„A meglévő harness-branchen."*

A kérdés azért merült fel, mert a `startContract` ma feltétel nélkül saját ágat és saját worktree-t
hoz létre, a claim pedig ezt rögzíti. Egy olyan környezetben, amely már elnevezte az ágat, ez két
ágat és két munkafát eredményez ugyanarra a munkára — és minden későbbi lépés a claimet olvassa: a
`review` a worktree tisztaságát, a `close` a rögzített ág mergeltségét, a `cancel` annak megőrzését.
Mind a rossz ágra néz.

Az idézet egy második dolgot is bizonyít. Az agens a `branch_pattern`-ből következtetett arra, hogy
mi lesz az ág neve — jóhiszeműen, mert a mező kötelező és validált. Csakhogy a `branchName`
bedrótozott, a `readWorkspaceConfig` pedig csak a `base_branch`-et és a `protected_branches`-t
olvassa. A név véletlenül ugyanaz lett volna; a következtetés attól még hamis alapon állt. Egy halott
beállítás nem tétlen: úgy néz ki, mint egy működő szabály.

## Consequences

- A `git.branch_pattern` végre kap dolgot: ez adja a nevet, amikor Kotta nevez. A mező marad, nem
  törlésre ítélt — ezt a döntés első fele menti meg.
- A claim rögzíti, hogy az ágat és a munkafát **Kotta hozta-e létre**, vagy átvette. E nélkül a
  lezáráskor nem lehet eldönteni, mit szabad eltakarítani, és a `close` a harness checkoutját
  törölné.
- A „egy aktív szerződés = egy claim, egy ág, egy worktree" szabály nem sérül, csak az izolációt nem
  mindig Kotta állítja elő: átvételkor a környezet adja, és Kotta ugyanúgy egyetlen helyet rögzít.
- A `review`, `close` és `cancel` külön nem változik: mind a claimet olvassa, tehát az átvett ágra
  fognak nézni, amint a claim helyes.
- A védett ágra vonatkozó tiltás a legerősebb szabály marad; egy védett ágon álló környezet
  végrehajtása elutasítás, nem átvétel.
- A `F-01kztt3mce0yk9pm7jd9dex3w5` megfigyelés mindkét fele megkapja a hiányzó szándékot.
