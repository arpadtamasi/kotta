---
id: T-023
title: A szotar atallitasa es a kotta migrate parancs
status: done
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: P-004
depends_on:
  - T-021
blocks: []
branch: feat/T-023-a-szotar-atallitasa-es-a-kotta-migrate-parancs
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-02'
assigned_agent: claude
resolution: completed
---
# T-023 — A szótár átállítása és a `kotta migrate` parancs

## Outcome

The code speaks the new vocabulary, and a single command carries any workspace across: `kotta migrate` renames the directory, the entities, the stored statuses and the references, idempotently, with a dry run first. This repository is migrated by running it — and so is every workspace anyone else has.

## Context

D-01kz240dn155hb97h6px6n2p85 closed the vocabulary: `finding` → **observation**, `ticket` → **contract**, `package` → **batch**, and the `kind` field disappears. The previously decided `ready` → `defined` rides along. D-004's `goal`/`run` split is dropped.

The operator's insight shapes this ticket: the migration is **not agent work**. A deterministic rename across 164 entities, repeated in three repositories, is what a script does perfectly and an agent does expensively and unevenly. Making it a command also means it ships — every Kotta user migrates the same way we do, and the neighbour-migration ticket becomes "run the command" instead of "do it again by hand".

## Scope

- The code speaks the new names: types, functions, CLI verbs, API routes, schemas, skills, documentation.
- Stored form follows: status value and directory `ready` → `defined`; the entity directories take the new names.
- The `ticket ready` promotion verb is renamed as part of this — `define` is already taken by contract-writing, so the new verb name is part of the work, not an afterthought.
- The `kind` field is removed from batches, its validation with it.
- **`kotta migrate`** — one command that takes a workspace from any older shape to the current one: the workspace directory (`.a-team` → `.kotta`), the entity directories, the stored statuses, and every reference between entities. Idempotent. `--dry-run` reports exactly what it would change and touches nothing.
- The **migration command** understands the old shape — by definition, since that is what it reads. The rest of the CLI does not: once migrated, no reader carries a fallback. There are four Kotta workspaces in the world (this one, oneanda, crm-kit, flowbench) and all four are migrated in this package, so a general compatibility layer would be insurance for nobody.
- This repository's own workspace is migrated by running the command — not by hand, not by the agent editing files.

## Non-goals

- Renaming identifiers. Ids stay exactly as they are, per D-010 — this is vocabulary, not identity.
- Migrating the neighbour workspaces; that is the next ticket, and it will consist of running this command.
- The two questions D-004 still parks: the assess gate, and whether an open question is a first-class entity.
- A general backward-compatibility layer for old workspaces. Only the migration command reads the old shape.
- Any change to what the board displays; its labels are already the new vocabulary.

Note the ordering hazard this creates: between this ticket landing and the neighbours being migrated, those three workspaces are on the old shape with a CLI that refuses it. The refusal names the command, and the next ticket runs it — but the window is real and deliberate.

## Acceptance

1. `kotta migrate --dry-run` on a fixture in the old shape lists every change and modifies nothing — verified by comparing the tree before and after.
2. `kotta migrate` on that fixture produces a workspace that `kotta validate` accepts, with every cross-reference still resolving.
3. Running it a second time changes nothing and says so.
4. A workspace already in the new shape is left alone.
5. A workspace still in the old shape is refused by the ordinary commands with an error that names `kotta migrate` — and is read correctly by the migration command itself.
6. No identifier changes anywhere — asserted by diffing ids before and after.
7. This repository's workspace is migrated by the command; the commit shows the command's output, and `kotta validate` is green afterwards.
8. A fixture the size of oneanda's (160+ contracts, 100+ observations, 20+ batches) migrates and validates.
9. `kind` is gone from batches and from the schema; a batch that still carries it loads with a warning.
10. Full suite, typecheck and all three builds green.

## Verification

Integration tests over fixtures in the old shape: dry run, migrate, re-migrate, already-new, and a large fixture built from a copy of oneanda's shape. Id-stability asserted by set comparison before and after. Then run the command on this repository and commit the result with its output.

## Constraints

The migration never loses a reference and never changes an id. It is idempotent and safe to interrupt: a partial run leaves a workspace that either still validates or names exactly what remains. Every write goes through supported writers. The command must work on a workspace produced by an older released CLI, because that is what the neighbours have.

## Open decisions

None.

## Execution notes

