---
id: D-01kztxvppd40r77cq7kw9b8wzr
title: >-
  A batch-ek batch-e csoportosítás, nem végrehajtási egység — a nagyot chatben
  lehet kérni, a többit az agens rakja össze
date: '2026-08-12'
---
# D-01kztxvppd40r77cq7kw9b8wzr — A batch-ek batch-e csoportosítás, nem végrehajtási egység — a nagyot chatben lehet kérni, a többit az agens rakja össze

## Decision

Egy batch **megnevezhet gyerek-batcheket**. Ez a beágyazás **kizárólag csoportosítás**: a gyereknek
nincs saját koordinátor-ága, saját `execution` blokkja és saját merge-célpontja. A szülő egy név,
amely alá a gyerekek beolvashatók.

A végrehajtás szerződés-szintű marad, pontosan úgy, ahogy ma. „Csináld végig a nagyot" **chatben
elhangzó kérés**, nem új parancs: az agens beolvassa a fát, kilapítja szerződésekre, és úgy futtatja
őket, ahogy bármelyik batchet futtatná. Kotta ehhez annyit ad, hogy a fa **olvasható és
kilapítható** legyen — amit az agens nem tud felsorolni, azt nem tudja végigvinni.

Szerkezeti korlátok, hogy a fa fa maradjon:

- egy batchnek legfeljebb **egy szülője** van;
- **kör nem megengedett**, se közvetlen, se közvetett;
- egy szerződés továbbra is **legfeljebb egy** batchhez tartozik, és az a batch a levél, nem a szülő.

## Context

2026-08-12. Az operátor bejelentése: *„A Kotta jelenlegi modellje nem támogat egymásba ágyazott
batch-eket. Nagyobb terméknél jó lenne."* (`F-01kztt37st3xy3dmfnr23getrn`)

A modell ma kétszintű: a `schemas/batch.schema.json` `contracts` tömbje csak szerződés-idet fogad el,
a szerződés pedig egyetlen `batch` sztringet visz, és a kód is így hívja: `updateContainingBatch`.
Egy termék moduljait, mérföldköveit és workstreamjeit ma mind ugyanabba a szintbe kell lapítani.

A kérdés az volt, hogy a gyerek-batch olvasási csoportosítás-e vagy önálló végrehajtási egység saját
koordinátor-ággal. Az operátor válasza: *„csak csoportosítás"* — és hozzátette, mire kell:
*„chatben mondhassam, hogy csinálja végig a nagyot, majd a chat ai-ja megoldja a többit."*

Ez zárja ki a drága felét. Végrehajtási egységként el kellett volna dönteni, hogy a gyerek
koordinátora mibe mergel, a `default_parallelism` szintenkénti-e vagy közös, és mit jelent egy
félig kész gyerek a szülő lezárásakor. Csoportosításként ezek a kérdések fel sem merülnek.

## Consequences

- A batch séma gyerek-hivatkozást kap; az `execution` blokk a gyereken **nem** kap új jelentést.
- A `batch close` a fát nézi: egy szülő akkor kész, ha minden gyereke és minden közvetlen
  szerződése kész. Ez a mai szabály kiterjesztése, nem új szabály.
- Az olvasó felületeknek — `batch show`, `status`, a board — a fát és a kilapított szerződéslistát is
  meg kell mutatniuk. Ez a döntés lényegi része: enélkül a „csináld végig a nagyot" nem
  végrehajtható, mert az agens nem látja, mi tartozik bele.
- A `batch start` és a koordinátor-ágak változatlanok. Nincs `coord/` ág gyerek-batchre.
- Az `authority.create_subcontracts` mező továbbra sem kap modellt; ez a döntés nem az.
- A „csináld végig a nagyot" a rendes emberi kapukat nem kerüli meg: az aláírás és a lezárás
  szerződésenként ugyanúgy emberi döntés marad.
