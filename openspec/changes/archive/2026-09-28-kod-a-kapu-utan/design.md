# Design

## 1. Szabály, nem zár

A szabály az ügynöknek szól, a szabályfájlban és a modellben; a CLI nem akadályozza meg, hogy
valaki a `tasks.md`-ből kódot írjon. Nincs olyan pont, ahol a Kotta a kódírást látná: az
`opsx:apply` az OpenSpec skillje, a kéz a kézé. Amit a Kotta biztosít, az az, hogy a szabályt
minden ügynök elolvassa — ezért jár vele a `CLAUDE.md` hivatkozás.

## 2. „Jóváhagyva és archiválva"

A kapu a jóváhagyás; az archiválás semmit nem kérdez újra, csak a jóváhagyott deltát landolja. A
szabály mégis mindkettőt kéri, mert így az elfogadott modell már azt mondja, amit a kód betart, mire
a kód megszületik, és a `kotta gap` a hiányzó bizonyítékot mutatja, nem egy még el sem fogadott
ígéretet. Ez így ment az eddigi change-eknél is (jóváhagyás → archiválás → implementáció). A
`plan-change` skill ma „implement, then `kotta archive`" sorrendet ír; ezt a szabályhoz kell igazítani.

## 3. Az ígéretet nem érintő change

A kivétel szűk: dokumentáció, tiszta refaktor — ami egyetlen elfogadott node-ot sem ad hozzá, nem
változtat meg és nem vesz el. Az ügynök nem hallgatja el, hogy él vele: egy sorban kimondja, így az
ember ott helyben ellentmondhat.

## 4. A `CLAUDE.md`

A projekt `CLAUDE.md`-je ugyanaz a projekt-tulajdonú fájl, mint az `AGENTS.md`: ha nincs, a Kotta
létrehozza (nincs mit védeni), ha van, csak jelzi, és `--link-agents`-re fűz hozzá. A `CLAUDE.md`
a projekt `AGENTS.md`-jét húzza be (`@AGENTS.md`), nem közvetlenül a Kotta szabályait, hogy a
Claude Code ugyanazt olvassa, amit minden más ügynök.
