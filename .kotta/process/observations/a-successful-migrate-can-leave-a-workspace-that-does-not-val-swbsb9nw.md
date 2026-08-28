---
id: F-01m144k7r2xrzvpte7swbsb9nw
title: >-
  A successful migrate can leave a workspace that does not validate, and says
  nothing about it
status: new
origin: human
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
---
# F-01m144k7r2xrzvpte7swbsb9nw — A successful migrate can leave a workspace that does not validate, and says nothing about it

## Observation

A successful migrate can leave a workspace that does not validate, and says nothing about it.

## Evidence

Reported from the GoSchool project on 2026-08-27: 'kotta migrate --dry-run: current: true, nincs tovabbi migracio' and every migration check green, while 'kotta validate 6 hianyzo example -> spec kapcsolat miatt elbukik'. The agent's own conclusion: 'a migracio technikailag sikeres; az uj core szigorubb ellenorzese regi spec- es traceability-hianyokat hozott felszinre'. Migrate reports the shape it carried the workspace to and stops there; whether the result satisfies the rules of that shape is a separate command the operator has to know to run. A migration that lands a workspace its own validator refuses is not finished, and reporting current: true about it says more than the result carries (BR-01m0pw5bc7b1rkg5dct5qgdkmb). The same report also shows sweep flagging four closed tasks with an undeclared deviation, which is the class this workspace carries thirty of - evidence that it is a property of the lifecycle, not of this repository.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
