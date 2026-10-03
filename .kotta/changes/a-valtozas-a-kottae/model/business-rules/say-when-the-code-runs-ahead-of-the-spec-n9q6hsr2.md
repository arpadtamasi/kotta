---
id: BR-01m3kdq88m3bgye3xnn9q6hsr2
form: business-rule
title: Say when the code runs ahead of the spec
capability: planning-phase
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
    - "chat with the operator, 2026-09-28"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · E1"
  quote: "rp, 2026-10-01 18:02 UTC: 4 ok"
  inferred: "The rule is the accepted one, and the operator set its force on 2026-09-28. The added sentence - no signal for a promise an approved open change states - was proposed by the agent and accepted by the operator. Dropping the OpenSpec skill from the rule follows the change that made OpenSpec optional; whether the rule stays a signal is the open decision below."
---
# Say when the code runs ahead of the spec

## Rule

An agent MAY implement a change whether or not its model delta has been through the gate. When the code it writes keeps, changes or drops a promise the accepted model does not state, the agent SHALL say so to the human in one line, naming the promise in plain words, and SHALL offer the planning phase (`plan-change`) to bring the model up to the code. It SHALL NOT stop, refuse or delay the work for this. A promise that an approved change, still open, already states is not ahead of the spec: code that builds such a change needs no signal, for that promise has been through the gate and waits only for its archive. When the work touches no promise — documentation, a pure refactor — it says nothing about the spec.

## Rationale

The operator's concern was that an agent working from a change leaves the model aside and the technical model silently falls behind the code. The operator also said the rule must not be forceful. A one-line signal at the moment of drift keeps the human informed and the choice theirs: plan now, or later, or not at all. A prohibition would turn Kotta into a process engine again, which 1.0 removed on purpose.

## Scope

Every agent working in a Kotta repository, on any host, on any change. The signal is the agent's, carried by the shipped rules file; the CLI does not see code being written and enforces nothing. `kotta gap` remains the after-the-fact measure of the same drift.

## Open decisions

- **Szabad-e a kódnak megelőznie a specet?** Ez a szabály ma azt mondja: az ügynök megírhatja a kódot a jóváhagyás előtt is, csak egy sorban szólnia kell, ha olyan ígéretet ír, amit a modell nem tartalmaz; tiltani azért nem tilt, mert az „folyamatgéppé tenné a Kottát”. Október 3-án ezt írtad: „ne előzze soha”. Ha ez minden Kotta-projektre és minden ügynökre szól, a szabály megfordul: a kód csak egy jóváhagyott változás után készülhet, és az ügynök előbb a változást nyitja meg. Ha csak arra szólt, ahogy én dolgozom, a szabály marad jelzés, és én tartom magam a szigorúbbhoz. (a) Minden projektre: a kód soha nem előzi meg a jóváhagyott változást. (b) Marad a jelzés, a szigor csak az én munkámra vonatkozik. Én az (a)-t javaslom, mert a mostani két esetben is a jelzés kevés volt: a modell lemaradt, és csak utólag derült ki.
