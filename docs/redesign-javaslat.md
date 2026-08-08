# Kotta fejlesztési javaslat
## Shape: közös modell az ember és a coding agent között

**Státusz:** javaslat  
**Cél:** a Kotta kiterjesztése a contract előtti problématérre: a beszélgetésekből származó intent, döntések, terminológia és bizonytalanságok explicit kezelésére.

**Evidencia:** a javaslat az AI-t használó fejlesztők problémáiból indult ki, nem kódvizsgálatból. Kétféle bizonyíték támasztja alá, és a kettő nem ugyanoda mutat — lásd az *Evidencia* szakaszt közvetlenül alább. A §13 és §14 korábbi, kódra vonatkozó állításai a visszamérés során dőltek meg; a §13 helyére döntés került (§13.1), a §14 tévedésként javítva.

---

## Evidencia

### Külső — publikált kutatás

| forrás | találat | mit támaszt alá |
|---|---|---|
| **65 fejlesztős survey + literature review (2026)** | az AI erős a boilerplate-ben, implementációban, dokumentációban; **gyenge a planningben és a requirements analysisben**. Az érték a specification quality, architectural reasoning és oversight felé tolódik. | a javaslat magját (§1): a hibák a contract előtt történnek. **És egyben a Shape kockázatát is** (§18). |
| **„Professional Software Developers Don't Vibe, They Control” (2025)** — 13 fő terepmegfigyelés, 99 fős survey | a tapasztalt fejlesztők megtartják a design- és implementációs döntéseket, tudatos stratégiákkal korlátozzák az agentet; a hagyományos SE best practice-ek kulcsfontosságúak maradnak. | §5 (explicit delegáció) és **P0** (a Kotta metszetet kodifikál). |
| **METR randomizált vizsgálat (2025)** — 16 tapasztalt fejlesztő, 246 valódi task, átlagosan 5 éve ismert repókban | előzetesen +24 %, utólag +20 % gyorsulást **éreztek**; a mérés szerint **19 %-kal lassabbak** lettek. | **nem a Shape-et, hanem az oversightot**: az önbevallott értékelés nem megbízható. Lásd §2.3 evidence-mérését. |
| **„Prompt smells” taxonómia (IEEE, 2026)** | a prompt homályossága és hiányossága mérhetően rontja az outputot. | §6 (kérdezési szabály) — bár egy szinttel lejjebb: a promptról szól, nem a közös modellről. |

A METR-találat külön figyelmet érdemel, mert az egyetlen, amely **a javaslat ellen is szól**. Ha egy tapasztalt fejlesztő 39 százalékpontot téved a saját teljesítménye megítélésében, akkor minden olyan réteg gyanús, amelynek a hasznát önbevallás igazolja — beleértve a Shape-et is. Ebből következik a §5.3 metrika-váltása.

### Belső — a Kotta és a szomszédos oneanda workspace

A §2 minden állítása mögött mért adat áll ebből a két repóból: fájlhelyek, sorszámok, parancshívás-számok, take-korpusz. A hivatkozások a szövegben helyben szerepelnek.

**Amit ez az evidencia nem fed le:** a javaslat egyetlen felhasználón és egy szomszédos projekten van visszamérve. Az `n=1` korlát minden „ez általános” típusú állításra érvényes, és a P0 próbája (odaadni egy tapasztalt fejlesztőnek) még nem futott le.

---

## 1. Kiinduló helyzet

A Kotta jelenleg erős kontrollréteget ad a már definiált fejlesztési munka végrehajtásához:

```text
human intent
    ↓
contract
    ↓
batch
    ↓
claim / worktree
    ↓
execution
    ↓
evidence
    ↓
acceptance
```

A jelenlegi modell fő erősségei:

- repository-native canonical state;
- explicit executable contract;
- backlog → defined → active → review → done lifecycle;
- bounded execution;
- agentenként külön claim / branch / worktree;
- acceptance-to-evidence mapping;
- explicit human approval;
- durable decisions;
- read-only board / külön mutation surface;
- Git-alapú izoláció és ellenőrizhető végrehajtás.

A probléma az, hogy a legfontosabb hibák jelentős része **már a contract létrejötte előtt** megtörténik.

A user elmondja, mit szeretne. Az agent megpróbálja értelmezni. A hiányzó részeket kitölti, neveket talál ki, modelleket vezet be, trade-offokat választ. Mire elkészül a contract, lehet, hogy már egy olyan rendszer van formalizálva, amely nem pontosan az, amit a user akart.

A javasolt átalakítás ezért nem a jelenlegi execution-control réteg lecserélése, hanem egy új réteg hozzáadása elé.

---

## 1b. A vezérelv

Kézenfekvő lenne ebből azt a következtetést levonni, hogy **jobb tervet kell csináltatni az AI-val** a végrehajtás előtt. Ez a javaslat nem ezt mondja, és fontos, hogy miért nem.

Egy 2026-os, 65 fejlesztős vizsgálat szerint az AI épp a **planningben és a requirements analysisben** a leggyengébb — miközben a boilerplate-ben, az implementációban és a dokumentációban erős. Aki tehát a contract előtti fázist arra bízza, hogy az agent majd jobban tervez, az az AI leggyengébb képességére épít.

A vezérelv ezért nem a jobb terv:

> **A Kotta nem azt próbálja elérni, hogy az AI jól tervezzen.**
> **Azt éri el, hogy az AI félreértése olcsón kiderüljön és olcsón javítható legyen.**

Ez két különböző rendszert jelent.

A „jobb terv” rendszere teljességre optimalizál: minél hiánytalanabb a modell a végrehajtás előtt, annál jobb. Ez waterfall, és a Kotta mai keretezése már ma is efelé hajlik.

A „vedd észre és javítsd” rendszere két másik dologra optimalizál:

