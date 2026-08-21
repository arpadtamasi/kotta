---
id: T-01m00ejpqkrqy4mcpk05txpc2t
title: A lezárt skills-sync contract eltérései nincsenek deklarálva
status: backlog
origin: observation
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-14'
updated_at: '2026-08-14'
source_observation: F-01m00e988sfbhses939jkezp7j
---
# A lezárt skills-sync contract eltérései nincsenek deklarálva

## Outcome

A lezárt `T-01kzgn32keps18769dp5rstcgt` contract strukturált `### Deviations` szakasza ugyanazt a négy eltérést rögzíti, amelyet a saját, korábban elfogadott `### Verification performed` prózája már felsorol. A repositoryn a `kotta validate --json` ismét `ok: true` eredményt ad, `DEVIATION_MISMATCH` nélkül.

## Scope

- A `.kotta/done/kotta-sync-installs-the-skills-kotta-ships-p5rstcgt.md` fájl `### Deviations` szakaszában a `Not declared.` érték lecserélése a fájl saját review-prózájában a `DEVIATIONS.` jelölés alatt szereplő négy eltérésre:
  1. a contractban nem leírt, egyfájlos ownership manifest;
  2. az absent installok külön státuszjelentése;
  3. a scope-ban nem szereplő README-módosítás;
  4. a tesztek által véletlenül a valódi skill-home-ba írt telepítés és annak javítása.
- A szöveg forrása kizárólag a lezárt contract saját, már elfogadott review-prózája lehet; új értelmezés vagy új eltérés nem kerülhet a rekordba.

## Non-goals

- Nem nyitjuk újra a lezárt contractot, és nem változtatjuk meg az elfogadását vagy a `completed` resolutiont.
- Nem módosítjuk a verification narrative-ot, az acceptance-evidence táblát, a frontmattert vagy más Kotta-entitást.
- Nem módosítunk termékkódot, validációs szabályt, sablont vagy tesztet.
- Nem érintjük a review-ban lévő contract-gate javítást.

## Acceptance

1. A célfájl `### Deviations` szakasza mind a négy, saját review-prózájában már kimondott eltérést felsorolja, és nem tartalmazza a `Not declared.` értéket.
2. A célfájl diffje kizárólag a `### Deviations` szakaszt érinti; a frontmatter, a review evidence, a verification narrative és a resolution byte-szinten változatlan marad.
3. `kotta validate --json` `ok: true` eredményt ad, és nincs `DEVIATION_MISMATCH`.
4. A célzott deviation-reconciliation teszt és a repository teljes tesztkészlete zöld.

## Verification

- `git diff --word-diff=plain` és `git diff --stat` a célfájlon.
- `kotta validate --json`.
- `npx vitest run tests/integration/deviation-reconciliation.test.ts`.
- `npm test`.

## Constraints

- A `.kotta` állapotot csak a jóváhagyott contract végrehajtási worktree-jében, a contract kifejezett scope-ja szerint szabad módosítani.
- A beemelt eltérések jelentése nem változhat; csak a strukturált mezőbe kerülnek át.
- A javítás minimális: egy fájl, egy szakasz.

## Open decisions

None.

## Execution notes

Ez történeti state-repair, ugyanaz a javítási minta, mint a lezárt `T-033` contractnál. A `contract reopen` út nem megfelelő, mert egy kész contractot backlogba tenne, és törölné a történeti branch/worktree metaadatait.
