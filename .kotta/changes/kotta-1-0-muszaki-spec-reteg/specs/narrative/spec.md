## Purpose

A narratíva az a réteg, ami megőrzi, miért lett ilyen a rendszer: a beszélgetés desztillátuma, a hozzá tartozó termék-dokumentumokkal.

## ADDED Requirements

### Requirement: Változtatásonként desztillált beszélgetés marad
A rendszer SHALL a change mellett megőrizni a beszélgetés desztillátumát: a szándékot kimondó emberi mondatokat, az ágens javaslatait a rájuk adott válasszal, az elvetett utakat és a feltett kérdéseket, valamint a nyers munkamenetre mutató hivatkozást.

#### Scenario: Egyszavas jóváhagyás
- **WHEN** az ágens javasol valamit, és az ember annyit felel, hogy „igen”
- **THEN** a desztillátum a javaslatot és a választ együtt őrzi meg, időbélyeggel

### Requirement: Minden „miért” mellett ott áll, ki döntött
A rendszer SHALL a döntés forrását rögzíteni: ember kezdeményezte, gép javasolta és ember jóváhagyta, gép javasolta és ember mást választott, vagy gép döntötte el.

#### Scenario: A gép döntött
- **WHEN** egy ígéret indoklását sem az ember, sem egy proposal nem mondja ki
- **THEN** a rendszer „a gép döntötte el” jelölést ad, és a tétel megjelenik az átnézhető listában

### Requirement: A titkok nem kerülnek be
A desztillátum SHALL titok- és személyesadat-szűrésen átmenni, mielőtt a repóba kerül.

#### Scenario: Kulcs a beszélgetésben
- **WHEN** a munkamenet API-kulcsot tartalmaz
- **THEN** a desztillátum azt nem tartalmazza, és a szűrés ezt jelzi
