---
id: F-01m0fpzrazg2j031y0h7ddqa23
title: >-
  Az adopter CLI-je elutasítja a spec definíciós mezőt: Unsupported definition
  fields: spec
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
disposition: reject
resolved_at: '2026-08-21T15:06:00.180Z'
approved_by: cli
approved_at: '2026-08-21T15:06:00.180Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0fpzrazg2j031y0h7ddqa23 — Az adopter CLI-je elutasítja a spec definíciós mezőt: Unsupported definition fields: spec

## Observation

Az adopter CLI-je elutasítja a spec definíciós mezőt: Unsupported definition fields: spec.

## Evidence

2026-08-20, goschool session transcriptek: 'kotta contract define T-01m0f0nh989cgcnq9k112de87d --from …' két repóban (goschool-new és kotta-control dist hívás) is {"ok":false,"errors":[{"code":"COMMAND_FAILED","message":"Unsupported definition fields: spec."}]} hibával tért vissza, miközben ugyanott egy contract show már spec sort jelenít meg (T-4ze6s0kq: spec IF-01m0bvbwda…, SM-01m0bvbwda…). A workspace-modell (T-m9zs70ym óta, és a ma landolt fedettség-szabály szerint hangsúlyosan) a contract spec-referenciáira épül; az adopternél futó kiadás ezt a mezőt még elutasítja. Vagy verzió-korcsosulás (a séma és a kiadott CLI szétcsúszott), vagy a define allowlist maradt le — mindkét esetben pont a coverage-mechanizmust blokkolja a terepen.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
