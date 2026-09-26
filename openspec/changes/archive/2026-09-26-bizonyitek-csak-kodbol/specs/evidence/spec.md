## MODIFIED Requirements

### Requirement: Minden elfogadott ígéretről látszik, megépült-e
<!-- kotta: BR-01m0qtshfqhcrrqtz051zm9svr -->
A jelentés SHALL minden elfogadott node-ról megmondani, van-e rá bizonyíték a kódban, és SHALL
megkülönböztetni a modul-szintű és a teszt-szintű kötést. Bizonyíték SHALL csak olyan fájl
lehet, amely az ígéretet betartja vagy ellenőrzi — kód, teszt, parancsdefiníció —; a
specifikáció és annak bármely másolata SHALL NOT bizonyítéknak számítani.

#### Scenario: Ígéret bizonyíték nélkül
- **WHEN** egy elfogadott szabályra semmi nem hivatkozik a kódban
- **THEN** a jelentés bizonyíték nélküliként sorolja fel, és nem nulla kóddal zár

#### Scenario: Az azonosító csak a specifikáció másolatában szerepel
- **WHEN** egy elfogadott node azonosítója csak az `openspec/` fa alatt szerepel — archivált
  change `model/` könyvtárában, `approval.yaml`-ben vagy generált `openspec/specs/**/spec.md`
  kötésében — és a kód nem nevezi meg
- **THEN** a node szintje `none`, és a jelentés a kizárt forrásokat megnevezi

## ADDED Requirements

### Requirement: A specifikáció másolata nem bizonyíték
<!-- kotta: BR-01m3cqmt9yrasdj92kky1kcx0n -->
A bizonyíték-szűrő SHALL kizárni minden azonosító-keresésből a `.kotta/` workspace-t, a repó
gyökerében álló `openspec/` fát — a change-eket, az archívumot és a generált narratív specet —,
a csomagok kiadott `kotta-spec/` mappáit és a `node_modules/` alatti fájlokat. A `kotta gap` és a
modul-levezetés SHALL ugyanezt az egy szűrőt használni, hogy egy node modulja sose a specifikáció
másolatának helyéből adódjon; a nem commitolt útvonalak ajánlása is ezen a szűrőn megy át. Kizárt
forrásban lévő fájl SHALL NOT tesztnek számítani attól, hogy útvonalában `specs/` szerepel. A
kizárás MUST a Kotta által ismert spec-forrásokat nevezze, nem könyvtárnév-mintát: a projekt saját
`specs/` könyvtára továbbra is teszt, és egy csomag gyökér alatti saját `openspec/` fája nincs
kizárva.

#### Scenario: Archivált change a repóban
- **WHEN** egy change archiválása után a `model/` másolat és az `approval.yaml` az
  `openspec/changes/archive/` alatt commitolva van
- **THEN** a `gap` és a `modules` jelentés egyetlen node-ot sem sorol be ezek alapján

#### Scenario: Generált narratív spec
- **WHEN** az `openspec/specs/<capability>/spec.md` egy követelmény alatt `<!-- kotta: ID -->`
  kötést hordoz
- **THEN** a kötés nem `cited` és nem `bound` szintű bizonyíték, és a generált fájl nem számít
  tesztfájlnak attól, hogy útvonalában `specs/` szerepel

### Requirement: A jelentés kimondja, mit nem számolt
<!-- kotta: BR-01m3cqmtfyrpdzcppvy0565652 -->
A `kotta gap` és a `kotta modules` SHALL megnevezni a bizonyítékból kizárt forrásokat
útvonal-osztály szerint. Hat osztály van: `workspace` (`.kotta/`), `openspec-change`,
`openspec-archive`, `openspec-spec`, `published-spec` (egy csomag `kotta-spec/`-je) és
`dependency` (`node_modules/`). Minden `none` szintű node mellett a jelentés SHALL kimondani,
melyik kizárt osztály említi, és a jelentés feje SHALL egyszer összesíteni a kizárásokat; minden
osztályra, a `published-spec`-re is, ugyanez a szabály. A `--json` kimenetben ez SHALL az
`excluded` mező legyen; az ember-olvasható kimenet SHALL egy összesítő sorban nevezni meg a
kizárásokat.

#### Scenario: Node csak kizárt helyen említve
- **WHEN** egy node azonosítója egy kizárt forrásban szerepel, és máshol nem
- **THEN** a node `none` szintű, és a jelentés a node mellett megnevezi, melyik kizárt
  forrás-osztály említi
