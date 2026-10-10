# A Kotta célja és menete

## Told to a stranger

A Kotta a repóban tartja egy projekt műszaki specifikációját, hogy az ember lássa, mit csinál a gép,
mielőtt megcsinálja, és lássa, hogy a kód tartja-e, amíg készül. Az ember elmondja, mit akar; az
ágens nyit egy változást, megírja a modellt, a Kotta megméri; az ember egyszer igent mond; az ágens
úgy építi meg, hogy a kód megnevezi az ígéreteit; a Kotta megmutatja, mi teljesül; a változás
archiválódik. Közben a szertartás arányos, minden a repóban van, és a kész az, amit bizonyíték
mutat.

## Why

A Kotta saját specifikációja lapos: négy cél áll egymás mellett, közös cél nélkül, és nincs menet
(`kotta validate`: „4 goals serve no other goal”, „no journey”). rp nem tudott célt választani —
„ez piacismeret, mind igaz” —, de megnevezte a problémát, amit a neten lát: „nem átlátható, mit
csinál a gép, és későn derül ki”.

## What changes

- A cél és a használati eset forma a Kotta által szállított változatra frissül (`serves`,
  `includes`, `extends`, `level`).
- **The human sees in time what the machine does** (új cél; rp: „Igen, így”).
- **Direct more work than you can observe**, **The repository is the shared truth**, **Completion is
  evidence, not report** ezt szolgálja.
- **Agree before building, then see it kept** (új, összefoglaló használati eset): tájékozódás →
  a specifikáció formálása → jóváhagyás → építés → a gap elemzése → archiválás.
- **Build what was approved** és **Archive a built change** (új használati esetek, rp: „Igen, két új
  eset”).
- A **The ceremony fits the stakes** cél megszűnik: minőség, amit a *Proportionate ceremony* visz
  (rp: „Minőség”).
- Egy új példa, és két meglévő, amely az új használati eseteket is igazolja.

## Open decisions

Nincs: mindhármat rp megválaszolta (K2).
