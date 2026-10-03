# A board mutatja a nyitott változást

## Why

A board csak az elfogadott specifikációt mutatja. Mióta minden javaslat változásként nyílik, és csak
a jóváhagyás után kerül az elfogadott specbe, a döntésre váró munka teljes egészében a változásokban
él — a board pont akkor üres, amikor dönteni kell. A két wing-projektben az egész első szelet egy
változásban ült, és a board semmit sem mutatott.

## What changes

- **Új szabály — The board shows what waits at the gate:** a board felsorolja a nyitott
  változásokat; egy megnyitott változás az összefésült modellt mutatja, megjelölve, mit ad hozzá, mit
  módosít, mit töröl, mellette a javaslatot, a nyitott döntéseket és hogy tervezett-e, jóváhagyott-e.
  Az elfogadott nézet változatlan, a board továbbra is csak olvasható.
- **Módosul — The read-only board:** egy új mondat az utófeltételek közt erről.
- Három példa: a nem commitolt változás megjelenik; a módosított csomópont jelölve van az elfogadotthoz
  képest; az elfogadott nézetet nem érinti a nyitott változás.

Kód ebben a változásban nincs: a megvalósítás a jóváhagyás és az archiválás után jön.

## Open decisions

Nincs: a nyitott változás a munkakönyvtárból olvasódik, „nincs commitolva” jelöléssel (válasz: 2a,
2026-10-03).
