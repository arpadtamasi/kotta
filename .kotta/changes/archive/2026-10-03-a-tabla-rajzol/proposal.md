# A tábla maga rajzol, és az ábra elvihető

## Why

A tábla diagramjai „elég bénán néznek ki” (SZ1): a Mermaid dagre-elrendezése az éleket
keresztül-kasul húzza, és a csomópontok csak témaváltozókkal stílusozhatók. Egymás mellé téve
a dagre-t, a Mermaid ELK-elrendezőjét és egy saját, React Flow + ELK rajzolót: „a dagre szar, a
másik kettő jó, be tudod tenni mindbe?” (SZ3). A kettőt egymás mellett akarja látni a saját
projektjein: „akarom figyelni, melyik mikor hogy működik” (SZ7). És az ábrát a tábláról el is
akarja vinni: „copyzni svg-ként vagy png-ként, a ui-ról” (SZ8).

Közben kiderült, hogy egy állapotgép, amelynek átmenetei egyetlen bekezdésben állnak, egyáltalán
nem rajzolódik ki („a state machine nem jó”, SZ5), és hogy az ilyen bekezdés egy feltételt is
állapotként írhat (`last direct member terminal -> done`).

## What changes

- **A tábla maga rajzol.** A használati eset, az entitás- és az állapotgép-diagram alapból a tábla
  saját rajzolójával készül (React Flow, ELK-elrendezéssel): minden csomópont a tábla saját
  jelölése, a provenance-kerettel, kattintásra megnyílik, rámutatásra kiemeli a kapcsolatait.
  A diagram fölötti kapcsoló ugyanazt Mermaiddal (szintén ELK) rajzolja újra; a választás a
  címben marad. A dagre-elrendezés megszűnik.
- **Az ábra elvihető.** Minden diagram alatt: PNG másolása, SVG másolása, PNG mentése, SVG mentése.
  Az SVG maga a rajz (alakzatok és szöveg, nem képernyőkép), a PNG úgy néz ki, mint az oldalon.
  A tábla továbbra is csak olvas: az elvitel semmit nem ír a munkaterületre.
- **A bekezdésben írt állapotgép is kirajzolódik.** Ha a Transitions szakasz egy bekezdésben,
  mondatonként írja le az `A → B: miért` átmeneteket, a tábla mindegyiket kirajzolja; a mondat
  közepén említett nyíl próza marad. Ha a States szakasz felsorolja az állapotokat, és egy
  átmenet vége nincs köztük, az feltételként („when …”) jelenik meg, nem állapotként.

Változatlan marad: *The read-only board* (a tábla csak olvas), *The board shows what waits at the
gate* (a nyitott change-ek ugyanígy rajzolódnak), és a story map, ami nem gráf, kártyarács marad.

## Open decisions

Nincs nyitott döntés: a kód a kérésre már elkészült, a modell ezt hozza utol a kiadás előtt.