| | kérdés | ma |
|---|---|---|
| **Észrevehetőség** | mennyi idő alatt derül ki, hogy az agent mást ért? | mérhetetlen |
| **Javíthatóság** | hány lépés visszatéríteni? | mérhetetlen |

Ebből következik, hogy mi számít jó felületnek. Egy felület akkor jó, ha **az eltérés látszik rajta** — nem akkor, ha teljes. Egy szótár nem azért kell, hogy leírja a domént, hanem azért, hogy amikor az agent más szót használ, az **feltűnjön**. Egy döntés-hézag nem azért kell, hogy előre kitöltsük, hanem azért, hogy amikor az agent csendben döntött, az **kiderüljön**.

A továbbiakban minden javaslatot ehhez kell mérni: **korábban derül-e ki egy félreértés, és olcsóbb-e visszafordítani.** Ami csak a modell teljességét növeli, az nem tartozik ide.

---

## 2. A központi problémák

### 2.1. Kimondatlan döntések

A user gyakran pontosan tudja, milyen problémát akar megoldani, de nem fogalmaz meg minden product-, UX- vagy architecture-döntést.

Példa:

> Kellene a gyakorláshoz beginner / intermediate / advanced út, és a mérés alapján mondja meg, mi legyen a következő.

Ebből legalább két nagyon különböző rendszer következhet:

1. előre definiált progression van, a mérés csak unlockolja a következő lépést;
2. az AI minden alkalommal szabadon választ gyakorlatot.

Ha ezt nem tisztázzuk, a coding agent kénytelen választani.

A probléma nem egyszerűen az, hogy „hiányos a spec”, hanem az, hogy:

> **a coding agent olyan döntést hoz meg, amelyről a user nem feltétlenül tudja, hogy döntés volt.**

---

### 2.2. Terminológiai drift

A másik tipikus probléma, hogy az agent olyan terminológiát kezd használni, amelyet a user nem használ vagy nem ért.

Példa — egy fogalom, öt felület, négy válasz. „Hogyan nevezünk meg egy entitást embernek?”, a Kotta saját kódjában:

```text
core (src/core/identity.ts:76):
displayId()  →  "T-a3f9c1d2"

lemezformátum (entityFilename, :85):
"slug-a3f9c1d2.md"

board (ui/src/App.tsx:67):
displayId újraimplementálva, a core-ból nem importálva

CLI:
"T-01kz3kx1ex19tjw82tbd1366pk"

skillek:
—  (a "displayId" és a "shortId" egyszer sem fordul elő a skills/ alatt)
```

A tervezés egyszer már kimondta a választ: a `displayId()` kommentje szerint az emberi forma a rövid hash, az `entityFilename()` szerint a lemezforma slug + hash. A `displayId()`-nek mégis **nulla hívója van a `src/` alatt** — mind a 12 hívás a boardon él, amely ráadásul újra is implementálta a függvényt. A két felület már el is csúszott egymástól.

Néhány iteráció után ugyanaz a fogalom több néven él. És ha a nevek nem csak megjelenítést vezérelnek, a drift kemény törésbe fordul:

```text
CLI  (src/commands/observation.ts:66):        attach-existing
séma (schemas/observation.schema.json:16):    attach-to-existing-contract
README:                                       egyik sem
```

A `kotta observation resolve <id> --disposition attach-existing --approve` sikerrel lefut, és olyan frontmattert ír, amelyre a publikált séma nem illik; a sémában dokumentált értéket viszont a CLI `Unknown disposition` hibával utasítja el. A helyes érték sehol nincs kimondva.

Ennek következménye:

- a contract nehezebben olvasható;
- a usernek folyamatosan vissza kell fejtenie az agent nyelvét;
- a dokumentáció és a kód eltérő fogalmi modelleket használhat;
- az agent maga is azt hiheti, hogy két külön fogalomról van szó;
- idővel a terminológiai drift domain-model driftet okozhat.

A probléma ezért nem pusztán copywriting:

> **az agent olyan fogalmat nevez el, amelyről a user nem feltétlenül tudja, hogy új fogalomként lett bevezetve.**

**Ez nem hipotetikus.** Mindkét fenti eset a Kottában történt meg — abban a rendszerben, amelyet részben épp a drift ellen építünk, ráadásul egy *explicit szótármigráció közben*. A migráció maga sem zárult le: a `.a-team` könyvtárnév és a `migration.json` régi szavai (`tickets`, `findings`, `packages`) szándékos átmenetként maradtak bent, de **egyetlen döntés sem mondja meg, mikor tűnnek el**. Aki ma rájuk keres, nem tudja eldönteni, hogy maradványt vagy érvényes fogalmat talált.

Ha egy szótármigrációt futtató, erre a problémára figyelő rendszer sem tudja megakadályozni a saját driftjét, akkor a drift nem fegyelem kérdése. Kontrollréteg kell hozzá (§7).

---

### 2.3. A kontrollréteg megkerülhetősége

Az előző két probléma hallgatólagosan feltételezi, hogy ha egyszer közös modellt építettünk, az meg is köti a végrehajtást. A mérés szerint ez ma nem áll.

Mérés az oneanda workspace-en, 2026-07-31 / 08-01, **minden kapu bekapcsolva** a `config.yaml`-ben (`require_human_ready_approval`, `require_human_done_approval`, `require_verification_for_ready`, `require_review_evidence_for_done`):

*A kontrollréteg nem elérhető ott, ahol a munka történik:*

- **831** parancs érintette a CLI-t, **5** skill-invokáció mellett. A lifecycle nyers CLI-ként futott (`ticket define` 47×, `ticket validate` 48×, `ticket close` 21×, `ticket start` 20×) — vagyis az a három skill, amelyben az evidence-fegyelem lakik, gyakorlatilag soha nem futott le. A rendszer szállítja a procedúrát, de az a gyakorlatban opcionális.
- **12** `command not found: a-team`: a bináris gyakran nincs a PATH-on épp azokon a helyeken, ahova a rendszer maga küldi az agenst (worktree, subshell). Az operátornak abszolút útvonalat kellett a promptba másolnia.
- **22** `--help` hívás: az agens menet közben tapogatja a parancsfelületet.

