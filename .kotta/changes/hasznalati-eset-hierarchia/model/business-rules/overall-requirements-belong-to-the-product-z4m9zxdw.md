---
id: BR-01m4ee23baq19gd87ez4m9zxdw
form: business-rule
title: Overall requirements belong to the product
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P5"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: "Taking the supplementary specification as the model for product-level requirements was the agent's proposal, accepted; how a requirement is marked overall is open below."
---

# Overall requirements belong to the product

## Rule

A business rule, interface or quality attribute that holds for the whole product, not for one use case, SHALL be markable as an overall requirement, after the supplementary specification of the use-case literature. An overall requirement SHALL belong to the product as a whole: it needs no use case to refine it, and dropping use cases SHALL never drop it.

## Rationale

Some requirements hold everywhere — the browser only reads, the error codes are uniform, one provider's data never reaches another. Forcing them under a use case misplaces them, and leaving them homeless hides that they are deliberate. The operator named them overall requirements.

## Scope

The business-rule, interface and quality-attribute forms Kotta ships.

## Open decisions

- **Hogyan jelölünk egy követelményt overall-nak?** (a) A követelmény maga kap egy jelölést (például `overall: true`), új csomópont nélkül. (b) Lesz egy „termék” csomópont munkaterületenként, és az finomítja az overall követelményeket, ugyanazzal az éllel, mint egy használati eset. A (b) egységesebb, de egy új formát és egy csomópontot hoz, aminek más szerepe nincs. Én az (a)-t javaslom: kevesebb új fogalom, és a fa teteje ugyanúgy megjelenhet a „termék” szinten.
