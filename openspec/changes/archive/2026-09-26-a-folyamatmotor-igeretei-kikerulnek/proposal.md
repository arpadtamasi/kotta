# A folyamatmotor ígéretei kikerülnek a modellből

## Why

Az 1.0.0-alpha.1 kiadás levette a 0.x folyamatmotort: a `task`, `batch`, `observation`,
`decision`, `claim`, `status` és `sweep` parancsokat, minden `--approve` kaput és a
jóváhagyási nyugtákat, a végrehajtó motort, az MCP író- és jóváhagyó eszközeit (`approval_request`
és társai), és a mögöttük álló modulokat, köztük a `core/operations` műveletdeklarációt
(CHANGELOG, *Removed — BREAKING*). Az ezeket ígérő node-ok viszont elfogadva maradtak a
`.kotta/spec/` alatt. A `kotta gap` ezért ebben a repóban nem nullával zár: huszonnégy elfogadott
ígéretnek nincs bizonyítéka és nincs beismerése. Egy részük olyan viselkedést ígér, amelyet
egyetlen szállított parancs sem tud betartani. Ezeket sem „unimplemented” beismeréssel, sem egy
kommentbe írt azonosítóval nem lehet elszámolni úgy, hogy a jelentés igazat mondjon: az ígéret
nem megépítetlen, hanem megszűnt. Egy megszűnt megállapodás change-dzsel távozik, nem kézi
törléssel.

## What Changes

- **Kikerül 17 node**, mert csak a levett folyamatmotor viselkedését ígéri (`model/REMOVED.md`):
  - *One operation, one declaration* — a műveletdeklaráció (`core/operations`) a folyamatmodulokkal
    együtt kikerült; a CLI és a csak olvasó MCP-eszközök külön regisztrálódnak.
  - *A surface name without a declaration fails the build* — a fenti deklaráció példája.
  - *Task lifecycle* — minden átmenete egy levett `kotta task` parancs.
  - *A captured task is drafted in place* — a `kotta task define --draft` nincs többé.
  - *A declared check is run, not transcribed* — a review-beadás és bizonyítéktáblája kikerült.
  - *A failing declared check refuses the review* — a fenti szabály példája a `kotta task review`-n.
  - *A disposition asks what the specification should have said* — observation és diszpozíció nincs.
  - *A remedy that adds a capability amends the specification* — a diszpozíciós szabály példája.
  - *Disposition* — az observation-triázs kimenetének neve; a triázs nincs többé.
  - *Observation lifecycle* — a `kotta observation` kikerült.
  - *An approval carries only the payload its action needs* — az `approval_request` és akciói kikerültek.
  - *A retirement without its supersession never reaches the human* — a task cancel és jóváhagyási kérése kikerült.
  - *An approval is decided once, and its outcome is durable* — a jóváhagyási fázisok (applied,
    rejected, cancelled, failed) a levett jóváhagyási kérésekhez tartoztak.
  - *A yes that could not be applied is recorded as a failure, not a transition* — a fenti fázisok
    példája, task close-on.
  - *One entity carries one undecided approval* — entitásokon függő jóváhagyási kérés nincs többé.
  - *A second question about the same task is refused* — a fenti szabály példája, taskon.
  - *Retired work is not shown as delivered* — task-rezolúció és batch-jelentés nincs többé.
- **Átfogalmazódik 3 node** ugyanazon az azonosítón, mert az ígéretük megmaradt, csak a 0.x
  parancsokon mondták ki:
  - *Consequential transitions are human gates* — a 0.x kapuk felsorolása helyett az egyetlen
    kapu: a change a tervezés végén kimondott emberi igenre száll le, a nyugta (ki, mikor, milyen
    alapon — a delta ujjlenyomata) a change mellett van, és az archiválás mást nem tesz le.
    Betartja: `kotta approve`, `kotta archive`, `src/core/approval-receipt.ts`.
  - *An approval leaves a receipt* — task close helyett a change jóváhagyása és `approval.yaml`.
  - *An unanswered question refuses defining by name* → *An unanswered question refuses the
    approval by name* — a task definiálása helyett a `kotta approve` nevezi meg a nyitott
    kérdéseket. Az *An open question names the answer it waits for* szabály így megtartja a példáját.
- **Új szabály**: az elfogadott modell csak olyat ígér, amit egy szállított parancs megtesz vagy
  meg fog tenni; egy kiadás által levett viselkedés ígéretei change-dzsel távoznak, nem maradnak
  beismert résként, és nem törlődnek kézzel.

## Capabilities

### New Capabilities
- `technical-model`: mit ígérhet az elfogadott modell, és hogyan távozik belőle egy megszűnt ígéret.

## Impact

- `.kotta/spec/`: 17 node törlődik, 3 módosul, 2 új az archiváláskor. Egyetlen megmaradó node sem
  hivatkozik a törlendőkre (a `plan` összevont nézete validál).
- A `kotta gap` az archiválás után ezekre a node-okra nem panaszkodik; a három átfogalmazott node
  azonosítóját a kód és a tesztek már most megnevezik.
- Kívül esik: a többi, beismeréssel (`accepted:`) elszámolt 0.x node — use case-ek, a batch
  életciklusa, a Task és Observation entitás és társaik — a modellben marad. Az új szabály szerint
  nekik is change-dzsel kell távozniuk vagy átfogalmazódniuk; ez külön change.
- Kód: nincs viselkedésváltozás.
