# A fejlesztés az archive előtt jön

## Why

A health-ai projektben az ügynök a kapu előtt felajánlotta: az igen után a `kotta approve` rögzíti,
„és utána a `kotta archive` felviszi az elfogadott modellbe". A change 32 eleméből hat story-hoz
még egy sor kód sem volt. Az operátor erre, 2026-10-01 17:34 UTC:

> archive nem a fejleszés után kell? miért ajánlottad fel?
> szerintem ha approve, akkor van egy change
> ha archive-olom, akkor mit fejlestünk?

Az ügynök nem tévedett: azt mondta, amit a Kotta előír. A `plan-change` skill szerint „The natural
order is plan → gate → archive → implement, so the code keeps accepted nodes and cites their ids",
a kiadott szabályfájl szerint „Code usually comes last", és az elfogadott modell *Every accepted
promise is kept or admitted* szabálya is ezt a sorrendet nevezi a projekt saját tanácsának. A
sorrendet a 2026-09-28-i „A kód a kapu után jön" change hozta, amely eredetileg tiltani akarta a
jóváhagyás és archive előtti kódot; a tiltásból a kapunál jelzés lett (*Say when the code runs ahead
of the spec*), a sorrend viszont a skillben és a szabályfájlban maradt.

Három baj van vele:

1. **Az indoka nem áll meg.** Az azonosító a `kotta spec new`-nál születik, a change-ben; a kód
   archive nélkül is hivatkozhat rá.
2. **Archive után nincs „ez a change".** A change az archívumba kerül, mielőtt bármi megépült volna
   belőle. A megépítetlen ígéretei `unimplemented` beismeréssel a `kotta gap` általános listájába
   olvadnak, és a beismeréseket csak azért kell megírni, hogy az archive átmenjen.
3. **A másik sorrendhez nincs mérés.** A `kotta gap` csak a bázis ágon elfogadott modellt olvassa.
   Amíg a change nyitva van, a jelentés semmit nem mond róla: a health-ai-ban két nyitott change
   127 eleme mellett `bound 0 · cited 0 · none 0`.

Az operátor a javaslatra — a természetes sorrend legyen jóváhagyás → fejlesztés → archive, és a
`kotta gap` mérje a jóváhagyott, nyitott change elemeit — ezt mondta, 2026-10-01 17:46 UTC:
„mehet a change", és: „a gap tulajdonképpen kód -> change, ugye?"

## What changes

- **Új szabály: *A change is built before it is archived*.** A jóváhagyott change nyitva marad,
  amíg a kód megépül; a `kotta archive` zárja le. A kiadott szabályfájl és a `plan-change` skill a
  plan → gate → implement → archive sorrendet nevezi meg, és az ügynök az igen rögzítése után a
  munkát ajánlja fel, nem az archive-ot. A sorrend tanács, nem korlát: a *Say when the code runs
  ahead of the spec* szabály változatlanul áll.
- **A `kotta gap` a kódot a change-hez is méri.** A jóváhagyott, nyitott change deltájának elemeiről
  megmondja, melyiket nem nevezi még kód, teszt vagy parancsdefiníció: ez a change hátralévő
  munkája. Az elfogadott modell ígéreteitől külön számolja, és nem utasít el miattuk. Ehhez
  módosul a *Analyze the implementation gap* use case és a *Every accepted promise is kept or
  admitted* szabály; az utóbbiból kikerül az a félmondat, amely az archive-előbb sorrendet a projekt
  saját tanácsának nevezi.
- **Nyitott change eleméhez nem kell beismerés.** `unimplemented` beismerést csak arról kell írni,
  ami az archive pillanatában sincs megépítve.
- **Két új példa**: az igen utáni felajánlás, és a nyitott change mérése.

Ami marad: az egy kapu (`kotta approve`) és amit megtagad; az, hogy a jóváhagyás utáni
delta-módosítás érvényteleníti a jóváhagyást; az, hogy a specifikáció másolata — a change `model/`
könyvtára is — nem bizonyíték (*An archived change cites nothing*).

A modellen kívül: `src/commands/gap.ts` és `src/commands/archive.ts`; a sorrendet kimondó négy hely,
hogy a már így szóló `docs/getting-started.md`-hez igazodjanak: `skills/plan-change/SKILL.md`,
`templates/AGENTS.md` (és a belőle generált `.kotta/AGENTS.md`), `site/index.html` négy lépése,
`docs/concepts.md`; továbbá `docs/cli.md` és `docs/planning-phase.md` az új kapcsolóval és az
archive megtagadásával.

## Open decisions

- Hogyan kérdezzük meg a nyitott change-et a `kotta gap`-től: magától mutatja, vagy név szerint kell
  kérni. (A *Analyze the implementation gap* use case-ben.)
- Melyik állapotot olvassa a mérés egy nyitott change-nél: az épp kivett ágat, vagy csak a bázis
  ágat. (Ugyanott.)
- Megtagadja-e az `archive` a lezárást, ha a change egy ígérete sincs megépítve, se beismerve.
  (A *A change is built before it is archived* szabályban.)
