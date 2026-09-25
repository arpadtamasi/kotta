# search-pages Specification

## Purpose
A kurzus nyelvén akkor is meg kell találni egy anyagot, ha más nyelven van. Ez
a képesség rögzíti, mi a keresőpéldány, hogyan szűr a keresés nyelvvel, és hogyan
oldódik vissza a találat a forrás egységére.

## Requirements

### Requirement: Keresőpéldány
Egy egység kurzusnyelvű fordítása SHALL önálló keresőpéldányként az indexbe
kerülni: saját szöveggel, megjelölt nyelvvel, a forrás egységére mutatva. A
keresőpéldány csak a megtalálást szolgálja: MUST NOT a forrásnézetben megjelenni,
MUST NOT hivatkozás célja lenni, és MUST NOT a modellhez jutni a találat
szövegeként.

Egy indexbejegyzés szövege SHALL egynyelvű lenni: a forrás egységének szövege a
maga nyelvén, a keresőpéldányé a kurzus nyelvén. Sem fordítás, sem felirat MUST
NOT egy bejegyzés szövegébe gyúrva megjelenni.

#### Scenario: Görög oldal magyar kurzuson
- **WHEN** egy görög anyag egy oldala egy magyar kurzuson szerepel, és elkészül a fordítása
- **THEN** az indexben két bejegyzés lesz: a görög oldal és a magyar keresőpéldány, mindkettő egynyelvű

#### Scenario: Azonos nyelvű anyag
- **WHEN** egy magyar anyag magyar kurzuson szerepel
- **THEN** keresőpéldány nem keletkezik, az egység a maga szövegével kereshető

### Requirement: A keresés nyelve
A keresés SHALL a kurzus indexében futni, amely a kurzus dokumentumainak
eredeti bejegyzéseit és a kurzus nyelvének keresőpéldányait tartalmazza, így a
kurzus nyelvén feltett kérdés a keresőpéldányon, az eredeti írásmódú név vagy
idézet az eredeti bejegyzésen talál. Más nyelvek keresőpéldányai MUST NOT a
kurzus indexébe kerülni. Ugyanannak az egységnek a több úton érkező találatai
SHALL egy találattá összevonódni, a jobbik pontszámmal.

#### Scenario: Név az eredeti írásmódjában
- **WHEN** a magyar kurzuson a diák a „Οὖτις” névre keres
- **THEN** a görög eredeti oldalán is talál, nem csak a magyar keresőpéldányokon

#### Scenario: Ugyanaz az egység két úton
- **WHEN** ugyanaz az egység a keresőpéldányán és az eredetijén is illeszkedik
- **THEN** a találati listában egyszer szerepel, a jobbik pontszámával

#### Scenario: Idegen nyelvű keresőpéldány nem keveredik
- **WHEN** egy görög könyvnek magyar és angol keresőpéldánya is van, és egy magyar kurzuson szerepel
- **THEN** a kurzus indexében csak a magyar keresőpéldányok vannak

### Requirement: A találat visszaoldása
A keresőpéldányon keletkezett találat SHALL a forrás egységére feloldódni: a
modell a forrás szövegét kapja, a hivatkozás a forrás egységére mutat, és a
forrásnézet a forrás szövegét mutatja. A keresőpéldány azonosítója MUST NOT a
válaszba vagy a felületre kerülni.

#### Scenario: Találat a magyar keresőpéldányon
- **WHEN** a magyar kérdés a görög oldal magyar keresőpéldányán talál
- **THEN** a modell a görög szöveget kapja, és a hivatkozás a görög oldalra mutat

#### Scenario: Szomszédok a forrás mentén
- **WHEN** egy keresőpéldány a találat
- **THEN** a szomszédos egységek a forrás dokumentumából jönnek, olvasási sorrendben

### Requirement: Metaadat a szövegen kívül
Egy indexbejegyzés szövege csak a szöveg SHALL lenni; minden más, amit a
helyről tudunk, metaadatként SHALL mellette állni, és a találattal együtt a
modellhez jutni. A metaadat SHALL tartalmazni: a dokumentum címét és szerzőit, a
szakaszt (fejezet, ének, rész) a maga számával, a nyomtatott oldalszámot ha az
oldalon szerepel, az egység nullától induló sorszámát, az egység nyelvét, az
egység fajtáját (oldal, szakasz, dia, felvételdarab), felvételnél az
időtartományt, és azt, hogy van-e oldalképe.

A hely felirata a metaadatból SHALL előállni, és a kurzus nyelvén megjelenni;
felirat MUST NOT a bejegyzés szövegébe fűzve szerepelni. Szerkezeti kérdésre
(„mi van a kilencedik énekben”) a keresés a metaadatra SHALL szűrni, nem a
szövegbe rejtett feliratra.

#### Scenario: Szerkezeti kérdés
- **WHEN** a diák a kilencedik énekről kérdez
- **THEN** a keresés a szakasz számára szűr, nem a szövegbe fűzött feliratra hagyatkozik

#### Scenario: Nyomtatott oldalszám nélküli anyag
- **WHEN** egy PDF-en nincs kinyomtatott oldalszám
- **THEN** a metaadatban a nyomtatott oldalszám hiányzik, a nullától induló sorszám viszont ott van
