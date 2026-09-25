# page-vision Specification

## Purpose
A szkennelt és ábrás PDF-oldal nem vész el: ez a képesség rögzíti, mely
oldalak mennek képi feldolgozásra, hogyan kerül vissza a leírásuk a
korpuszba, és hogyan jut az oldalkép a chatbe.

## Requirements

### Requirement: Képi feldolgozás módja
A képi feldolgozás SHALL valódi modellel futni, ha van OpenAI-kulcs és az
asszisztens nem determinisztikus módban fut; különben determinisztikus,
hálózat nélküli módban. Beállítással SHALL kikapcsolható lenni; kikapcsolva
egyetlen oldal sem megy képi feldolgozásra. Minden dokumentumnak SHALL képi
módja lenni, amelyet a feltöltő tanár választ:
- **Automatikus** (alap): a triázs dönt, oldalanként;
- **Minden oldal képként**: a PDF minden oldala képi feldolgozásra kerül;
- **Csak szöveg**: egyetlen oldal sem kerül képi feldolgozásra.

#### Scenario: Kikapcsolt képi út
- **WHEN** a képi feldolgozás beállítással ki van kapcsolva
- **THEN** a PDF oldalai csak a kinyert szövegükkel kerülnek a korpuszba, bármi a dokumentum képi módja

#### Scenario: Képregény minden oldal képként
- **WHEN** a tanár képregényt tölt fel „Minden oldal képként” móddal
- **THEN** minden oldal képi feldolgozásra kerül, és a panelek leírása kereshető lesz

#### Scenario: Csak szöveg
- **WHEN** a tanár „Csak szöveg” móddal tölt fel egy szkennelt PDF-et
- **THEN** egyik oldal sem megy képi feldolgozásra, a szöveg nélküli oldalak üresek maradnak

### Requirement: Csak a rászoruló PDF-oldal
Automatikus módban képi feldolgozásra SHALL csak PDF-oldal kerülni, és csak
akkor, ha a kinyert szövege hiányzik, romlott, túl kevés betűt tartalmaz
(táblázat- vagy képletszerű), ábrára, táblázatra, diagramra vagy képletre
hivatkozik, vizuális elemet tartalmaz, vagy az oldal jelentős része kép vagy
vektoros rajz (a beágyazott képek az oldal legalább 30%-át fedik, vagy az
oldalon legalább 40 rajzelem van) — akkor is, ha van rajta szöveg. DOCX-, PPTX-
és EPUB-egység MUST NOT képi feldolgozásra kerülni, egyik módban sem. Oldalkorlát
nincs: egyetlen rászoruló oldalt sem hagyunk ki.

#### Scenario: Sima szöveges PDF
- **WHEN** egy PDF minden oldala tiszta, hivatkozás nélküli szöveg, kép és rajz nélkül
- **THEN** egyik oldal sem megy képi feldolgozásra

#### Scenario: Ábrára hivatkozó oldal
- **WHEN** egy oldal szövege „lásd a 3. ábrát”
- **THEN** az oldal képi feldolgozásra kerül, és a szövege megmarad

#### Scenario: Feliratos képregényoldal automatikus módban
- **WHEN** egy oldalon két sor felirat és az oldal 60%-át fedő kép van
- **THEN** az oldal képi feldolgozásra kerül

### Requirement: Oldalkép és kötegelt leírás
A rászoruló oldalakról a feldolgozás SHALL oldalképet renderelni (alapból
150 DPI), a szolgáltató saját tárhelyére tenni, és egy dokumentum összes
várakozó oldalát egyetlen kötegben beadni leírásra. A beadott köteg alatt a
dokumentum képi feldolgozás fázisban marad. Valódi modellnél, ha az oldalkép
aláírt címe nem áll elő, az oldal feldolgozása MUST hibával elbukni.

A beadott kérés SHALL megmondani, milyen nyelven készüljön az oldal vizuális
tartalmának leírása: annak a kurzusnak a nyelvén, amelyhez a dokumentum
tartozik. Ha a dokumentum több, eltérő nyelvű kurzushoz tartozik, a leírás az
első kurzus nyelvén SHALL készülni, és a többi kurzus a fordítással kapja meg
a maga nyelvén.

#### Scenario: Több képes oldal
- **WHEN** egy PDF-ben tíz oldal szorul képi feldolgozásra
- **THEN** a tíz oldal egy kötegben megy beadásra

#### Scenario: Magyar kurzus képregénye
- **WHEN** egy magyar nyelvű kurzus képregényoldala kerül képi feldolgozásra
- **THEN** a panelek leírása magyarul kerül a korpuszba

### Requirement: A leírás a szöveg helyére kerül
Amikor a köteg eredménye megérkezik, a feldolgozás SHALL az oldal leírt
tartalmát a korábbi szöveg helyére tenni, így az oldal ugyanúgy kereshető és
idézhető, mint bármelyik másik; majd újraindexel.

Az oldalon lévő szöveget a leírás MUST NOT lefordítani: az idézet a szerzőé,
a leírás a miénk. Az idegen nyelvű oldalszöveg tehát eredetiben marad, és a
kurzus nyelvére a fordítási lépés SHALL lefordítani, ugyanúgy, mint bármely
más oldalét.

#### Scenario: Szkennelt oldal
- **WHEN** egy szkennelt tankönyvoldal leírása megérkezik
- **THEN** a diák kérdésére az oldal találatként és hivatkozásként megjelenhet

#### Scenario: Görög idézet magyar kurzuson
- **WHEN** egy magyar kurzus oldalán görög idézet és egy ábra van
- **THEN** a görög idézet eredetiben marad, az ábra leírása magyarul készül

### Requirement: Nem talál ki szöveget
A determinisztikus mód MUST NOT szöveget kitalálni: a leírás a nyers
oldalszöveg; a szöveg nélküli szkennelt oldal üres marad. Az ábrára hivatkozó
oldalt ez a mód is vizuális ellenőrzésre jelöli.

#### Scenario: Kulcs nélkül szkennelt oldal
- **WHEN** modellkulcs nélkül egy szöveg nélküli szkennelt oldal kerül feldolgozásra
- **THEN** az oldal szövege üres marad

### Requirement: Lejárt köteg
A beadás nélkül maradt köteg-foglalás 10 perc, a beadott köteg 26 óra után
MUST elbukni, hogy a dokumentum ne várjon a végtelenségig.

#### Scenario: Elveszett köteg
- **WHEN** egy beadott kötegre 26 óráig nem jön eredmény
- **THEN** az érintett oldalak feldolgozása hibával lezárul

### Requirement: Oldalkép a chat modelljének
Ha egy keresési találat vizuális ellenőrzésre jelölt oldal, a chat SHALL az
oldalkép egy órás letöltési címét is a modell elé tenni; ha a cím nem áll elő,
a találat kép nélkül megy tovább.

#### Scenario: Ábrás oldal a válaszban
- **WHEN** a diák kérdésére egy ábrát tartalmazó oldal a találat
- **THEN** a modell az oldal képét is megkapja

### Requirement: Képi oldalak mérése
Képi oldalnak SHALL számítani minden egység, amelynek már van oldalképe, vagy
amely kötegre vár. Ez a szám a tanárnak látszik, és a csomagra könyvelődik.

#### Scenario: Várakozó oldalak
- **WHEN** egy dokumentum három oldala még kötegre vár
- **THEN** a tanár az anyagnál látja, hogy három oldal vár, és ezek a képi oldalak közé számítanak
