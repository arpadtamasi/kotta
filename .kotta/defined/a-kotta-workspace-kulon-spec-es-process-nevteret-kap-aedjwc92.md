---
id: T-01m0b63d3xrhpnvbgaaedjwc92
title: A Kotta workspace külön spec és process névteret kap
status: defined
origin: human
types:
  - feature
profiles: []
priority: high
risk: high
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-18'
updated_at: '2026-08-18'
---
# T-01m0b63d3xrhpnvbgaaedjwc92 — A Kotta workspace külön spec és process névteret kap

## Outcome

A Kotta workspace két világos, egymástól fizikailag is elkülönített névteret használ. A
`.kotta/spec/` a projekt által alakítható specifikációs tudásréteg: itt van a forma-regiszter és
itt vannak a formák által deklarált node-könyvtárak. A `.kotta/process/` a Kotta által kezelt
végrehajtási és lifecycle-réteg: itt vannak a contractok, observationök, batchek, profilok,
claimek, eventek, decisionök és a generált process-index.

A `.kotta/` gyökerében csak a workspace bootstrap- és orientációs fájljai maradnak: legalább az
`AGENTS.md`, `README.md`, `config.yaml` és a Kotta saját generálási metadata-fájlja. A contract-kapu
pozitív szemantikája megmarad: contract akkor kell, amikor a munka egy ember által elfogadott,
acceptance-feltételekkel ellenőrizhető termék- vagy deliverable-vállalást hajt végre. A shaping és
specifikáció ebből következően contract nélkül végezhető, ha nem maga az elfogadott deliverable és
nem lép át végrehajtásba.

## Target layout

```text
.kotta/
  AGENTS.md
  README.md
  config.yaml
  .kotta-generated.json
  spec/
    forms/
    <registered form directory>/
  process/
    backlog/
    defined/
    active/
    review/
    done/
    observations/new/
    observations/resolved/
    batches/backlog/
    batches/defined/
    batches/active/
    batches/done/
    profiles/
    claims/
    events/
    decisions/
    index.md
```

Egy forma `directory` mezője a workspace spec-gyökeréhez relatív. Például a `directory: goals`
kanonikus node-helye `.kotta/spec/goals/`, nem `.kotta/goals/`.

## Scenarios

- **S1 — új workspace.** A `kotta init` kizárólag az új nested sémát hozza létre; a
  forma-regiszter `.kotta/spec/forms/`, a process állapot pedig `.kotta/process/` alatt jelenik meg.
- **S2 — lifecycle vertical slice.** Contract new/define/sign/execute/review/close, observation,
  batch, decision, claim, event, status, validate, brief, UI és index minden olvasása és írása a
  `process/` névtérben történik, az eddigi lifecycle-szemantika változtatása nélkül.
- **S3 — specifikációs workshop.** A nyolc workshop-skill a registryt a `spec/forms/` alatt
  olvassa, és a regisztrált node-ot a `spec/<directory>/` alatt írja. A traceability ugyanezt a
  gráfot olvassa, változatlan formamezőkkel és él-szemantikával.
- **S4 — custom form.** A projekt által hozzáadott forma a bundled formákkal azonos módon működik;
  saját `directory` értéke is a `spec/` alá relatív, TypeScript-módosítás nélkül.
- **S5 — lapos workspace dry-run.** Egy jelenlegi `.kotta/` workspace-en a
  `kotta migrate --dry-run` pontosan felsorolja a process-könyvtárak, a `forms/`, a regisztrált
  spec-node könyvtárak, az index és a merge attribute célhelyét, de egyetlen byte-ot sem módosít.
- **S6 — lapos workspace migrálása.** A `kotta migrate` tartalomvesztés nélkül létrehozza az új
  sémát, frissíti a config schema-verzióját és a Git merge attribute-ot; utána `kotta validate`
  zöld, a lifecycle és a spec-gráf ugyanazokat az entitásokat tartalmazza, és egy második migrate
  no-op.
