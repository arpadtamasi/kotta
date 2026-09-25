# tenant-addressing Specification

## Purpose
A szolgáltató és a kurzus a címből olvasható ki: ez a képesség rögzíti a két
címformát, a slugok szabályait, a foglalt neveket és a nyilvános linkek alakját.

## Requirements

### Requirement: Slug-formátum
A szolgáltató- és a kurzus-slug SHALL kisbetűből, számjegyből és kötőjelből
állni, betűvel vagy számmal kezdődni és végződni, és legfeljebb 63 karakter
hosszú lenni. A beküldött slugot a szerver SHALL kisbetűsíteni és a széleiről a
szóközt levágni, mielőtt ellenőrzi.

#### Scenario: Érvényes slug
- **WHEN** a slug `fizika-8`
- **THEN** a slug elfogadott

#### Scenario: Érvénytelen slug
- **WHEN** a slug `-fizika`, `fizika_8` vagy 64 karakteres
- **THEN** a slug elutasul: kurzus létrehozásakor érvénytelen bemenetként, szolgáltató címeként „nem található” hibával

### Requirement: Foglalt szolgáltató-nevek
A szolgáltató-slug MUST NOT a következők egyike lenni: `www`, `api`, `admin`,
`app`, `mail`, `blog`, `help`, `status`, `docs`, `assets`, `__`.

#### Scenario: Foglalt név szolgáltatónak
- **WHEN** egy szolgáltatót `assets` sluggal vesznek fel
- **THEN** a felvétel hibával elutasul, mert a cím foglalt

### Requirement: Foglalt kurzus-útvonalak
A kurzus-slug MUST NOT a következők egyike lenni: `api`, `tanar`, `belepes`,
`meghivo`, `assets`, `kilepes`.

#### Scenario: Foglalt kurzusnév
- **WHEN** a tanár „Tanár” nevű kurzust hoz létre, és a slug `tanar` lenne
- **THEN** a létrehozás hibával elutasul, mert az útvonal foglalt

### Requirement: Kurzus-slug a névből
Ha a kurzus létrehozásakor nincs megadva slug, a szerver SHALL a névből
képezni: az ékezeteket elhagyja, kisbetűsít, minden nem betű-szám sorozatot
egy kötőjelre cserél, a széleken lévő kötőjeleket levágja, 63 karakterre
rövidít; ha így üres maradna, a slug `kurzus`.

#### Scenario: Ékezetes név
- **WHEN** a kurzus neve „Kémia 9”
- **THEN** a kurzus slugja `kemia-9`

### Requirement: Útvonal-mód
Ha nincs alap-domain beállítva, a cím SHALL útvonal-módú lenni: a szolgáltató
az útvonal első szegmense (kisbetűsítve), a kurzus és a többi oldal az utána
következő rész. Ha az első szegmens hiányzik, foglalt vagy nem érvényes slug,
a címhez MUST NOT szolgáltató tartozni.

#### Scenario: Szolgáltató és kurzus az útvonalban
- **WHEN** a böngésző a `/kovacs/fizika-8` címet nyitja meg
- **THEN** a szolgáltató `kovacs`, a szolgáltatón belüli útvonal `/fizika-8`

#### Scenario: Gyökércím
- **WHEN** a böngésző a `/` vagy az `/assets/…` címet nyitja meg
- **THEN** nincs szolgáltató, és a gyökéroldal jelenik meg

### Requirement: Aldomain-mód
Ha alap-domain be van állítva, a szolgáltató SHALL az alap-domain alatti
egyetlen címke lenni, a kurzus pedig útvonal. Az alap-domain maga, a foglalt
aldomain, az idegen hoszt, az érvénytelen címke és a mélyebb szint (pl.
`matek.kovacs.oktat.ai`) MUST NOT szolgáltatót jelenteni.

#### Scenario: Aldomain szolgáltató
- **WHEN** a hoszt `kovacs.oktat.ai` és az útvonal `/fizika-8`
- **THEN** a szolgáltató `kovacs`, a kurzus útvonala `/fizika-8`

#### Scenario: A kurzus nem al-aldomain
- **WHEN** a hoszt `matek.kovacs.oktat.ai`
- **THEN** a hoszt nem egy szolgáltató címe

### Requirement: Nyilvános linkek alakja
A szerver által kiadott linkek SHALL a beállított módot követni: útvonal-módban
`{alapcím}/{szolgáltató}{útvonal}`, aldomain-módban
`{séma}://{szolgáltató}.{alap-domain}[:{port}]{útvonal}`. A tanári felület
útvonala `/tanar`, egy kurzusé `/{kurzus-slug}`.

#### Scenario: Tanári link útvonal-módban
- **WHEN** az alapcím `https://oktat-ai.web.app` és a szolgáltató `kovacs`
- **THEN** a tanári link `https://oktat-ai.web.app/kovacs/tanar`

### Requirement: Szolgáltatón belüli oldalak
A felület a szolgáltatón belüli útvonalat SHALL így értelmezni: `/` kezdőlap,
`/belepes` belépés, `/tanar` tanári áttekintés, `/tanar/kurzus/{slug}` tanári
kurzusoldal, egyetlen érvényes slug-szegmens a kurzus diákoldala; minden más
útvonal „nincs ilyen oldal”.

#### Scenario: Ismeretlen útvonal
- **WHEN** a szolgáltatón belüli útvonal `/fizika-8/valami` vagy `/Fizika`
- **THEN** a felület „nincs ilyen oldal” nézetet mutat

### Requirement: Csak létező, aktív szolgáltató címe él
Minden szolgáltatóhoz kötött hívásnál a szerver SHALL a hívásban kapott
szolgáltató-slugot ellenőrizni, és „nem található” hibát adni, ha a slug
érvénytelen, vagy a szolgáltató nem létezik, vagy nem aktív.

#### Scenario: Ismeretlen szolgáltató
- **WHEN** a felület a `nincsilyen` szolgáltató címén hív
- **THEN** a szerver „nem található” hibát ad, és a felület kimondja, hogy ezen a címen nincs tanár

### Requirement: Szolgáltató-adatok a felületnek
A szerver SHALL belépés nélkül is megadni egy aktív szolgáltató nevét, a cím
megjeleníthető alakját (séma és záró perjel nélkül), a használt modell
megnevezését, azt, hogy offline tesztmodell fut-e, és az ingyenes kérdések
számát.

#### Scenario: Szolgáltató-információ belépés nélkül
- **WHEN** egy kijelentkezett látogató a `kovacs` címet nyitja meg
- **THEN** a felület megkapja a szolgáltató nevét és az ingyenes kérdések számát
