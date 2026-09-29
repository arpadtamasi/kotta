## Purpose

Az elfogadott ígéretekről látszik, megépültek-e, és a bizonyíték modul- és teszt-szinten köthető.

## ADDED Requirements

### Requirement: Minden elfogadott ígéretről látszik, megépült-e
A jelentés SHALL minden elfogadott node-ról megmondani, van-e rá bizonyíték a kódban, és SHALL megkülönböztetni a modul-szintű és a teszt-szintű kötést.

#### Scenario: Ígéret bizonyíték nélkül
- **WHEN** egy elfogadott szabályra semmi nem hivatkozik a kódban
- **THEN** a jelentés bizonyíték nélküliként sorolja fel, és nem nulla kóddal zár

### Requirement: A teszt a nevében nevezi meg, mit bizonyít
Egy teszt SHALL a bizonyított node azonosítóját a nevében viselni, és a rendszer SHALL a futás eredményéből megállapítani, hogy az ígéret zöld-e a vizsgált commiton.

#### Scenario: Átugrott teszt
- **WHEN** a kötött teszt átugrásra kerül
- **THEN** a node nem számít bizonyítottnak, és a jelentés megmondja, miért

### Requirement: A jelentés a régi workspace-ben is fut
A jelentés SHALL a mai és a régi workspace-formában is futni, vagy SHALL megnevezni a migrációt, amely nélkül nem tud futni.

#### Scenario: Régi forma
- **WHEN** a workspace régi formájú
- **THEN** a jelentés vagy lefut, vagy pontosan megmondja, mit kell migrálni