- **S7 — régi vocabulary és `.a-team`.** A meglévő pre-vocabulary és `.a-team` migrációs út az új
  nested sémáig fut végig; nem áll meg egy köztes lapos `.kotta/` állapotban.
- **S8 — konfliktus vagy ismeretlen könyvtár.** Ha a forrás és cél ütközik, egy deklarált spec
  directory nem biztonságosan mozgatható, vagy a rootban nem osztályozható adatkönyvtár maradna, a
  migráció a mutáció előtt, konkrét útvonalakkal megáll. Nem ír felül és nem hagy félmigrált állapotot.
- **S9 — régi séma használata.** A migrate-on kívüli parancsok a lapos sémát nem olvassák félig és
  nem írják tovább: egyértelműen `kotta migrate --dry-run`, majd `kotta migrate` használatára kérnek.
- **S10 — contract-küszöb.** Egy spec-workshop contract nélkül futhat; accepted product execution
  vagy maga a végleges, elfogadandó spec-deliverable aktív contractot és claimet igényel. Ezt egy
  központi agent-szabály mondja ki, nem kilenc skillenkénti kivétel.

## Scope

1. Workspace path-modell bevezetése explicit spec- és process-gyökérrel; minden process reader és
   writer átvezetése a process-gyökérre.
2. `kotta init`, `sync`, `status`, `validate`, `migrate`, UI Git-reader, indexgenerálás,
   `.gitattributes`, CLI és MCP által elért lifecycle-folyamatok frissítése az új sémára.
3. A bundled forma-regiszter telepítése `.kotta/spec/forms/` alá; projekt-owned formák megőrzése;
   a formák `directory` mezőjének spec-relative értelmezése.
4. Mind a nyolc workshop-skill és a `requirements-traceability` útvonalainak frissítése a
   `.kotta/spec/` struktúrára, a skilljeik viselkedésének egyéb megváltoztatása nélkül.
5. Explicit, dry-run képes, idempotens és fail-before-write migráció a jelenlegi lapos `.kotta/`,
   a pre-vocabulary workspace és a támogatott `.a-team` bemenetekből az új nested sémába.
6. A root `AGENTS.md`, `README.md` és a kapcsolódó dokumentáció frissítése: project-owned spec,
   service-owned process, valamint a pozitív accepted-commitment contract-küszöb.
7. A review-ban lévő `T-01m0b3jq2yjxbe173w19axk9x8` contract központi contract-küszöbének
   beépítése ebbe a koherens szerkezeti változásba; a korábbi `4188df4` commit legfeljebb forrásként
   használható, önállóan nem kerül mainbe.
8. Teljes unit, integration és UI regressziós lefedettség új initre, lifecycle vertical slice-ra,
   spec sync/workshop útvonalakra, migrációra, konfliktusokra és legacy kompatibilitásra.

## Non-goals

- A `.kotta` workspace gyökér vagy az `@.kotta/AGENTS.md` pointer átnevezése.
- A contract, observation, batch, decision, claim, event vagy formák adatmodelljének és
  lifecycle-szemantikájának újratervezése.
- Draft/agreed lifecycle vagy CLI/MCP CRUD bevezetése a spec-node-okhoz.
- Külön contract-kivétel másolása a kilenc specifikációs skillbe.
- Korlátlan dual-read kompatibilitási réteg fenntartása a lapos és nested sémára.
- Ismeretlen root könyvtárak automatikus besorolása vagy csendes mozgatása.
- A `config.yaml`, root `AGENTS.md`, root `README.md` vagy generálási metadata áthelyezése a két
  névtér valamelyikébe.

## Acceptance

- **A1** Egy új init pontosan az új root/spec/process tulajdonosi határt hozza létre; nem hoz létre
  `forms/`, lifecycle state-, claim-, event-, decision-, batch-, profile- vagy `index.md` elemet
  közvetlenül a workspace gyökerében.
- **A2** Minden lifecycle és UI olvasó/író `.kotta/process/` alatt működik; egy teljes
  backlog→defined→active→review→done vertical slice, observation/batch/decision folyamat és
  `kotta validate` zöld az új sémán.
