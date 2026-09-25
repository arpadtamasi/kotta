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
A bizonyíték-szűrő SHALL kizárni a `.kotta/` workspace-t, az `openspec/` fát, a csomagok kiadott
`kotta-spec/` mappáit és a `node_modules/` alatti fájlokat. Ugyanezt a szűrőt SHALL használni a
modul-levezetés is, hogy egy node modulja ne a specifikáció másolatának helyéből adódjon.

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
A `gap` és a `modules` jelentés `--json` kimenete SHALL megnevezni a bizonyítékból kizárt
forrásokat (útvonal-osztályok szerint), hogy egy `none` szintű node oka a jelentésből olvasható
legyen.

#### Scenario: Node csak kizárt helyen említve
- **WHEN** egy node azonosítója egy kizárt forrásban szerepel, és máshol nem
- **THEN** a node `none` szintű, és a jelentés a node mellett megnevezi, melyik kizárt
  forrás-osztály említi