`workspacePath()` in `src/filesystem/workspace.ts` (T-020) already centralises the directory name — the migration extends that seam rather than fighting it. `TICKET_STATES` and `PACKAGE_STATES` in `src/filesystem/entities.ts` enumerate the directories. The reference fields to carry across are `depends_on`, `blocks`, `package`, `source_finding`, `discovered_during`, `became`, and a batch's `tickets` list.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Contract acceptance criteria | Friss agens, brief 3246 token. A briefbol HIANYZOTT a szotar-dontes (a szkenner nem ismeri a mintazott azonositokat — kulon observationkent rogzitve), ezert az agens kozvetlenul kapta meg a dontes utvonalat. 50 perc, 156 tool-hivas, hat commit. A szotar minden retegben mozdult: CLI-igek, tarolt allapot-konyvtarak, frontmatter-mezonevek, config-kulcsok, JSON-semak, API-utvonalak, skillek, dokumentacio. A promocios ige uj nevet kapott (a 'define' a szerzodesirasra foglalt): 'kotta contract sign <id> --approve' — a szerzodes akkor valik kotelezove, amikor alairjak. A parancs: 'kotta migrate [--workspace <path>] [--dry-run] [--json]'. Mozgatja a '.a-team'-et '.kotta'-ra (csak VALODI legacy konyvtarat; a symlink-hidat bekeben hagyja), ready/->defined/, findings/->observations/, packages/->batches/. Frontmattert ir at: contract package->batch es source_finding->source_observation, batch tickets->contracts es kind eldobva, observation finding_type->observation_type, claim ticket->contract, config packages->batches es version 1->2. Ujragenralja az indexet. Idempotens es megszakitas-biztos: minden lepes a LEMEZ allapotabol szarmazik, nem halado-jelolobol; letezo celkonyvtart bejegyzesenkent olvaszt ossze. Id-biztos: osszeveti az azonosito-halmazt elotte-utana es inkabb dob, mint hogy veszitsen. Acc1: dry-run — sha1 fa-pillanatkep bitre azonos elotte-utana, a jelentes mind az ot mozgatast es minden mezo-atnevezest felsorolja. Acc2: futas utan validate ok:true, es minden batch/source_observation/depends_on/contracts hivatkozas felolodik. Acc3-4: masodik futas 'already on the current shape', pillanatkep valtozatlan; mar uj alaku workspace-en changes:[]. Acc5: a hetkoznapi parancsok elutasitjak a regi alakot es megnevezik a migrate-et — validate, status, contract validate, batch validate, claim list mind exit 1-gyel, beagyazott cwd-bol is; a refuzalas preAction hookbol jon, tehat parancs nem tudja kihagyni (kivetel init, migrate, ui). Acc6 (a legfontosabb): 110 azonosito bitre azonos ES 111 hivatkozasi el bitre azonos, fuggetlen szkripttel osszevetve a 'git show HEAD~:.kotta/**' es a lemez kozott. Acc7: E REPOT a PARANCS migralta, nem kezi szerkesztes — 104 valtozas, a 8224fde commit szo szerint hordozza a kimenetet; utana validate ok:true, 42 contract, 12 dontes. Acc8: 165 contractos / 105 observationos / 21 batches fixture 856 ms alatt migral es validal. Acc9: a --kind elutasitva, a semabol eltunt, a meg kind-ot hordozo batch ok:true-val validal warninggal. Acc10 (sajat ujrafuttatasom): tsc --noEmit tiszta, vitest 34 fajl / 211 passed / 1 skipped, mindharom build zold; a CLI felulete most contract / observation / batch / decision / migrate, benne a 'contract sign' es a 'contract execute'. A board-uressegi kockazatot ketfelol kezelte: a migrate a vegen kimondja, hogy a board a main refrol olvas es ures lesz, amig a commit oda nem er; es a /api/workspace mostantol notices-t ad vissza, amit a board mindenek fole kirajzol. A csomagolt examples/demo-project workspace-t szinten a PARANCS migralta. |

### Verification performed

Friss agens, brief 3246 token. A briefbol HIANYZOTT a szotar-dontes (a szkenner nem ismeri a mintazott azonositokat — kulon observationkent rogzitve), ezert az agens kozvetlenul kapta meg a dontes utvonalat. 50 perc, 156 tool-hivas, hat commit. A szotar minden retegben mozdult: CLI-igek, tarolt allapot-konyvtarak, frontmatter-mezonevek, config-kulcsok, JSON-semak, API-utvonalak, skillek, dokumentacio. A promocios ige uj nevet kapott (a 'define' a szerzodesirasra foglalt): 'kotta contract sign <id> --approve' — a szerzodes akkor valik kotelezove, amikor alairjak. A parancs: 'kotta migrate [--workspace <path>] [--dry-run] [--json]'. Mozgatja a '.a-team'-et '.kotta'-ra (csak VALODI legacy konyvtarat; a symlink-hidat bekeben hagyja), ready/->defined/, findings/->observations/, packages/->batches/. Frontmattert ir at: contract package->batch es source_finding->source_observation, batch tickets->contracts es kind eldobva, observation finding_type->observation_type, claim ticket->contract, config packages->batches es version 1->2. Ujragenralja az indexet. Idempotens es megszakitas-biztos: minden lepes a LEMEZ allapotabol szarmazik, nem halado-jelolobol; letezo celkonyvtart bejegyzesenkent olvaszt ossze. Id-biztos: osszeveti az azonosito-halmazt elotte-utana es inkabb dob, mint hogy veszitsen. Acc1: dry-run — sha1 fa-pillanatkep bitre azonos elotte-utana, a jelentes mind az ot mozgatast es minden mezo-atnevezest felsorolja. Acc2: futas utan validate ok:true, es minden batch/source_observation/depends_on/contracts hivatkozas felolodik. Acc3-4: masodik futas 'already on the current shape', pillanatkep valtozatlan; mar uj alaku workspace-en changes:[]. Acc5: a hetkoznapi parancsok elutasitjak a regi alakot es megnevezik a migrate-et — validate, status, contract validate, batch validate, claim list mind exit 1-gyel, beagyazott cwd-bol is; a refuzalas preAction hookbol jon, tehat parancs nem tudja kihagyni (kivetel init, migrate, ui). Acc6 (a legfontosabb): 110 azonosito bitre azonos ES 111 hivatkozasi el bitre azonos, fuggetlen szkripttel osszevetve a 'git show HEAD~:.kotta/**' es a lemez kozott. Acc7: E REPOT a PARANCS migralta, nem kezi szerkesztes — 104 valtozas, a 8224fde commit szo szerint hordozza a kimenetet; utana validate ok:true, 42 contract, 12 dontes. Acc8: 165 contractos / 105 observationos / 21 batches fixture 856 ms alatt migral es validal. Acc9: a --kind elutasitva, a semabol eltunt, a meg kind-ot hordozo batch ok:true-val validal warninggal. Acc10 (sajat ujrafuttatasom): tsc --noEmit tiszta, vitest 34 fajl / 211 passed / 1 skipped, mindharom build zold; a CLI felulete most contract / observation / batch / decision / migrate, benne a 'contract sign' es a 'contract execute'. A board-uressegi kockazatot ketfelol kezelte: a migrate a vegen kimondja, hogy a board a main refrol olvas es ures lesz, amig a commit oda nem er; es a /api/workspace mostantol notices-t ad vissza, amit a board mindenek fole kirajzol. A csomagolt examples/demo-project workspace-t szinten a PARANCS migralta.

### Deviations

Negy tetel. (1) A '.a-team' KONYVTARNEV olvashato marad: az agens a pre-vocabulary ALLAPOT-KONYVTARAKAT tekintette 'regi alaknak', ami elutasitast valt ki, a workspace-konyvtar nevet viszont tamogatott aliasznak hagyta — a D-007/T-020 igy dontott, es harom teszt szandekosan fixture-ozi. A migrate a valodi '.a-team'-et tovabbra is atmozgatja. (2) A migration.json megtartja regi kulcsneveit (tickets/findings/packages): Kotta elotti import-artefaktum, amit a board olvas vissza; a kulcsok atnevezese eltorne a mar importalt workspace-eket. (3) Uj --workspace kapcsolo a migrate-en, hogy a beagyazott, nem-git peldat is a PARANCS migralja. (4) A config version 1->2 — nem volt a szerzodesben, de az alak tenylegesen valtozott. Tovabba: az entitasok TORZSEBEN a proza NINCS atirva — a migracio a frontmattert, a claimeket, a configot es az indexet erinti; a tortenelmi feljegyzesek megtartjak a szavakat, amikkel irtak oket.

### Observations created

Negy observation. F-01kz294gj4sy9gcc56s8j3h62g (bug) — a gray-matter memoizalja a frontmattert, ezert minden iro egy KOZOS objektumot mutal; ez elesben megharapta a migrate-et, es csak ott van megkerulve. Ez a legkomolyabb. F-01kz294gmp94tmevyf3hcysj58 — a migration.json a pre-vocabulary szavakat orzi hataridő nelkul. F-01kz294xzzcswpmkg91n909nqf — a '.a-team' konyvtarnev tulel a szotar-migracion. F-01kz294y2ev4068xsnge5asz8x — a publikalt JSON-semak olyan dokumentacio, amit semmi nem ellenoriz (masodik fuggetlen jelzes ugyanerre).

### Known concerns

(a) A gray-matter megosztott-objektum hiba TERMEKSZINTU: ma csak a migrate keruli meg, de minden iro erintett. Ez a legfontosabb, amit tovabb kell vinni. (b) A '.a-team' alias vege nincs kimondva; harom teszt fixture-ozi. (c) A promocios ige uj neve ('contract sign') a ticket altal delegalt dontes volt — most a legolcsobb megvaltoztatni, mielott a szomszedok migralnak es a skillek beleivodnak.