*Ezért a kapuk megkerülhetők:*

- Állapotátmenet fájlmozgatásként: `git mv .a-team/done/O-120-….md .a-team/review/`, `mv` fallbackkel. Az állapot az a könyvtár, amelyben a fájl áll — a kapu csak azokon az átmeneteken fut le, amelyeket a CLI végez.
- A `validate` utólag `MISSING_REVIEW_EVIDENCE`-t jelentett **már `done/`-ban álló** ticketekre: azok nem mehettek át a záró kapun. Egy lezárt ticketből a saját `discovery` profiljának **hat** kötelező szakasza hiányzott. Soha nem volt megformálva, és le van zárva.
- 22 közvetlen `Write`/`Edit` a `backlog/`-ba, és `rm -f`-fel törölt findingok disposition helyett.

*És ahol a kapu lefutott, ott is teljesíthető volt tartalom nélkül:*

- Ugyanaz a ~1000 szavas evidence-szöveg beillesztve **hét** külön evidence-sorba (T-071, T-074, T-075, T-076), négybe másik ötben. A séma nem üres cellát kér soronként; egy LLM mindig tud nem üres cellát előállítani.
- T-073-ban a `ui: visual_evidence_present` alá írt szöveg szó szerint azt mondja, hogy *„Vizualis evidence valos eszkozon nincs - ejszakai futas."* A check bizonyítéka kijelenti, hogy a check nem futott le — és a ticket átment.

A két jelenség ugyanarra a mechanizmusra fut ki: a fájl mozgatása a kézenfekvő művelet, amikor a CLI elutasít vagy nem elérhető. Ez nem rosszindulat, hanem a legkisebb ellenállás iránya.

> **a kontrollréteg csak ott köt, ahol elérhető, és ahol a kikényszerítés nem a jóindulaton múlik.**

Ez a probléma **megelőzi** az előző kettőt. Egy közös modell, amelyet egy `git mv` megkerül, csak névleg közös modell — és a Shape pontosan ugyanígy megkerülhető lesz, ha ugyanazon a tároláson és ugyanazon az elérési úton ül.

A javaslat többi része (§3–§12) a 2.1-re és a 2.2-re válaszol. A 2.3-ra nem válaszol; azt a §13 tárgyalja nyitott kérdésként.

---

## 3. Javasolt új Kotta-modell

A jelenlegi modell:

```text
intent
  ↓
contract
  ↓
batch
  ↓
execution
  ↓
evidence
  ↓
acceptance
```

A javasolt modell:

```text
messy conversation
        ↓
      SHAPE
        ↓
 ┌───────────────┐
 │ intent        │
 │ facts         │
 │ constraints   │
 │ decisions     │
 │ terminology   │
 │ provenance    │
 └───────────────┘
        ↓
 decision gaps
 terminology gaps
 semantic conflicts
        ↓
 own / delegate / clarify / name
        ↓
 shared model
        ↓
  0..N contracts
        ↓
      batches
        ↓
    execution
        ↓
     evidence
        ↓
    acceptance
```

A lényegi változás:

> **A contract ne a gondolkodási folyamat eleje legyen, hanem annak fordítási célpontja.**

---

# 4. Új first-class fogalom: Shape

## 4.1. Mi a Shape?

A Shape egy contract előtti, conversation-driven munkaterület.

Nem task.

Nem observation.

Nem backlog contract.

Nem spec-dokumentum.

A Shape egy **folyamatosan épülő közös modell arról, hogy mit ért az ember és az AI a problémán**.

Példa:

```text
S-01...
Guided practice

Goal
Facts
Constraints
Decisions
Delegations
Decision gaps
Terminology
Terminology gaps
Possible conflicts
Sources
Candidate contracts
```

Egy Shape eredménye lehet:

- 0 contract;
- 1 contract;
- több contract;
- 1 vagy több durable decision;
- új observation;
- egy batch-javaslat;
- vagy annak felismerése, hogy nincs szükség fejlesztésre.

Ezért fontos, hogy a Shape ne legyen automatikusan contract.

---

## 4.2. A Shape minimális adatszerkezete

Javasolt MVP-forma:

```yaml
id: S-...
title: Guided practice
status: shaping

sources:
  - type: conversation
    ref: E-...
  - type: file
    ref: src/...
  - type: decision
    ref: D-...

candidate_contracts: []
```

Markdown body:

```md
# Goal

...

# Facts

...

# Constraints

...

# Decisions

...

# Delegations

...

# Decision gaps

...

# Terminology

...

# Terminology gaps

...

# Possible semantic conflicts

...

# Candidate contracts

...
```

Nem szükséges minden fieldet canonicalizálni az első verzióban.

A fontos az, hogy a Shape:

- repository-native legyen;
- provenance-szel rendelkezzen;
- ne legyen végrehajtható;
- különüljön el a contract lifecycle-tól.

---

# 5. Decision gaps

## 5.1. Miért nem „spec completeness”?

Nem javasolt olyan score használata, mint:

```text
Specification completeness: 73%
```

Ez nehezen értelmezhető és könnyen válik álprecíz metrikává.

A sokkal relevánsabb kérdés:

> **Ha most elindulna a coding agent, milyen döntéseket kellene még saját maga meghoznia?**

Ez legyen a `decision gap`.

---

## 5.2. Három döntési állapot

Nem minden döntést kell az embernek meghoznia.

Egy senior fejlesztőt sem mikromenedzselünk.

Ezért minden felismert döntési pont kapjon egy státuszt:

### OWNED

Az ember explicit meghozta a döntést.

```text
✓ OWNED
Progression is deterministic.
```

