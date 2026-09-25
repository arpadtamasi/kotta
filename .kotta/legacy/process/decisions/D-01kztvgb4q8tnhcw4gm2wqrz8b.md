---
id: D-01kztvgb4q8tnhcw4gm2wqrz8b
title: >-
  Egy checkout esetén az a checkout a control plane; a base-branch követelmény a
  több munkafa szabálya
date: '2026-08-12'
---
# D-01kztvgb4q8tnhcw4gm2wqrz8b — Egy checkout esetén az a checkout a control plane; a base-branch követelmény a több munkafa szabálya

## Decision

A kanonikus író meghatározása **egyetlen szabály**, amely minden esetet lefed, és mindenhol
ugyanígy szól:

| A repó alakja | Ki a control plane |
| --- | --- |
| Pontosan egy checkout | **az a checkout**, bármelyik ágon áll |
| Több munkafa, egyikük a `base_branch`-en | az a munkafa — a mai viselkedés, változatlanul |
| Több munkafa, egyik sem a `base_branch`-en | **elutasítás**, a mai üzenettel |
| Több munkafa, több is a `base_branch`-en | elutasítás, a mai üzenettel |

Az operátor a formára nem adott preferenciát, csak követelményt: *„Bárhogy, ahogy konzisztensen
működünk."* A konzisztencia itt azt jelenti, hogy a szabály egy helyen dől el, minden parancsra
ugyanúgy, és a kivétel nem parancsonként érvényesül.

Ezzel a `D-01kztv9ysf77134nbqnw28mwg5` ág-átvétele értelmet nyer az egy-checkoutos környezetben is:
egy hoszt-munkamenetben egy checkout van, a harness ágán — az az ág a végrehajtás ága **és** a
kanonikus állapot helye. Egy hely, egy ág, egy claim.

## Context

2026-08-12. Mérés egy eldobható repóban: `git init` a `main`-en, `kotta init`, commit, majd
`git checkout -b claude/harness-branch`. Egyetlen checkout, linkelt munkafa nélkül — pontosan az
alak, amit egy hosztolt Claude Code munkamenet ad. Ezután a `kotta status` és a
`kotta contract new` is elbukik:

```
Error: Configured control branch 'main' has no checked-out control worktree.
```

A `controlPlaneRoot` (src/git/control-plane.ts:31-38) a `git worktree list`-ből azt a munkafát
keresi, amelyik a `base_branch`-et tartja, és dob, ha nincs. Minden mutáció ezen megy át, és a
`statusCommand` is — így egy csak olvasó tájékozódó parancs ugyanazon bukik el.

A szabály eredeti célja megmarad: több munkafa mellett a kanonikus állapot nem kerülhet
feature-worktree-be, mert két helyen élne és eltérne. Egyetlen checkoutnál nincs mitől eltérni; a
tiltás ott nem véd semmit, csak kizárja a Kotta használatát. Ez nem csak a felhőt érinti: egy
magányos fejlesztő, aki sosem csinált második munkafát, és épp egy feature-ágon áll, ugyanígy jár.

## Consequences

- A `controlPlaneRoot` a munkafák **számától** függ, nem csak az ágaktól. Az egy-checkoutos ág
  bevezetése előtt a linkelt munkafák listája dönt.
- A `F-01kztvbpa23qm3gdz4cxkkm5xz` meggyógyul, és vele a `F-01kztt3mce0yk9pm7jd9dex3w5` alatti
  torlasz: az ág-átvétel enélkül elérhetetlen maradt volna a bejelentett környezetben.
- Egy-checkoutos módban a lifecycle-commitok a kint lévő ágra mennek. Ez szándékos: az az ág a
  munkamenet egyetlen helye, és a hoszt onnan pushol.
- A `start` egy-checkoutos módban nem hoz létre külön munkafát — nincs hova. Ez a
  `D-01kztv9ysf77134nbqnw28mwg5` átvételi ágával esik egybe, nem külön kivétel.
- Az elutasító üzenet megmarad a két valóban kétértelmű esetre, és attól lesz értékesebb, hogy
  ritkábban szól.
- A védett ágra vonatkozó tiltás **nem** enyhül: egyetlen checkout a `main`-en továbbra sem
  végrehajtási hely, csak kanonikus író.
