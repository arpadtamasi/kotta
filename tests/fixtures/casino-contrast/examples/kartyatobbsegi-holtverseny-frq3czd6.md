---
id: EX-01m37bpjm1x2mtdrc5frq3czd6
form: example
title: Kártyatöbbségi holtverseny
subjects:
  - BR-01m37bp51cabx1qtddekt0x1wr
capability: hungarian-casino-gameplay
provenance:
  level: stated
  decided_by: human
  sources:
    - "change/specs/hungarian-casino-gameplay/spec.md · Klasszikus pontozás / Többségi holtverseny"
    - "operátori döntés (2026-09-24) · 4. döntés"
  quote: "4. döntés — „A többségi holtverseny szabálya CSAK a kártyatöbbségre vonatkozik (26–26). A pikktöbbségi holtverseny lehetetlen (13 pikk, páratlan), ezért az arra vonatkozó rendelkezést törölni kell a követelményből és a"
---
# Kártyatöbbségi holtverseny

## Given

A leosztás véget ért.

## When

A két játékos 26–26 kártyát gyűjtött.

## Then

A rendszer a kártyatöbbségi kategóriában egyik félnek sem ad pontot; pikktöbbségi holtversenyre nincs ág, mert az nem állhat elő.