### DELEGATED

Az ember tudatosan delegálta a döntést az agentnek, megfelelő korlátokkal.

```text
→ DELEGATED
Choose the local class structure following existing repository patterns.
```

### UNOWNED

Nem világos, ki hozza meg a döntést.

```text
! UNOWNED
What happens when performance regresses?
```

A lényegi szabály:

> **csak az UNOWNED döntés blokkolja a contract compile/sign folyamatot.**

Ez megakadályozza, hogy a Kotta bürokratikus kérdezőgéppé váljon.

---

## 5.3. A Kotta új fontos metrikája

Javasolt shaping metric:

```text
Unowned decisions: 3
```

Ennek jelentése:

> Ha most elkezdődne a végrehajtás, három olyan product/design/architecture döntés van, amelyet az implementáló agentnek kellene a user helyett meghoznia.

Ez sokkal informatívabb, mint egy általános readiness score.

**De ez nem az elsődleges metrika**, és fontos, hogy miért nem. Az unowned decisions szám azt méri, mennyire **teljes** a modell a végrehajtás előtt — vagyis pontosan azt a teljesség-optimalizálást, amit a §1b elvet.

A vezérelvből két másik metrika következik:

| | kérdés | mit mér |
|---|---|---|
| **Time-to-notice** | mennyi idő telik el a félreértés keletkezése és a felismerése között? | észrevehetőség |
| **Cost-to-correct** | hány lépés visszatéríteni, ha kiderült? | javíthatóság |

Ezek ma **mérhetetlenek** — a rendszer nem rögzíti sem azt, hogy mikor tért el az agent, sem azt, hogy hány lépésbe került visszahozni. Az első feladat tehát nem a javításuk, hanem az, hogy egyáltalán legyen róluk adat.

Az `unowned decisions` ehhez képest **másodlagos és feltételes**: akkor hasznos, ha egy döntés felszínre hozása olcsóbb, mint utólag észrevenni, hogy az agent már meghozta. Ahol nem az, ott a kérdezés adminisztráció.

---

# 6. A kérdezés szabálya

A Kotta ne interjúztassa a usert.

A jelenlegi `define-contract` filozófiáját érdemes általánosítani:

> **Investigate before asking.**

A Shape-agent először:

1. megnézi a releváns kódot;
2. elolvassa a dokumentációt;
3. megkeresi a kapcsolódó contractokat;
4. megkeresi a durable decisionöket;
5. megnézi a project vocabularyt;
6. csak ezután tesz fel kérdést.

Kérdést csak akkor érdemes feltenni, ha a válasz materially befolyásolja például:

- az observable behaviourt;
- egy durable invariánst;
- a product flow-t;
- az adatmodellt;
- architecture boundaryt;
- migrationt;
- securityt;
- external integrationt;
- acceptance-et;
- irreversible vagy drága trade-offot.

Nem kérdés:

> Milyen nevet adjunk ennek a helpernek?

Tipikus kérdés:

> A mérés egy előre definiált progression következő lépését oldja fel, vagy az AI szabadon választ következő gyakorlatot?

---

## 6.1. Döntési kérdések, nem általános pontosítások

Kerülendő:

> Pontosítsd, mit értesz „következő gyakorlat” alatt.

Jobb:

```text
A "következő gyakorlat" két materially eltérő rendszert jelenthet:

A — a mérés unlockolja az előre definiált következő lépést;
B — a recommendation engine szabadon választ egy gyakorlatot.

Ez befolyásolja a persistence-et, a tesztelhetőséget és az UX-et.

Melyiket szeretnéd?
```

A Shape-agent feladata nem az általános kérdezés, hanem a **döntési pontok felismerése és minimalizált felszínre hozása**.

---

# 7. Terminológia mint first-class kontrollréteg

## 7.1. Négy nyelvi szint

A rendszerben érdemes explicit különválasztani:

```text
HUMAN LANGUAGE
ahogy a user nevezi

DOMAIN LANGUAGE
a projekt elfogadott közös terminológiája

CODE LANGUAGE
identifier / class / API naming

KOTTA LANGUAGE
contract, batch, observation, shape stb.
```

Példa:

```text
Human:
"gyakorlási út"

Canonical domain term:
practice path

Code:
PracticePath
```

A cél nem az, hogy minden szónak egyetlen neve legyen, hanem hogy világos legyen:

- melyik ugyanannak a fogalomnak az aliasa;
- melyik valóban külön fogalom;
- melyik az elfogadott domain term;
- melyik csak implementációs név.

---

## 7.2. Project Vocabulary

Javasolt repository-native artifact:

```text
.kotta/vocabulary.md
```

MVP-példa:

```md
# Project vocabulary

## Practice path

Meaning:
The ordered set of exercises through which a user progresses.

Preferred term:
practice path

Human term:
gyakorlási út

Code:
PracticePath

Aliases understood:
- learning path
- progression path

Avoid:
- curriculum
- course
- program

Notes:
Progression inside a practice path may branch.
```

Nem cél ontology engine építése.

Egy egyszerű Markdown fájl elegendő első iterációban.

---

## 7.3. Terminológiai gap

A Shape-agent keresse azokat az eseteket, ahol:

- a user egy fogalmat máshogy nevez, mint a repo;
- több contract különböző szót használ ugyanarra;
- a code és a product language nincs összhangban;
- új fogalom került bevezetésre definíció nélkül;
- két azonosnak tűnő szó esetleg valójában külön domain entity.

Példa:

```text
TERMINOLOGY GAP

You said:
"next exercise"

Existing code says:
"recommendation"

An earlier contract says:
"suggestion"

These may refer to the same concept.

Suggested canonical term:
Next exercise recommendation

[Same concept]
[Different concepts]
[Use another term]
```

---

## 7.4. Agent writing rules

A Kotta generált szövegeire és agent briefjeire kerüljön be néhány explicit szabály:

