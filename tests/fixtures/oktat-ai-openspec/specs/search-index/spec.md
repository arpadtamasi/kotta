# search-index Specification

## Purpose
A kurzus anyagaiban a keresés a mi indexünkben fut: bekezdésnyi darabok
vektoraival, kurzusonként elkülönítve. Ez a képesség rögzíti, hogyan készülnek
a darabok, hogyan jutnak a kurzusba, és hogyan keres bennük a segéd.

## Requirements

### Requirement: Darabok a mesterpéldányban
Egy kész dokumentum minden kereshető egysége SHALL bekezdésnyi darabokra
bomlani (kb. 900 karakter, egy bekezdésnyi átfedéssel), és minden darab SHALL
egyszer beágyazódni. A darab SHALL a forrás egységére mutatni, és viselni a
fajtáját (eredeti, keresőpéldány a nyelvével, képleírás), a nyelvét és a
beágyazó modell nevét. A darabok a dokumentum mesterpéldányát alkotják; egy
újrafeldolgozás vagy modellcsere a mesterpéldányt egészében cseréli.

#### Scenario: Egy oldal több darab
- **WHEN** egy tankönyvoldalon három bekezdésnyi szöveg áll
- **THEN** az oldal több darabra bomlik, és mindegyik az oldalra mutat

#### Scenario: A képleírás is darab
- **WHEN** egy képregényoldal képi feldolgozáson ment át
- **THEN** a panelek leírása külön darabként kereshető, az oldalra mutatva

### Requirement: Kurzusindex
Minden kurzusnak SHALL saját indexe lenni. Egy anyag kurzusba vételekor a
mesterpéldányból SHALL bemásolódni az eredeti darabok, a kurzus nyelvének
keresőpéldányai és a képleírások — más nyelvek keresőpéldányai nem. Ha a
dokumentum a felvételkor még nincs kész, a darabok az elkészülésekor
másolódnak be minden kurzusba, amelyen az anyag szerepel. A kurzus nyelvének
változásakor a kurzusindex keresőpéldányai SHALL az új nyelvhez igazodni.

#### Scenario: Görög könyv magyar és görög kurzuson
- **WHEN** ugyanaz a görög könyv egy magyar és egy görög kurzuson is szerepel
- **THEN** a magyar kurzus indexében az eredeti darabok és a magyar keresőpéldányok vannak, a görögében csak az eredetiek

#### Scenario: Még feldolgozás alatt álló anyag
- **WHEN** a tanár egy még feldolgozás alatt álló anyagot vesz fel
- **THEN** az anyag darabjai az elkészülésekor kerülnek a kurzusindexbe

### Requirement: Élesedés és levétel
Egy anyag SHALL csak akkor lenni kereshető egy kurzusban, ha a kurzus
dokumentumlistáján szerepel; a keresés MUST NOT olyan darabot visszaadni,
amelynek dokumentuma nincs a listán. A bemásolás és a törlés darabonként,
kötegekben történhet: a félkész állapot így sosem látszik. Levételkor az anyag
előbb kikerül a listáról, a darabjai utána törlődnek a kurzusindexből.

#### Scenario: Bemásolás közben
- **WHEN** egy anyag darabjainak bemásolása még tart
- **THEN** a kurzusban az anyagból semmi nem kereshető, amíg a listára nem kerül

#### Scenario: Levétel után azonnal
- **WHEN** a tanár levesz egy anyagot
- **THEN** a következő kérdés már nem kap belőle találatot, akkor sem, ha a darabjai törlése még tart

### Requirement: Keresés a kurzusindexben
A keresés SHALL a kérdés vektorához legközelebbi darabokat a kurzusindexből
venni, pontosan (minden darab összevetésével), és egy oldal pontszáma SHALL a
legjobb darabjáé lenni. A darabok vektorát a keresés MUST NOT visszakérni: a
találathoz az oldal és a szöveg elég. A keresés ideje a kurzus darabszámával
arányos; ha egy kurzus darabszáma tartósan 50 000 fölé nő, közelítő indexre
vagy előszűrésre kell váltani.

#### Scenario: Oldal a legjobb darabja szerint
- **WHEN** egy oldal egyik bekezdése pontosan a kérdezett jelenetről szól, a többi másról
- **THEN** az oldal a legjobb bekezdése pontszámával kerül a találatok közé

#### Scenario: Kurzusok elkülönítése
- **WHEN** a diák egy kurzusban kérdez
- **THEN** a szolgáltató más kurzusainak anyagai nem jelennek meg a találatok között

### Requirement: A beágyazó nyilvántartása
Minden darab SHALL viselni a beágyazó modell nevét és a vektor méretét, és a
kérdés vektorát SHALL ugyanazzal a modellel készíteni. Modellcsere esetén a
mesterpéldányok és a kurzusindexek újraépülnek; eltérő modellel készült darab
MUST NOT a keresésbe keveredni.

#### Scenario: Modellcsere
- **WHEN** a beágyazó modell cserélődik
- **THEN** a régi modell darabjai nem kerülnek a találatok közé, amíg az újraépítés tart
