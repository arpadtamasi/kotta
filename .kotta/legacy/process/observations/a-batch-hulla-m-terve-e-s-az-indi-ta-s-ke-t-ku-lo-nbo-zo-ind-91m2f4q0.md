---
id: F-01m0fkznyd8437xdzm91m2f4q0
title: A batch hullám-terve és az indítás két különböző 'indítható' szabályt használ
status: resolved
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:07:11.339Z'
approved_by: cli
approved_at: '2026-08-21T15:07:11.339Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0fkznyd8437xdzm91m2f4q0 — A batch hullám-terve és az indítás két különböző 'indítható' szabályt használ

## Observation

A batch hullám-terve és az indítás két különböző 'indítható' szabályt használ.

## Evidence

planBatchWaves (src/commands/batch.ts:119) kiszűri a batch-en kívüli függőségeket, startBatch executable-számítása (src/commands/batch.ts:340) és startContract (src/commands/contract.ts:152) viszont minden függőséget megkövetel. Így batch validate az első hullámba tesz olyan contractokat, amiket batch start nem indít el: started: [], failures: [], ok: true, a batch mégis activeba lép és coordinator branchet nyit — néma no-op. Ráadásul a dependency-order tervező flattenBatch (batch.ts:78) egyetlen hívó nélkül áll a repóban, miközben az AGENTS.md azt ígéri, hogy kotta batch status dependency order-ben sorol; batchStatus (batch.ts:434) a subtreeContracts deklarációs sorrendjét adja vissza.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