1. **Prefer known project terms.**
2. **Do not silently introduce synonyms for known concepts.**
3. **Define a necessary new technical term the first time it appears.**
4. **If a new term changes the conceptual model, surface it before making it canonical.**
5. **Prefer the user's established vocabulary when technical precision does not require otherwise.**

Példa kerülendő szövegre:

> The orchestration layer hydrates the ephemeral execution context from canonical control-plane state.

Jobb:

> Kotta assembles the information the coding agent needs before it starts. Internally this is called the execution context.

Az elsődleges cél az olvashatóság, nem a technikai jargon maximalizálása.

---

# 8. Terminológiai drift mint modellezési kockázat

A vocabulary layer nem pusztán UX-feature.

Ha a rendszerben párhuzamosan jelenik meg:

```text
Exercise
Drill
Practice
Routine
Task
```

akkor két lehetőség van:

1. ezek ugyanannak a fogalomnak a szinonimái;
2. külön fogalmak, amelyek jelentése nincs tisztázva.

Mindkettő veszélyes lehet.

A terminológiai drift idővel adatmodell- és architecture-driftté válhat.

A Kotta ezért jelezhesse:

```text
Possible terminology/model conflict

"Exercise" and "Drill" are used interchangeably in 3 contracts,
but the code contains separate Exercise and Drill types.

This may be intentional or may indicate domain-model drift.
```

Ez ne automatikus „hiba” legyen, hanem reviewable jelzés.

---

# 9. Provenance

A Kotta egyik alapelve továbbra is az legyen:

> **The repository keeps the shared truth.**

Ehhez a Shape-model állításainak visszavezethetőnek kell lenniük a forrásukra.

Nem szükséges mondatonként knowledge graphot építeni.

MVP-ben elég a section-level vagy item-level provenance.

Példa:

```text
Decision:
Progression is deterministic.

Sources:
- human message E-291
- existing principle D-018
```

Contractban:

```text
WHY DOES THIS EXIST?

Outcome
← Shape S-123
← human message E-291

Constraint: do not change measurement semantics
← D-018

Acceptance: existing users retain history
← human message E-304
```

A provenance célja:

- ne kelljen az agent memóriájára hagyatkozni;
- vissza lehessen nézni, honnan jött egy döntés;
- később lehessen challenge-elni vagy supersede-elni;
- a coding agent deterministic briefje megbízható inputból készüljön.

---

# 10. Durable decisions átalakítása

A jelenlegi decision modell jó alap:

```text
Decision
Context
Consequences
```

Érdemes kiegészíteni opcionális scope és provenance mezőkkel.

Javasolt backward-compatible forma:

```yaml
id: D-...
title: Progression is deterministic
date: 2026-08-07

scope:
  type: shape
  id: S-...

sources:
  - type: event
    ref: E-...
  - type: file
    ref: src/...

supersedes: []
```

Lehetséges scope-ok:

```text
principle
shape
contract
batch
```

### Principle

Cross-cutting, projektszintű szabály.

Például:

```text
Identity uses ULIDs.
```

### Entity-scoped decision

Egy konkrét Shape / contract / batch kapcsán meghozott döntés.

Ez illeszkedik ahhoz a már megjelent Kotta-gondolathoz, hogy:

- global decision → principle;
- entity-scoped decision → az adott entity mellett jelenik meg.

---

# 11. Semantic conflict detection

A Kotta jelenlegi determinisztikus contradiction-modelljét meg kell őrizni.

Fontos különbség:

```text
DETERMINISTIC CONTRADICTION
```

nem ugyanaz, mint:

```text
POSSIBLE SEMANTIC CONFLICT
```

Példa determinisztikus contradictionre:

- contract state és Git/worktree state nem egyezik;
- dangling reference;
- két canonical artifact strukturálisan ellentmond egymásnak.

Példa semantic conflictra:

```text
Earlier decision:
"Users may freely choose exercises."

New conversation:
"The system always chooses the next exercise."
```

Az LLM itt ne mondja ki automatikusan, hogy contradiction.

Helyette:

```text
POSSIBLE INTENT CONFLICT

D-021
"Users may freely choose exercises."

E-488
"The system always chooses the next exercise."

These may conflict.

[Different contexts]
[Replace old decision]
[Clarify]
```

A semantic conflict hypothesis legyen reviewable, ne canonical truth.

---

# 12. Shape → Contract compile

Amikor:

- nincs blocking unowned decision;
- nincs blocking terminology gap;
- a semantic conflictok dispositioned állapotban vannak;
- a releváns provenance rendelkezésre áll;

akkor a Shape „compile-olható” contractokra.

Példa:

```text
S-123 Guided practice

Candidate work:

T-A Domain model
T-B Progression engine
T-C Practice path UI

Decisions:
D-X progression is deterministic
D-Y users may repeat previous exercises

Delegated:
- local class boundaries
- internal naming following existing conventions
```

A compile eredménye:

```text
Shape
  │
  ├── D-X
  ├── D-Y
  │
  ├── T-A
  ├── T-B
  └── T-C
```

A usernek látnia kell, hogy:

- mi lesz egy contract;
- mi lesz több contract;
- milyen durable döntések keletkeznek;
- mi marad delegált implementation freedom.

A compile után a jelenlegi Kotta lifecycle lép életbe.

---

# 13. A jelenlegi Kotta-rendszerrel való kapcsolat

A Shape a contract elé kerül, nem helyette. A meglévő lifecycle **alakja** jó, és marad:

```text
contract
  ↓
sign
  ↓
batch
  ↓
claim
  ↓
branch/worktree
  ↓
execute
  ↓
submit review
  ↓
evidence
  ↓
human acceptance
  ↓
close
```

Ez a sorrend nem szorul újratervezésre.

