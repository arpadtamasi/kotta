---
id: F-01m01cmzhyt1j41crgnz688n4t
title: A board aria-modal felületei nem tartják bent a billentyűzetfókuszt
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-15'
---
# F-01m01cmzhyt1j41crgnz688n4t — A board aria-modal felületei nem tartják bent a billentyűzetfókuszt

## Observation

A board aria-modal felületei nem tartják bent a billentyűzetfókuszt.

## Evidence

A useDialog (ui/src/App.tsx) belépteti a fókuszt, kezeli az Escape-et és visszaadja a fókuszt, de nincs fókuszcsapda és nincs inert háttér. A drawer, a Run overlay és a CLI sheet role=dialog aria-modal=true, ezért a képernyőolvasó lezárt felületet ígér, miközben Tab-bal a scrim mögötti board elérhető marad. Az impeccable UX-kritika (2026-08-14) P1-ként rögzítette; a 0.6.0-ba menő board sem tartalmaz fókuszcsapdát (a FOCUSABLE/Tab kezelés hiányzik az App.tsx-ből).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
