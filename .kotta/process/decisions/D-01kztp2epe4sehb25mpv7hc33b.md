---
id: D-01kztp2epe4sehb25mpv7hc33b
title: >-
  Kotta a saját szabályfájlját birtokolja, a projekt AGENTS.md-jéhez pedig csak
  kérdés után nyúl
date: '2026-08-12'
---
# D-01kztp2epe4sehb25mpv7hc33b — Kotta a saját szabályfájlját birtokolja, a projekt AGENTS.md-jéhez pedig csak kérdés után nyúl

## Decision

Kotta a `.kotta/AGENTS.md`-t **teljesen birtokolja**: ő írja ki, ő frissíti, és ebben áll minden
szabály, amit az agensekre kényszerít — a telepítési sorral együtt, a valódi csomagnévből és
verzióból generálva.

A projekt saját `AGENTS.md`-je **a projekté**. Kotta legfeljebb egyetlen hivatkozó sort fűz hozzá,
és azt is csak a felhasználó explicit igenje után. Meglévő tartalmat nem ír át, nem rendez át és nem
töröl. Ha nincs `AGENTS.md`, a létrehozása ugyanígy kérdés, nem alapértelmezés.

Nemleges válasz esetén — vagy ha nincs kit megkérdezni, mert a futás nem interaktív — a
`.kotta/AGENTS.md` akkor is megíródik, és a parancs kimenete megmondja, melyik sort tegye be a
felhasználó. A hallgatás nem igen.

A hozzáfűzés idempotens: ha a sor már ott van, nem történik semmi, és a kérdés sem hangzik el.

## Context

2026-08-12. Egy hosztolt környezetben (claude.ai web) futó agens jelentette, hogy nem tud
továbblépni: nincs `kotta` CLI, publikus npm csomagot nem talál, a `.kotta/` kézi szerkesztését
pedig az `AGENTS.md` tiltja.

A fele téves következtetés helyes megfigyelésből: a csomag publikus, csak scoped —
`@arpadtamasi/kotta@0.5.0` létezik, a csupasz `kotta` név 404. Az agens a bináris nevéből
következtetett a csomagnévre, és megállt.

A másik fele valódi lyuk, és nagyobb, mint elsőre látszott. Az `AGENTS.md`-t **Kotta sehol nem
szállítja**: nincs `templates/AGENTS.md`, a `kotta init` nem írja ki, a `setup-kotta` skill meg sem
említi. Egyetlen módon jut el egy projektbe: valaki kézzel átmásolja a Kotta repóból. Ezért nem megy
vele a telepítési sor sem, ami a README 20. sorában áll. A dokumentum tehát minden ajtót becsuk,
amit kinyit: nincs CLI, nincs MCP, és tiltva van az egyetlen kézi kiút.

A kézenfekvő javítás — „a `kotta init` írja ki az `AGENTS.md`-t" — rossz. Az operátor mondta ki,
miért: *„nem írhatja felül egyáltalán, ott lehet más is."* Egy valódi projektben az `AGENTS.md`
majdnem mindig a projekt saját konvencióit hordozza; ennek a repónak a sajátja is tartalmaz egy
„This repository" szakaszt. Egy generátor, amelyik ezt felülírja, pontosan azt a bizalmat veszti el,
amire a többi szabálya épül.

A `kotta sync` mechanizmusa viszont már bizonyított a skilleken: összehasonlít a szállított
fájllal, az azonos másolatot örökbe fogadja, a másét sosem írja felül, az eltérést pedig a
`kotta status` jelenti. Ez a minta jó — csak egy olyan fájlra kell alkalmazni, amit Kotta tényleg
birtokol, és az a `.kotta/` alatt van.

## Consequences

- A `kotta init` és a `kotta sync` kap egy projekt-oldali célpontot a `~/.claude/skills` mellé.
  A `.kotta/AGENTS.md` a skillek drift-szabályát követi: byte-azonos másolatot frissít, kézzel
  módosítottat jelent és békén hagy.
- A projekt `AGENTS.md`-jébe írás emberi kapu lesz, a `sign`-hoz és a `close`-hoz hasonlóan — de
  könnyebb: egyetlen sor hozzáfűzése, visszavonható egy törléssel.
- Nem interaktív futás (CI, headless agens) sosem ír a projekt fájljába. Ez tudatos: ott nincs kit
  megkérdezni, és a rossz irányba tévedés drágább, mint egy kimaradt sor.
- Ennek a repónak az `AGENTS.md`-je lesz a sablon forrása. A „This repository" szakasz megmarad, de
  a kézi másolás megszűnik fő útnak lenni, és a benne álló „replace this section when you copy"
  mondat elveszti a szerepét.
- A telepítési sor generálva kerül a sablonba, így nem tud elcsúszni attól, ami tényleg publikálva
  van — ez az a hiba, amiből az egész indult.
- A `F-01kztn8rzehzvdfqq1snwc55jk` megfigyelés ezzel megkapja a hiányzó terméki szándékot; a
  megfigyelés szövege még azelőtt készült, hogy kiderült volna, hogy az `AGENTS.md`-t semmi nem
  szállítja, ezért a teljes lelet a rá épülő szerződésben áll.