Nyitott kérdés viszont, hogy a lánc **kikényszerítése** elbírja-e a rá épülő réteget. A §2.3 mérése szerint ma nem: az állapot az a könyvtár, amelyben a fájl áll, tehát a kapu csak azokon az átmeneteken fut le, amelyeket a CLI végez — és a CLI épp ott nem elérhető, ahova a rendszer az agenst küldi. Ahol pedig lefut, ott az evidence-kapu mennyiségre teljesül, nem illeszkedésre.

## 13.1. A „kapu” két dolgot takar — és csak az egyik sürgős

A §2.3 mérése egy szó alatt két különböző hiányosságot mutatott. Külön kell venni őket, mert nem ugyanaz a válasz rájuk.

| | mit jelent | kinek kell |
|---|---|---|
| **Kikényszerítés** | a `git mv` ne működjön; az állapot ne a könyvtár legyen | **ellenséges vagy felügyelet nélküli** használónak |
| **Elérhetőség** | a parancs ott legyen, ahol a munka; a skillek fussanak le | **minden** használónak, az elsőtől kezdve |

**Döntés.** A Kottát ma egy operátor futtatja, aki meg akarja mutatni másoknak. Ebből következik:

> **A kikényszerítés non-goal, amíg a Kottát egy operátor üzemelteti.** Aki nem csal magával szándékosan, annak a kapu nem védelem, hanem ceremónia. Ez a döntés visszavonandó abban a pillanatban, amikor a rendszert olyan valaki üzemelteti, akit nem te felügyelsz.
>
> **Az elérhetőség viszont előfeltétel, és a Phase 1 elé kerül.** A §2.3 mérésének súlyos része nem a megkerülhetőség, hanem hogy **831 nyers CLI-hívás jutott 5 skill-invokációra**, tizenkét `command not found` mellett. Az a három skill, amelyben az evidence-fegyelem lakik, gyakorlatilag soha nem futott le. Ez nem elvi rés: ez az, hogy a rendszer által szállított eljárás a gyakorlatban opcionális.

A §13 korábbi állítása tehát így pontosítható. A meglévő execution modell **alakja** jó és marad. A **garanciáiból** a kikényszerítés tudatosan gyenge marad; az elérhetőség viszont hiányzik, és pótolni kell, mielőtt bármi ráépül.

---

# 14. A meglévő shaping-vonal generalizálása

Egy korábbi változat abból indult ki, hogy a repóban már létezik egy shaping-vonal — determinisztikus shape-plan, preview, plan hash, code-aware finding analysis, provenance, human correction, mutáció előtti review —, amelyet elég általánosítani.

Ez tévedés volt: ezek tervek és mockupok, nem implementáció. A `src/` alatt a `planHash` / `plan-hash` **nulla találat**; a `preview`, `provenance` és `cluster` kizárólag a `design/` HTML-mockupokban fordul elő; a `shape` hat előfordulása pedig mind *workspace shape*-et jelent — a migrációs sémaellenőrzést (`src/filesystem/workspace.ts:134`) —, aminek semmi köze az itt javasolt Shape-hez.

Ennek egy következménye van az ütemezésre: a Phase 4-nek (§19) **nincs mit átvezetnie**. Zöldmezős munka, nem migráció.

A fogalmi modell viszont ettől függetlenül érvényes, és ez a javaslat lényegi része:

### Korábbi mentális modell (szándék szintjén)

```text
findings
   ↓
cluster
   ↓
tickets
```

### Új általános modell

```text
SOURCES
├── conversation
├── observations
├── existing contracts
├── durable decisions
├── principles
├── vocabulary
└── repository evidence
        ↓
      SHAPE
        ↓
 ┌──────┼────────┐
 ↓      ↓        ↓
decisions contracts observations
         │
         ↓
       batch?
```

Egyetlen shaping engine legyen.

Ne külön:

- finding shaping;
- conversation shaping;
- backlog shaping.

Mindegyik ugyanabba a Shape-modellbe tápláljon.

---

# 15. UI / interaction modell

## 15.1. A board maradjon read-only

A meglévő Kotta-alapelv jó:

- a board canonical state projection;
- a mutáció és approval a calling chatben történik;
- a UI nem válik második, divergáló control surface-szé.

Ezt a Shape esetében is meg kell tartani.

---

## 15.2. A shaping fő interaction surface-e a chat

Példa:

```text
You:
Kellene login után onboarding.

Kotta:
Megnéztem a jelenlegi auth/profile flow-t.

A célt értem, de maradt egy product decision:

Az onboarding kötelező egyszeri flow legyen,
vagy bármikor átugorható és később folytatható?

Ez befolyásolja a persistence-et és az existing-user migrációt.
```

A user válaszol.

Kotta frissíti a Shape-modellt.

---

## 15.3. Shape a boardon

A boardon egy Shape például így jelenhet meg:

```text
SHAPING

Guided practice

Goal                 ✓
Facts                8
Owned decisions      4
Delegated decisions  2
Decision gaps        1   ← WAITING ON YOU

Vocabulary terms     7
Terminology gaps     2

Possible conflicts   1

Sources
12 chat messages
4 repository files
2 principles

Candidate contracts
not compiled
```

---

## 15.4. Home / Waiting on you

A jelenlegi `Waiting on you` modellbe természetesen bekerülhet:

```text
3 shaping decisions waiting
2 terminology clarifications
2 contracts in review
1 observation awaiting disposition
```

Fontos:

- a „defined contract” továbbra se legyen debt;
- csak valódi human gate kerüljön a waiting queue-ba.

---

# 16. Javasolt CLI / skill surface

MVP:

```text
/shape
```

Létrehoz vagy folytat egy Shape-et.

---

```text
kotta shape show <shape-id>
```

Megmutatja:

- goal;
- known facts;
- decisions;
- delegations;
- gaps;
- terminology;
- sources;
- candidate contracts.

---

```text
kotta shape gaps <shape-id>
```

