# Kotta 1.0 — építési briefek

Ez a mappa az OpenSpec-change végrehajtásának ágens-briefjeit tartja, hogy bármelyik modell vagy munkamenet folytatni tudja. A terv maga a change (`proposal.md`, `specs/`, `design.md`, `tasks.md`); a briefek csak a munka felosztását és a közös szerződéseket rögzítik.

## Állapot (2026-09-25)

| Szakasz | Ág | Állapot |
|---|---|---|
| 1. alap: folyamatréteg ki, v6 workspace, migráció v1–v5 → v6, `1.0.0-alpha.1` | `spike/kotta-1.0` @ `8e4a4c4` | kész, 201 teszt zöld |
| 2A. tervezés-fázis: provenance, `spec new --into`, `plan`, `approve` (a kapu), `archive`, `plan-change` skill | `spike/k1-plan` (worktree `../kotta-k1-plan`) @ `495563a` | kész, 222 teszt zöld |
| 2B. modulhatár: `modules`, `modules check`, `modules publish-spec`, `gap` szintek | `spike/k1-modules` (worktree `../kotta-k1-modules`) | kész, 216 teszt zöld; döntések a `DECISIONS.md` „Phase 2B” részében; összefésüléskor a CLI-felület snapshotja (`tests/integration/__snapshots__/surface-snapshot.test.ts.snap`) is újragenerálandó |
| 2C. diagram-nézet a boardon, provenance-jelölés, narratíva-elérés | `spike/k1-ui` (worktree `../kotta-k1-ui`) | nem indult |
| 3. narratíva-desztilláció, OpenSpec-import, a workspace-ek migrálása, végpróba a kaszinón | — | nem kezdtük |

Sorrend: 2A → 2B → 2C egymás után (a párhuzamos indítás egyszerre égeti a keretet), majd a három ág összefésülése `spike/kotta-1.0`-ra (az egyetlen várható ütközés `src/cli/index.ts` parancsregisztrációja), majd 3.

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
