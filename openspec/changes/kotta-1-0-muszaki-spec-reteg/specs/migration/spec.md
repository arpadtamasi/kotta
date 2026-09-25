## Purpose

A meglévő workspace-ek és az OpenSpec-projektek átvezetése az új modellbe, veszteség nélkül.

## ADDED Requirements

### Requirement: A folyamat-adat archívumba kerül
A migráció SHALL a meglévő folyamat-tartalmat csak olvasható archívumba tenni, és SHALL a spec-részt változatlanul átvinni.

#### Scenario: Meglévő workspace migrálása
- **WHEN** egy mai workspace-t migrálunk
- **THEN** a spec node-jai változatlanok maradnak, a folyamat-adat archívumba kerül, és semmi nem törlődik

### Requirement: Nincs kompatibilitási réteg, csak migráció
Az 1.0 SHALL NOT a régi folyamat-parancsokat megtartani; egy migrálatlan workspace-ben SHALL a migrációt ajánlani és mást nem tenni. A régi kiadás a régi verziószámon marad telepíthető.

#### Scenario: Migrálatlan workspace
- **WHEN** az 1.0 egy régi formájú workspace-t talál
- **THEN** megnevezi a migrációt, és semmilyen más parancs nem fut le rajta

#### Scenario: Migrálás után
- **WHEN** a workspace migrálva lett
- **THEN** a folyamat-adat a `legacy/` alatt olvasható marad, és semmilyen parancs nem ír bele

### Requirement: OpenSpec-projekt importálható
A rendszer SHALL egy meglévő narratív specet átvenni, és a tervezés-fázissal műszaki modellt SHALL belőle előállítani.

#### Scenario: Import után
- **WHEN** egy OpenSpec-projektet importálunk
- **THEN** a narratív spec változatlan marad, és a modellben minden node jelöli, hogy kimondott vagy következtetett