Megmutatja kizárólag a blocking gapeket.

Példa:

```text
S-123 is NOT READY TO COMPILE

2 unowned decisions

HIGH
What determines advancement to the next exercise?

MEDIUM
What happens to existing users without progression state?

1 terminology gap

"practice path" and "learning track" may refer to the same concept.
```

---

```text
kotta shape compile <shape-id>
```

Read-only preview:

- durable decisions to create;
- contracts to create;
- batch proposal;
- provenance;
- delegated decisions.

Az apply továbbra is explicit human approvalhoz kötött.

---

# 17. Agent brief változása

A coding agent deterministic briefje ne csak contractot tartalmazzon.

Tartalmazza a releváns közös nyelvet és döntési határokat is.

Példa:

```md
## Outcome

...

## Relevant project terms

Practice path
The ordered progression of exercises.

Mastery
The condition that unlocks progression.

## Owned decisions

- Progression is deterministic.
- Users may repeat previous exercises.

## Delegated decisions

- Choose internal class boundaries following current domain conventions.
- Choose local helper names.

## Do not decide

None.

## Scope

...

## Acceptance

...

## Verification

...
```

Így a coding agent számára világos:

- mit kell csinálnia;
- milyen szavakat használjon;
- mi eldöntött;
- miben van szabadsága;
- miben nincs.

---

# 18. Non-goals

Az első verzióban nem cél:

- teljes ontology engine;
- automatikus knowledge graph;
- minden mondat canonical tárolása;
- LLM által generált „truth” automatikus elfogadása;
- minden technikai döntés human approvalhoz kötése;
- generic project management;
- generic chat history manager;
- új coding agent;
- saját IDE;
- Jira/Linear replacement;
- semantic conflict automatikus feloldása;
- új execution engine.

A Shape a jelenlegi Kotta elé kerül, nem helyette.

**Eldöntve (§13.1):** a **kapuk kikényszerítése** is non-goal, amíg a Kottát egy operátor üzemelteti — vagyis a Shape sem lesz erősebb kötés, mint a mai kapuk. Ez tudatos korlát, nem feledékenység, és visszavonandó, ha a rendszert olyan valaki futtatja, akit nem te felügyelsz. Az **elérhetőség** ezzel szemben nem non-goal: az előfeltétel, és a Phase 1 elé kerül.

## A Shape saját kockázata

Egy non-goal-nál fontosabb, mert magát a javaslat magját érinti.

A §1b-ben idézett 65 fejlesztős vizsgálat szerint az AI épp a **planningben és a requirements analysisben** a leggyengébb. A Shape-agent viszont pontosan ezt csinálja: beszélgetésből követelményt, döntési hézagot és fogalmi konfliktust állít elő.

> **A Shape az AI leggyengébb képességére épít.**

A §6 kérdezési szabálya ezt részben kivédi — *kérdezz, ne dönts* —, de nem teljesen: annak eldöntése, hogy **mi számít döntési pontnak**, maga is requirements-analízis.

Ezért a Shape-et nem szabad úgy bevezetni, hogy a minőségéről nincs adat. A Phase 1 sikerkritériumába fel kell venni a §5.3 két metrikáját: ha a Shape nem rövidíti a **time-to-notice**-t, akkor a shaping nem érték, hanem egy újabb réteg, amit karban kell tartani.

Ehhez kapcsolódik egy termékkockázat is. A terepvizsgálatok szerint a tapasztalt fejlesztők **már ma megtartják a kontrollt** saját stratégiákkal. Nekik a Shape nem új képesség, hanem adminisztráció — hacsak nem pontosan azt kodifikálja, amit amúgy is csinálnak (lásd P0).

---

# 19. MVP javaslat

## Phase 1 — Decision-aware shaping

Legkisebb értelmes vertikális slice:

```text
conversation
    ↓
Shape
    ↓
owned / delegated / unowned decisions
    ↓
blocking gap detection
    ↓
compile to existing contract
```

### Tartalom

- `S-` entity;
- `/shape` skill;
- Shape persistence;
- decision gap modell;
- owned / delegated / unowned státusz;
- `shape show`;
- `shape gaps`;
- egyszerű Shape → contract compile;
- provenance legalább conversation event szinten;
- board read-only Shape detail;
- Home `Waiting on you` integration.

### Sikerkritérium

A Kotta képes legyen egy természetes beszélgetésből úgy contractot készíteni, hogy a compile pillanatában nincs olyan releváns product/design/architecture döntés, amelyről nincs explicit módon eldöntve, hogy:

- human-owned;
- vagy agent-delegated.

---

## Phase 2 — Shared vocabulary

Hozzáadni:

- `.kotta/vocabulary.md`;
- preferred term;
- aliases;
- code name;
- avoid list;
- terminology gap detection;
- new-term introduction rule;
- relevant vocabulary injection a contract/agent briefbe.

### Sikerkritérium

Egy agent ne tudjon észrevétlenül alternatív doménterminológiát kialakítani a projektben.

---

## Phase 3 — Semantic consistency

Hozzáadni:

- possible intent conflicts;
- decision supersession;
- vocabulary/model conflicts;
- semantic review flow.

### Sikerkritérium

A rendszer észreveszi, ha egy új beszélgetés potenciálisan ütközik egy korábbi durable döntéssel vagy domain definícióval, de nem állítja automatikusan, hogy contradiction történt.

---

## Phase 4 — Generalized shaping engine

A finding-shapinget ugyanarra a Shape-modellre vinni. Figyelem: ez **nem** egy meglévő capability átvezetése — a §14 szerint a finding-shaping ma nincs implementálva, tehát ez a fázis zöldmezős, és ennek megfelelően kell becsülni.

Inputok:

```text
conversation
observation(s)
existing contract
repository evidence
decision
principle
```

Outputok:

```text
0..N contracts
0..N decisions
0..N observations
0..1 batch proposal
```

