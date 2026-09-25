# Kotta 1.0 — építési briefek

Ez a mappa az OpenSpec-change végrehajtásának ágens-briefjeit tartja, hogy bármelyik modell vagy munkamenet folytatni tudja. A terv maga a change (`proposal.md`, `specs/`, `design.md`, `tasks.md`); a briefek csak a munka felosztását és a közös szerződéseket rögzítik.

## Állapot (2026-09-25)

| Szakasz | Ág | Állapot |
|---|---|---|
| 1. alap: folyamatréteg ki, v6 workspace, migráció v1–v5 → v6, `1.0.0-alpha.1` | `spike/kotta-1.0` @ `8e4a4c4` | kész, 201 teszt zöld |
| 2A. tervezés-fázis: provenance, `spec new --into`, `plan`, `approve` (a kapu), `archive`, `plan-change` skill | `spike/k1-plan` (worktree `../kotta-k1-plan`) @ `495563a` | kész, 222 teszt zöld |
| 2B. modulhatár: `modules`, `modules check`, `modules publish-spec`, `gap` szintek | `spike/k1-modules` (worktree `../kotta-k1-modules`) | kész, 216 teszt zöld; döntések a `DECISIONS.md` „Phase 2B” részében; összefésüléskor a CLI-felület snapshotja (`tests/integration/__snapshots__/surface-snapshot.test.ts.snap`) is újragenerálandó |
| 2C. diagram-nézet a boardon, provenance-jelölés, narratíva-elérés | `spike/k1-ui` (worktree `../kotta-k1-ui`) | kész, 239 teszt zöld; négy diagram-nézet, provenance-jelölés és -szűrő, `GET /api/narrative`; `ui-dist/` 1,2 MB (Mermaid lustán tölt) |
| összefésülés: 2A+2B+2C egy fejen | `spike/kotta-1.0` @ `6e7711b` | kész, 275 teszt zöld, 16 parancs |
| végpróba a kaszinón: migrate → plan → approve → archive | `/Users/rp/Dev/phd/oktatas/kaszino-e2e` | kész; 4 javítandó (3A) |
| 3A. a végpróba javításai | `spike/k3-fix` (worktree `../kotta-k3-fix`) | kész, 287 teszt zöld; glossary-kontraszt állításból (a kaszinón 8 → 0 hamis jelölt), (f) quote/forrás, `validate` a change-node-okat is kimondja, SHALL/MUST a modellben (`normative_sections`: figyelmeztetés / change-ben hiba), interfész-szerződés mint scenario, `narrative: generated \| authored`, `judged` blokk a (c)-ben; döntések a `DECISIONS.md` „3A:” pontjaiban |
| 3B. narratíva-desztilláció (`kotta narrative`) | `spike/k3-narrative` (worktree `../kotta-k3-narrative`) | kész, 293 teszt zöld (+18); `kotta narrative <change> --from <napló\|könyvtár> [--since] [--json]` Claude Code- és Codex-naplóból írja a `conversation.md`-t (SZ/J/E/K/P tételek, szűrés fajtánként); a `plan` (f) listázza a fel nem oldható `conversation.md`-hivatkozásokat; a board a `#rész` alakot is olvassa; döntések a `DECISIONS.md` „Phase 3B” részében; összefésüléskor a CLI-felület snapshotja újragenerálandó |
| 3C. OpenSpec-import (`kotta import openspec`) | `spike/k3-import` (worktree `../kotta-k3-import`) | kész, 282 teszt zöld; oktat-ai-fixture: 112 szabály + 226 példa + 12 cél vázlat, mind `agent-decided`, a `plan` 486 hiányt nevez; döntések a `DECISIONS.md` „3C:” pontjaiban; összefésüléskor a CLI-snapshot újragenerálandó |
| 3. összefésülés: 3A+3B+3C egy fejen | `spike/kotta-1.0` @ `6e09cdc` | kész, 312 teszt zöld, 18 parancs |
| use case és user story nem Requirement a generált specben (operátori döntés: SHALL csak a narratív specben) | `spike/kotta-1.0` @ `f45d17b` | kész |
| 3D. a workspace-ek migrálása | Kotta: `f40331b` (spike ág); goschool: `kotta-1.0-migration` ág, `../goschool-k1` worktree | kettő kész, öt hátra |
| kiadás: `main`-be fésülés, npm `1.0.0-alpha.1`, `site/` | — | nem kezdtük |

Sorrend, ahogy megtörtént: 1 → 2A → 2B ∥ 2C → összefésülés → végpróba → 3A ∥ 3B ∥ 3C → összefésülés → migrációk. Hátra: a maradék öt workspace migrálása (egyenként, az operátor igenjével) és a kiadás.

## Közös szerződések (mindhárom ág ezekre épít)

**Provenance a node frontmatterében** (opcionális, a change `model/` alatt kötelező):

```yaml
provenance:
  level: stated | partly-inferred | inferred
  decided_by: human | agent-proposed-human-approved | agent-decided
  sources: ["<fájl> · <követelmény vagy szakasz>", ...]
  quote: "<≤ 30 szó; beszélő és időbélyeg, ha beszélgetésből jön>"
  inferred: "<mit kellett pótolni>"   # kötelező, ha level != stated
```

**Change-mappa:** `openspec/changes/<név>/model/<forma-könyvtár>/<slug>-<id8>.md` a modell-delta (új node `kotta spec new --into <change>`-dzsel, módosított elfogadott node ugyanazzal az id-vel, törlés `model/REMOVED.md`-ben); `planning.md` a tervezési jelentés; `approval.yaml` a kapu nyugtája; opcionális `conversation.md` a desztillált narratíva.

**Opcionális `capability:` mező** minden formán (útvonal, pl. `identity/user-auth`): a narratív spec `openspec/specs/<capability>/spec.md` ebből generálódik archiváláskor.

**Modul:** sosem frontmatter-mező, a bizonyíték helyéből levezetve; kivétel az interfész-node `module:` mezője („ennek a modulnak a felülete”) és a `reference:` blokk (másik repó modulja).

## Ellenőrzés minden ág végén

`npm run typecheck`, `npm test`, `npm run build` zöld; a tesztek követik a `tests/` mintáit; minden nem egyértelmű pont `DECISIONS.md`-be kerül (egy bullet), nem csendes megoldásba.
