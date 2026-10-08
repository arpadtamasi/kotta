---
id: BR-01m4ee234nxva765r3jq5vmw01
form: business-rule
title: A use case refines the requirements it relies on
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P1"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P5"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · J1"
    - "chat · rp, 2026-10-08 (oktat-ai session cb932801): the test-chat question"
  quote: "rp, 2026-10-08: „belefér a standard uml use case-be?” — „igen” (to: build on include/extend, Cockburn levels, SysML refine, a supplementary specification)"
  inferred: "Naming the edge after SysML «refine», keeping the list on the use case and allowing a requirement to be refined by several use cases is the agent's design; whether one of them is the requirement's home is open below."
---

# A use case refines the requirements it relies on

## Rule

A use case SHALL be able to name, under `refines`, the business rules, interfaces and quality attributes that state what it relies on, after the SysML «refine» relationship. A requirement MAY be refined by several use cases. The list SHALL stand on the use case; Kotta SHALL find the use cases that refine a requirement from the requirement's side without the requirement naming them.

## Rationale

Today a rule reaches a use case only through the examples that prove both, so the question which rules a use case relies on can be answered only by walking every example. A direct edge answers it in one step, and keeping the list on the use case means a dozen files change, not a hundred.

## Scope

The use-case form Kotta ships; the business-rule, interface and quality-attribute forms gain the matching incoming edge.

## Open decisions

- **Legyen-e egy szabálynak „otthona”, vagy elég, hogy több használati eset finomítja?** Egy szabályt több eset is használhat: a „Hivatkozás a helyre” a diák kérdezéséhez és a tanár teszt-chatjéhez is kell. (a) Nincs külön otthon: a szabály minden eset alatt megjelenik, amelyik finomítja, és akkor esik ki, ha mindegyik kiesett. Egyszerűbb, és pontosan a UML/SysML jelentése. (b) Az egyik eset az otthon (a szabály megnevezi), a többi csak „ezt is használja”; a fában egy helyen áll, a többinél hivatkozásként. Áttekinthetőbb fa, de egy mezővel több, és a kettő elcsúszhat. Én az (a)-t javaslom: a kiesés kiszámolásához az otthon nem kell, a fa pedig a többi helyen halványabban is mutathatja.
