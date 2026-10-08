# Használati eset hierarchia: bontás, finomítás, overall követelmények

## Why

Egy több száz csomópontos modellben nem látszik, mi mihez tartozik: a szabály és a használati eset csak
a példákon keresztül kapcsolódik, a board pedig formák szerinti lapos listát mutat. Ha egy termék (a
GoSchool) egy másiknak (az oktat-ai) csak egyes darabjait veszi át, nem számolható ki egyszerűen, mely
követelmények esnek ki. Az oktat-ai specifikációját fa formában megnézve (vázlat, 2026-10-08) a
hierarchia jónak bizonyult; kell további mélység, és vannak az egész termékre vonatkozó követelmények.
Az új fogalmak a bevett UML / use case irodalomra épülnek.

## What changes

- **A use case can be decomposed:** `includes`, `extends` (UML) és opcionális `level` (Cockburn).
- **A use case refines the requirements it relies on:** `refines` él (SysML «refine») a használati esetről
  a szabályokra, interfészekre, minőségi elvárásokra; a lista a használati esetben áll.
- **Overall requirements belong to the product:** az egész termékre vonatkozó követelmények (supplementary
  specification) jelölhetők, és sosem esnek ki.
- **Dropping a use case shows what falls out with it:** egy eset elhagyásakor kiszámolható, mi esik ki, és
  mi marad.
- **Every requirement has a place in the hierarchy:** minden követelményt finomít egy eset, vagy overall.
- **The board shows the specification as a tree:** fa-nézet a „ha elhagyjuk” kiemeléssel.
- **A form change goes through the gate:** a formák változása is egy változás része.
- **A use case can point to a use case in another repository:** a `reference:` használati esetre is.
- Nyolc példa.

## Open decisions

- Legyen-e egy szabálynak otthona — a „refines” szabálynál.
- Hogyan jelölünk overall követelményt — az overall szabálynál.
- Hiba vagy figyelmeztetés, ha egy követelménynek nincs helye — a „place” szabálynál.
