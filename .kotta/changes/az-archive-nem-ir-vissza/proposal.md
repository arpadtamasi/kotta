# Az archiválás nem ír vissza régebbi szöveget

## Why

A #61-es hiba: ha egy jóváhagyott változás kimásol egy elfogadott csomópontot, és közben egy másik
változás átírja azt, az első archiválása szó nélkül visszaírja a régi szöveget, és ezzel visszacsinál
egy jóváhagyott döntést. Ez október 6-án megtörtént; csak a diff elolvasása fogta meg.

## What changes

- **Új szabály — Archive never puts back an older accepted text:** a jóváhagyás rögzíti minden
  lecserélt csomópont akkori szövegének ujjlenyomatát; az archiválás megáll, ha az azóta változott,
  megnevezi a csomópontot, és semmit nem ír.
- **Módosul — An approval leaves a receipt:** a nyugta ezt az ujjlenyomatot is tartalmazza.
- Két példa: a jóváhagyás után módosított csomópont megállítja az archiválást; a változatlan úgy
  kerül be, mint eddig.

## Open decisions

- Mi legyen a szabály előtti jóváhagyásokkal — a szabálynál.
