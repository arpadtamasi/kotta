---
id: T-01m0bvztry5z4j3k72m9zs70ym
title: 'A contract megnevezi a specifikációt, amire támaszkodik'
status: defined
origin: human
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
created_at: '2026-08-19'
updated_at: '2026-08-19'
---
## Outcome

A contract megnevezheti azokat a specifikációs csomópontokat, amelyekre támaszkodik, és a Kotta
ezt a hivatkozást ellenőrzi, nem csak tárolja. A hivatkozás egyetlen irányba mutat: a contract
fejlécében él, a spec-node oldalán nincs olyan mező, amibe contract kerülhetne. Ez nem betartandó
szabály, hanem szerkezet — a spec nem tud a contractokra hivatkozni, mert nincs hova.

A hivatkozás két helyen válik hatásossá. A `contract validate` feloldja a megnevezett
azonosítókat a `.kotta/spec/` alatt, és ismeretlenre megtagadja az érvényesítést; a `contract
brief` pedig beemeli a hivatkozott csomópontok szövegét, mert a végrehajtó agent a 8. szabály
szerint kizárólag a briefből dolgozik. Ettől kezdve a specifikáció ténylegesen irányítja a
végrehajtást, nem csak kíséri.

Ezzel egy időben a `kotta validate` a spec-csomópontokat a saját formájuk ellen méri. A séma már
létezik a forma-regiszterben — `required_fields`, `required_edges`, `minimum` —, ma azonban egy
skill van megkérve rá prózában, hogy legyen alapos, és a skill kimondja magáról, hogy semmit nem
gátol. A gépies rész a validátorba kerül.

## Scenarios

- **S1 — contract spec-alapon.** Az agent egy meglévő use case-re és üzleti szabályra alapoz egy
  contractot; felveszi az azonosítóikat, és a `contract validate` igazolja, hogy léteznek.
- **S2 — elgépelt vagy törölt hivatkozás.** A contract olyan azonosítót nevez meg, ami nincs a
  `.kotta/spec/` alatt; a validálás konkrét hibával megtagadja, és megnevezi a nem feloldható idt.
- **S3 — végrehajtás a specből.** A `contract brief` tartalmazza a hivatkozott csomópontok
  szövegét, így a friss kontextusú végrehajtó látja őket anélkül, hogy a scope-ján kívülre kellene
  olvasnia.
- **S4 — hivatkozás nélküli contract.** A mező üresen hagyható; a legtöbb munka nem spec-alapú, és
  a hiánya nem hiba.
- **S5 — hibás spec-csomópont.** Egy node-ból hiányzik egy kötelező mező vagy egy kötelező él;
  `kotta validate` megnevezi a fájlt, a formát és a hiányzó követelményt.
- **S6 — projekt-saját forma.** Egy projekt által felvett forma pontosan úgy vesz részt az
  ellenőrzésben, mint a tizenegy szállított; a validátor a regiszterből dolgozik, nem beégetett
  ismeretből.
- **S7 — az irány.** A spec-csomópontok sémája nem kap contract-hivatkozó mezőt, és a validátor
  nem is fogad el ilyet.

## Scope

1. A contract fejléce új, opcionális `spec` mezőt kap: specifikációs csomópont-azonosítók listája.
   A `depends_on` és `blocks` mellé kerül, ugyanabban a stílusban.
2. A `contract validate` minden megnevezett azonosítót felold a `.kotta/spec/` alatt, a
   forma-regiszter `directory` és `identity` értékei alapján; feloldhatatlan azonosítóra megtagadja
   az érvényesítést, és megnevezi, melyik idt nem találta.
3. A `contract brief` a hivatkozott csomópontok tartalmát beemeli a briefbe, egyértelműen elválasztva
   a contract saját szövegétől.
4. A `kotta validate` a spec-csomópontokat a formájuk ellen ellenőrzi: `required_fields.frontmatter`,
   `required_fields.body_headings`, valamint a `required_edges` iránya, mezői, cél-formái és
   `minimum` értéke. A regiszter az egyetlen forrása a forma-specifikus tudásnak.
5. A `requirements-traceability` skill elhagyja azt a gépies ellenőrzést, amit a validátor átvesz,
   és a megmaradó elemző-riportoló szerepére szűkül; a viselkedése egyebekben nem változik.
6. Regressziós lefedettség mind a hét scenarióra, projekt-saját formával is.

## Non-goals

- Bármilyen spec-felület a `kotta status`-ban vagy a boardon. Ez később külön munka lesz.
- Számított visszahivatkozás („mely contractok támaszkodnak erre a csomópontra") bármelyik felületen.
- Mező a spec-csomóponton, ami contractra mutat, bármilyen néven.
- CLI vagy MCP CRUD a spec-csomópontokhoz.
- A tizenegy szállított forma, a kilenc workshop-skill vagy a spec/process névtérhatár módosítása.
- A `spec` mező kötelezővé tétele bármelyik lifecycle-lépésnél.

## Acceptance

- **A1** A contract fejléce elfogad egy `spec` listát, üresen hagyható, és a lifecycle minden lépése
  változatlanul működik vele és nélküle.
- **A2** `contract validate` feloldható azonosítókra átmegy, feloldhatatlanra megtagadja, és a
  hibaüzenet megnevezi a nem talált azonosítót.
- **A3** `contract brief` tartalmazza minden hivatkozott csomópont szövegét, a contract saját
  szövegétől elkülönítve.
- **A4** `kotta validate` megnevezi a hiányzó kötelező frontmatter-mezőt, a hiányzó kötelező
  body-headinget és a `minimum` alatt maradó kötelező élt, fájllal és formával együtt.
- **A5** Egy projekt által felvett forma ugyanúgy részt vesz A4-ben, kód- és skill-változtatás nélkül.
- **A6** A spec-csomópont sémája nem fogad el contractra mutató mezőt.
- **A7** A `requirements-traceability` a validátorral nem mond ellent: amit a validátor megtagad, azt
  a skill sem jelenti rendben lévőnek.
- **A8** `npm test`, `npm run typecheck`, `npm run build`, `git diff --check` és `kotta validate` zöld.

## Verification

- Friss ideiglenes repository: `kotta init`, spec-csomópontok írása, contract spec-hivatkozással,
  teljes lifecycle a hivatkozás megtartásával.
- Feloldhatatlan azonosító, üres lista és hiányzó mező esete a `contract validate`-en.
- Brief-snapshot a hivatkozott csomópontok szövegével.
- Hibás node-ok mátrixa: hiányzó frontmatter-mező, hiányzó body-heading, `minimum` alatti él,
  rossz irányú él, ismeretlen cél-forma.
- Projekt-saját forma és csomópont ugyanezen a mátrixon.
- `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`, `kotta validate`.

## Constraints

- A hivatkozás iránya szerkezeti: a spec-csomópont sémája nem bővül contract-hivatkozó mezővel.
- A validátor forma-specifikus tudást kizárólag a regiszterből vesz; beégetett formaismeret nem
  kerül a kódba.
- A `spec` mező opcionális marad; hiánya soha nem gátol lifecycle-lépést.
- A szállított agent-, skill-, dokumentáció- és hibaüzenet-szöveg angol marad.

## Open decisions

None.

## Execution notes

Az irányszabály a felhasználó 2026-08-19-i döntése: a spec nem hivatkozhat a szerződésekre, csak
fordítva. A spec saját felülete ugyanekkor kifejezetten későbbre halasztva, ezért non-goal.