---

# 20. Javasolt product principles

## P0 — A Kotta meglévő stratégiákat kodifikál, nem újat vezet be

A terepvizsgálatok szerint a tapasztalt fejlesztők már ma sem engedik el az agenteket: megtartják a design- és implementációs döntéseket, és tudatos stratégiákkal korlátozzák az agent viselkedését.

A mai Kotta lényegében ezek metszete, formalizálva:

| amit amúgy is csinálnak | a Kottában |
|---|---|
| kicsi, körülhatárolt feladat | contract |
| friss kontextus feladatonként | `execute` fresh |
| eldobható izoláció | claim + branch + worktree |
| írd le előbb, mit akarsz | define + brief |
| ne hidd el, hogy kész — nézd meg | evidence + acceptance |
| ne javítsd, ami nincs a scope-ban | observation |
| ne foltozz össze zavaros sessiont — indítsd újra | `--resume`, és a második `execute` elutasítása |

Mind a hét ugyanazt a két dolgot javítja: **hamarabb derüljön ki az eltérés**, és **olcsóbb legyen visszafordítani**. A §1b vezérelve tehát nem új szabály, hanem ennek a metszetnek az absztrakciója.

Két következménye van.

**A fogalmak közösek; a szavak nem.** A `contract`, `observation`, `batch`, `claim` a Kotta szótára, nem a szakmáé. Egy tapasztalt fejlesztő a fogalmakat felismeri, a szavakat nem — ezért az elfogadás akadálya nem a képesség, hanem a nyelv. Ez a §7 és a §22 tétje, és ez indokolja, hogy a szótár-munka **előrébb** kerül, mint az új képességek.

**Minden új javaslatra érvényes a próba:** ez olyasmit kodifikál, amit egy jó fejlesztő amúgy is csinál — vagy olyasmit ír elő, amit senki? Az első a Kotta dolga. A második adminisztráció.

---

## P1 — Humans own intent

A Kotta nem talál ki hiányzó product intentet.

---

## P2 — Delegation must be explicit

Az agent kaphat nagy szabadságot, de ennek tudatos delegációnak kell lennie.

---

## P3 — Agents must not silently rename the domain

Új doménterminológia nem válhat canonical-lá észrevétlenül.

---

## P4 — Investigate before asking

A Kotta ne kérdezze meg azt, amit a repóból vagy a durable knowledge-ből meg tud állapítani.

---

## P5 — Ask about decisions, not missing prose

A Kotta ne „spec completeness”-t optimalizáljon, hanem olyan döntési pontokat keressen, amelyek materially megváltoztatják a rendszert.

---

## P6 — Semantic suspicion is not canonical contradiction

LLM által érzékelt konfliktus reviewable hypothesis.

---

## P7 — Contracts are compiled artifacts

A contract a tisztázott intent végrehajtható reprezentációja, nem a gondolkodási folyamat első artefaktja.

---

## P8 — Repository remains the shared truth

A Shape, decision, vocabulary, contract és evidence visszakereshető, durable és repository-native.

---

# 21. Pozicionálási következmény

A jelenlegi Kotta fő ereje:

> kontrollálja, hogyan hajtja végre az agent a definiált munkát.

A kibővített Kotta:

> **azt is kontrollálja, hogy mielőtt végrehajtja, ugyanazt érti-e a user és az agent azon, amit meg kell építeni.**

Lehetséges rövid pozicionálás:

> **Kotta makes sure you and your agents mean the same thing before they start coding.**

Kibővítve:

> Kotta finds the decisions hidden in your conversation, aligns the language you use, turns the result into bounded executable contracts, and keeps execution tied to evidence.

Alternatíva:

> **From messy conversation to verified implementation.**

Vagy:

> **Don't let the agent decide what you forgot to specify.**

---

# 22. A Kotta saját terminológiájának felülvizsgálata

A vocabulary feature előtt érdemes a Kotta saját user-facing nyelvét is auditálni.

Jelenlegi fogalmak többek között:

- observation;
- contract;
- batch;
- decision;
- principle;
- shape;
- claim;
- control plane;
- defined;
- execution context;
- worktree;
- evidence.

Nem biztos, hogy mindegyiknek user-facing first-class fogalomként kell megjelennie.

Javasolt audit-kérdések:

- Kell-e a usernek ismernie ezt a szót?
- Domain concept vagy implementation concept?
- Látható-e közvetlenül a UI-ban?
- Magyarázat nélkül érthető?
- Van-e két fogalom, amelyet össze lehet vonni?
- Van-e technikai fogalom, amelyet csak advanced/debug view-ban kellene mutatni?
- Használja-e ugyanazt a szót a CLI, a board, a docs és az agent?

A Kottának először saját magán kell alkalmaznia a szabályt:

> **ne használjon több és technikaibb terminológiát annál, mint amennyi a user mentális modelljéhez valóban szükséges.**

---

# 23. Röviden

A javasolt új Kotta nem egyszerűen „jobb spec generátor”.

A teljes modell:

```text
YOU TALK
   ↓
KOTTA INVESTIGATES
   ↓
KOTTA BUILDS A SHARED MODEL
   ↓
KOTTA FINDS:
   - missing decisions
   - undeclared delegation
   - terminology drift
   - possible semantic conflicts
   ↓
YOU OWN / DELEGATE / CLARIFY / NAME
   ↓
KOTTA COMPILES CONTRACTS
   ↓
AGENTS EXECUTE BOUNDED WORK
   ↓
KOTTA REQUIRES EVIDENCE
   ↓
YOU ACCEPT
```

A jelenlegi Kotta fő kérdése:

> **Hogyan hajtsa végre biztonságosan az agent azt, amit kértünk?**

A kibővített Kotta ehhez hozzáad egy korábbi, még fontosabb kérdést:

> **Valóban ugyanazt értjük-e azon, amit kértünk?**
