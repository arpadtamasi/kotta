---
id: BR-01m4ee23pwf0sg22vta05bc2hz
form: business-rule
title: Every requirement has a place in the hierarchy
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P1"
    - ".kotta/changes/hasznalati-eset-hierarchia/conversation.md · P4"
  quote: "rp, 2026-10-08: „általában valami hierarchia kéne, de tudjuk, hogy abba nem fér bele mindig minden” — „akár további hierarchia is indokolt, és vannak overall követelmények”"
  inferred: Whether a missing place is an error or a warning is open below.
---

# Every requirement has a place in the hierarchy

## Rule

Every business rule, interface and quality attribute SHALL either be refined by at least one use case or be marked overall. `kotta validate` SHALL name each one that is neither.

## Rationale

A requirement that no use case relies on and that is not overall either serves nobody the model knows of; naming it makes that visible. With the overall marker there is a place for what genuinely holds everywhere, so nothing has to be forced in.

## Scope

Every workspace using the shipped forms.

## Open decisions

- **Hiba legyen vagy figyelmeztetés, ha egy követelménynek nincs helye?** A meglévő projektekben ma egyetlen szabálynak sincs használati esete (az oktat-ai 113 szabálya ilyen), így hibaként minden ilyen projekt validálása azonnal elbukna. (a) Figyelmeztetés: a `kotta validate` megnevezi őket, de átmegy; egy változás új szabálya viszont hibát kap, ha nincs helye. (b) Mindig hiba. Én az (a)-t javaslom: a régi modellek átmenetileg is használhatók maradnak, az új munka viszont már a helyére kerül.
