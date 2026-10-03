---
id: BR-01m40e512w8y3mc0nm80aa9a08
form: business-rule
title: Evidence is sought where the project says its code is
capability: evidence
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md · P2"
    - ".kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/proposal.md · Why"
  quote: "rp, 2026-10-03: de tiltás helyett inkább azt kéne megmondani, hogy miben igen […] a determinisztikus tiltás mindig rossz lesz"
  inferred: "The operator set the direction: name where evidence is, not where it is not. Where the list comes from, what holds while it is missing, and what becomes of the six excluded sources are open."
---
# Evidence is sought where the project says its code is

## Rule

`kotta gap` and `kotta modules` SHALL seek a node's evidence, and enforced behaviour with no specification trace, only in the paths where the project says its code and its tests are; a file outside them SHALL count for nothing, whatever it names or enforces. The head of the report SHALL name the paths it read.

## Rationale

A list of what not to read is always behind: the next repository keeps a vendored skill set, a generated client or a copied tool somewhere no list foresaw, and its lines drown the report - in the health-ai repository 141 of 145. The operator: "tiltás helyett inkább azt kéne megmondani, hogy miben igen", and "a determinisztikus tiltás mindig rossz lesz". The project knows where its own code is; the report should read there.

## Scope

The evidence search and the reverse search of `kotta gap` and `kotta modules`, and where the project states its code paths. Not what evidence is: a citation of the node's id, as *Every accepted promise is kept or admitted* says.

## Open decisions

- Honnan tudja a Kotta, hol van a projekt kódja és tesztje? (a) A projekt sorolja fel a `.kotta/config.yaml`-ban (például `evidence: [src/, tests/]`); a `kotta init` és a `kotta migrate` a repó alapján javasol egy listát, amit az ember átír. (b) A Kotta a csomagleírókból (package.json, pyproject és társaik) vezeti le - de egy gyökérben lévő leíró az egész repót jelenti, így a bemásolt skillek is benne maradnának. (c) Az ügynök javasolja a beszélgetésben, és a lista a specifikáció része lesz, egy change kapuján átmenve. Az én javaslatom az (a): egyszerű, látható, és a projekt maga dönt.
- Mi legyen, amíg egy projekt nem mondta meg (minden mai projekt ilyen)? (a) A jelentés az egész repót olvassa, ahogy ma, és a feje egy sorban jelzi, hogy a lista hiányzik és hol adható meg. (b) A `kotta gap` megáll, és kéri a listát. Az én javaslatom az (a): semmi nem törik el a frissítéskor, és a zajos projekt egy sorból megtudja, mit tegyen.
- Ma hat rögzített kizárás van: a Kotta munkaterülete, az OpenSpec könyvtárai, a csomagok közzétett specifikáció-másolata és a `node_modules`. Ezek a te elved szerint is determinisztikus tiltások. Mi legyen velük? (a) Maradnak mindenhol, a megadott útvonalakon belül is. (b) Csak addig érvényesek, amíg a projekt nem adta meg a listát; utána csak a lista számít. (c) Megszűnnek. Az én javaslatom a (b): a megadott lista az igen, és amíg nincs, a mai viselkedés véd a specifikáció másolatai ellen.