- **A3** A forma-regiszter `.kotta/spec/forms/` alatt van; mind a kilenc spec-skill ezt használja,
  és minden bundled vagy custom forma `directory` értéke `.kotta/spec/` alá oldódik fel.
- **A4** `kotta sync` új formát hozzáad, de meglévő bundled vagy custom formát és spec-node-ot nem
  ír felül; az initelt és syncelt workspace ugyanazt a target layoutot tartja.
- **A5** A flat-v2, pre-vocabulary és `.a-team` fixture-ök dry-runja byte-identikus marad, tényleges
  migrációja veszteségmentes, validálható és idempotens; config-verzió és index merge attribute az
  új sémát jelöli.
- **A6** Konfliktusos destination, érvénytelen/custom form directory vagy nem osztályozható root
  adat esetén a migráció konkrét hibával, bármilyen részleges move/write előtt áll meg.
- **A7** A migrate-on kívüli parancs lapos workspace-en determinisztikusan és cselekvőképes
  migrate-útmutatással megtagadja a működést; nincs silent fallback vagy vegyes sémájú írás.
- **A8** A szállított agent-szabály a contractot az elfogadott, acceptance-testelhető vállalás
  végrehajtásához köti, ebből vezeti le a shaping/spec contract-mentességét, és a service-owned
  `process/` rekordokat megkülönbözteti a project-owned `spec/` node-októl.
- **A9** A `.a-team` névkompatibilitás és a root `@.kotta/AGENTS.md` integráció nem regresszál;
  a dokumentáció, skill-útvonalak és hibaüzenetek nem hivatkoznak kanonikus helynek a régi lapos
  `.kotta/forms`, `.kotta/backlog`, `.kotta/claims`, `.kotta/events` vagy `.kotta/index.md` utakra.
- **A10** `npm test`, `npm run typecheck`, `npm run build`, `git diff --check` és `kotta validate`
  zöld; a tesztek külön bizonyítják A1–A9-et és a migráció utáni teljes lifecycle-t.

## Verification

- Friss ideiglenes Git-repository: buildelt CLI-val `kotta init`, target-tree snapshot,
  spec-form és custom-form ellenőrzés, teljes contract lifecycle, observation, batch és decision.
- Migrációs fixture-mátrix: flat v2 `.kotta`, pre-vocabulary `.kotta`, `.a-team`, custom form és
  node-ok, destination conflict, invalid directory, unknown root directory, megszakítás előtti
  fail-fast, második migrate no-op; dry-run előtt/után byte snapshot.
- Git-backed UI és index tesztek az új process prefixszel; `.gitattributes` ellenőrzése
  `.kotta/process/index.md merge=union` értékre.
- Statikus path-audit `rg`-vel: a szállított skillek és dokumentáció nem nevezik a régi lapos
  elérési utakat kanonikusnak.
- `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`, `kotta validate`.

## Constraints

- A migráció adatot nem töröl, meglévő célfájlt nem ír felül és veszélyes konfliktus esetén a
  legelső write előtt áll meg.
- A target workspace schema-verzió egyértelműen megkülönbözteti a lapos és nested alakot.
- A form `directory` továbbra is relatív projektadat; abszolút út, `..` vagy spec-rootból kilépés
  érvénytelen.
- Lifecycle state és látható chat továbbra is a control branchen, implementation továbbra is az
  izolált worktree-ben él.
- A migrációs contract saját rolloutja nem rekedhet meg: merge után a control workspace migrálható,
  majd ugyanazzal az új kóddal a review contract lezárható.
- A szállított agent-, skill-, dokumentáció- és hibaüzenet-szöveg angol marad.

## Open decisions

None.

## Execution notes

Az operátor 2026-08-18-án a review során elutasította azt az architektúrát, amely a
specifikációs formákat/node-okat és a process lifecycle könyvtárait egy szinten hagyta. A jóváhagyott
irány két sibling névtér: `spec/` és `process/`. Ez a contract a korábbi pozitív contract-küszöböt
is magába olvasztja, hogy ne maradjon egy külön, részleges szabályfolt.
