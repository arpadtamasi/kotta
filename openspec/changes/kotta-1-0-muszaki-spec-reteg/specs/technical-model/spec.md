## Purpose

A műszaki spec a projekt elfogadott ígéreteinek pontos, gépileg ellenőrizhető alakja: szabályok, példák, entitások, állapotgépek, use case-ek, történetek, interfészek. A narratív spec (OpenSpec) mellett él, és eltérés esetén a műszaki spec az igazság.

## ADDED Requirements

### Requirement: A műszaki spec az elfogadott igazság
Ha a narratív spec és a műszaki spec ugyanarról mást állít, a rendszer SHALL a műszaki specet tekinteni elfogadottnak, és SHALL jelezni az eltérést: melyik narratív mondat melyik node-dal ütközik.

#### Scenario: Az eltérés nem marad csendben
- **WHEN** a narratív spec egy requirementje mást mond, mint a hozzá tartozó node
- **THEN** az ellenőrzés hibát ad, megnevezi mindkét helyet, és nem enged archiválni

#### Scenario: A próza a modellből frissül
- **WHEN** egy változtatás archiválódik
- **THEN** a narratív spec érintett része a modellből újragenerálódik, és a generált szöveg megegyezik a modell állításaival

### Requirement: Minden állítás mellett ott áll, honnan jön
Minden node SHALL jelölni, hogy tartalma kimondott, következtetett, vagy a gép döntése. A jelölés SHALL a node-dal együtt utazni, és megjelenni a nézetben.

#### Scenario: Következtetett cél
- **WHEN** a tervezés egy célt a képesség leírásából következtet ki
- **THEN** a node „következtetett” jelölést kap, és a nézet ezt láthatóan mutatja

### Requirement: A formák a projekt tulajdona
A form-regiszter SHALL a projektben élni és szerkeszthető lenni, és a validálás SHALL az általa kimondott kötelező fejezetekre és élekre hivatkozva utasítani el.

#### Scenario: Hiányzó kötelező él
- **WHEN** egy állapotgép nem nevezi meg a governált entitást
- **THEN** a validálás elutasít, és a forma kérdését idézi: „Kinek az életciklusa ez?”
