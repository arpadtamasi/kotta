## Purpose

A modulhatár a specben is látszik: aki egy modulban kódol, a saját modulja ígéreteit olvassa, a többiből csak az interfészeket.

## ADDED Requirements

### Requirement: A modulok a kódból vezethetők le
A rendszer SHALL a modulok listáját a projekt manifestjeiből olvasni, és SHALL NOT külön, kézzel karbantartott modul-nyilvántartást kérni.

#### Scenario: Új csomag a workspace-ben
- **WHEN** a workspace egy új csomaggal bővül
- **THEN** a modul-lista a következő futáskor tartalmazza, kézi bejegyzés nélkül

### Requirement: A node modulja a bizonyítékából derül ki
A rendszer SHALL egy node modulját abból megállapítani, melyik modulban van a rá hivatkozó kód, teszt vagy parancs.

#### Scenario: Két modulban van a bizonyíték
- **WHEN** egy node bizonyítéka két modulban található
- **THEN** a jelentés kilógó node-ként sorolja fel, és javasolja interfészbe emelni

### Requirement: Modulhatáron átnyúló ígéret interfészben áll
Ha egy ígéret egy másik modul viselkedésére vonatkozik, az SHALL interfész-node-ban állni, és a szabály SHALL az interfészre hivatkozni ahelyett, hogy megismételné.

#### Scenario: Hiányzó interfész
- **WHEN** egy modulnak van kifelé néző felülete, de nincs hozzá interfész-node
- **THEN** az ellenőrzés hibát ad, és megnevezi a felületet

### Requirement: A közös mag ígéretére hivatkozunk, nem másoljuk
Egy másik repóban lévő modul ígéreteit a fogyasztó SHALL hivatkozással használni, a hivatkozás SHALL verziót vagy commitot rögzíteni, és a rendszer SHALL NOT a másolást elfogadni.

#### Scenario: Elcsúszott másolat
- **WHEN** a fogyasztó repóban egy interfész-node a mag interfészének másolata
- **THEN** az ellenőrzés jelzi, és a hivatkozásra váltást javasolja

#### Scenario: A mag megváltozott
- **WHEN** a hivatkozott mag ígérete a rögzített verzió óta változott
- **THEN** a tervezés jelenti, hogy a döntés régebbi ígéreten alapult
