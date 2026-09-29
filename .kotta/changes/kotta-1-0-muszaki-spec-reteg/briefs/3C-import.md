# 3C — OpenSpec-import

Worktree: `../kotta-k3-import`, ág `spike/k3-import` (az összefésült fejről). Csak ott dolgozz; commitolj; ne pusholj. A `src/cli/index.ts`-ben csak a saját parancsodat regisztráld.

Olvasd: a change `specs/migration/spec.md` („OpenSpec-projekt importálható”), `briefs/README.md`, `src/commands/{plan,archive}.ts`, `src/spec/change.ts`, `skills/plan-change/SKILL.md`.

## Feladat

`kotta import openspec [--change <név>] [--json]` — egy meglévő OpenSpec-projekt (`openspec/specs/**/spec.md`, opcionálisan `openspec/changes/archive/**`) átvétele az új modellbe **a tervezés-fázison keresztül**, nem közvetlen fordítással.

1. **Mit csinál a parancs (gépi rész):** létrehoz egy change-et (`openspec/changes/<név>/`, alapból `import-openspec-<dátum>`), benne `proposal.md` (mi az import, honnan, hány requirement/scenario), és a `model/` alá **vázlatokat** mintáz: minden `### Requirement:` egy üzleti szabály-vázlat (`kotta spec new business-rule --into`), minden `#### Scenario:` egy példa-vázlat `subjects` éllel a szabályra, a képesség `## Purpose`-a egy cél-vázlat, a `capability:` mező a képesség útvonala. Minden vázlat provenance-e: `level: stated`, `decided_by: agent-decided`, `sources: ["openspec/specs/<cap>/spec.md · Requirement: <név>"]`, quote az első mondat. A requirement-szöveg a Rule/Given-When-Then szakaszokba kerül, kitalált szöveg nélkül; a Rationale/Scope üres marad („nem levezethető a narratív specből” megjegyzéssel).
2. **Amit NEM csinál:** nem talál ki szereplőt, use case-t, entitást, állapotgépet — ezeket a `plan-change` skill ágens-fele vezeti le a `proposal.md`-ből és a narratívából, kérdéssel, ahogy a Kotta 1.0 tervezés-fázisa előírja. A parancs kimenete mondja ki, hogy a vázlatok után a skill fut, majd `kotta plan`.
3. **Ütközés a meglévővel:** ha a `.kotta/spec/` már tartalmaz node-okat, az azonos című vagy `<!-- kotta: ID -->`-vel kötött requirement a meglévő node-ot módosítja (azonos id a `model/`-ben), nem duplikál.
4. **Próbáld ki csak olvasva** az oktat-ai narratív specjén: másold `/Users/rp/Dev/goschool/oktat-ai/openspec/specs` tartalmát egy fixture-be (12 képesség, 112 requirement, 226 scenario), futtasd az importot és a `plan`-t; a jelentésnek ki kell mondania, hogy 112 szabály + 226 példa + 12 cél vázlat készült, mind `agent-decided`, és hogy a tervezés-fázis következik. Ez a `specs/migration` „Import után” forgatókönyve.
5. **Tesztek:** kis fixture (2 képesség, 4 requirement, 6 scenario, egy meglévő node-dal ütközés); az oktat-ai-fixture számai. `npm run typecheck`, `npm test`, `npm run build` zöld.

Minden tisztázatlan pont a change `DECISIONS.md`-jébe („3C:” előtaggal). Zárójelentés magyarul, tömören.
