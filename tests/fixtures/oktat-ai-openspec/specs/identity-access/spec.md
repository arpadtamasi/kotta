# identity-access Specification

## Purpose
Egy közös belépés minden szolgáltatóhoz, amelyben a jog az ellenőrzött
e-mail-címé: ez a képesség rögzíti a belépést, a tanári tagságot, a gyökércím
helyválasztóját és a kliens adatelérési határait.

## Requirements

### Requirement: Közös, jelszó nélküli belépés
A felhasználó SHALL egyetlen fiókkal belépni minden szolgáltatóhoz, e-mailben
kapott belépő linkkel vagy Google-fiókkal. A belépő levelet a hitelesítési
szolgáltatás küldi; a termék saját levelet a belépéshez MUST NOT küldeni.

#### Scenario: Belépés e-mail linkkel
- **WHEN** a látogató megadja az e-mail-címét, és ugyanazon az eszközön megnyitja a kapott linket
- **THEN** a belépés automatikusan megtörténik, és a felhasználó azon az oldalon köt ki, ahonnan a belépést kérte

#### Scenario: Link másik eszközön
- **WHEN** a belépő linket olyan böngészőben nyitják meg, ahol nem kérték
- **THEN** a felület megkérdezi az e-mail-címet, és azzal fejezi be a belépést

#### Scenario: Lejárt vagy felhasznált link
- **WHEN** a belépő link lejárt vagy már felhasználták
- **THEN** a felület ezt kimondja, és új link kérését kínálja

### Requirement: Csak ellenőrzött e-mail-cím
Minden belépést igénylő hívásnál a szerver SHALL „belépés szükséges” hibát
adni, ha nincs belépés, ha a tokenben nincs e-mail-cím, vagy ha a cím nincs
megerősítve. A felhasználó azonosítója a fiók, a jogosultságai az e-mail-címéhez
(kisbetűsítve) kötődnek, nem a belépés módjához.

#### Scenario: Meg nem erősített cím
- **WHEN** egy meg nem erősített e-mail-című fiók kurzust nyitna meg
- **THEN** a szerver „belépés szükséges” hibát ad

#### Scenario: Google-belépés ugyanazzal a címmel
- **WHEN** a diák Google-lel lép be azzal a címmel, amelyet a tanár felvett
- **THEN** ugyanazokhoz a kurzusokhoz fér hozzá, mint e-mail linkkel

### Requirement: Tanári tagság cím szerint
Egy felhasználó SHALL akkor tanár egy szolgáltatónál, ha az ellenőrzött
e-mail-címe a szolgáltató tagjai között van, függetlenül attól, mikor
regisztrált. Tanári műveletnél a nem tag hívót a szerver MUST „ehhez tanári
belépés kell” hibával elutasítani.

#### Scenario: Felvétel utáni első belépés
- **WHEN** a szolgáltatót egy címmel veszik fel, és az illető csak utána regisztrál
- **THEN** az első belépése után tanárként éri el a szolgáltató tanári felületét

#### Scenario: Nem tanár a tanári felületen
- **WHEN** egy belépett, nem tag felhasználó a `/tanar` oldalt nyitja meg
- **THEN** a felület kimondja, hogy ez nem az ő tanári címe, és a kurzusaihoz irányít

### Requirement: Munkamenet egy szolgáltatónál
Egy szolgáltató címén a szerver SHALL megadni a belépett felhasználó adatait,
azt, hogy tanár-e ott, és az ott elérhető diák-kurzusait (csak élő kurzusok,
próba- vagy aktív hozzáféréssel, slug szerint rendezve). A felület a
kezdőlapon a tanárnak a tanári áttekintést, a diáknak a kurzusválasztót SHALL
mutatni; ha a diáknak pontosan egy kurzusa van, a felület oda navigál.

#### Scenario: Diák egy kurzussal
- **WHEN** egy diák, akinek egyetlen élő kurzusa van a szolgáltatónál, a kezdőlapra lép
- **THEN** a felület a kurzus oldalára viszi

#### Scenario: Kurzus nélküli felhasználó
- **WHEN** a belépett felhasználónak nincs kurzusa a szolgáltatónál
- **THEN** a felület kimondja, melyik címmel lépett be, és hogy a hozzáférést a tanár adja erre a címre

### Requirement: Helyválasztó a gyökércímen
A gyökércímen belépés után a szerver SHALL felsorolni minden aktív
szolgáltatót, ahol a cím tanár (tanári felület linkkel), és minden élő
kurzust aktív szolgáltatónál, amelyhez a cím próba- vagy aktív hozzáféréssel
bír (kurzuslinkkel). Annál a szolgáltatónál, ahol a cím tanár, a diák-kurzusok
MUST NOT külön szerepelni. Pontosan egy hely esetén a felület SHALL oda
átirányítani; nulla hely esetén kimondani, hogy a címhez nem tartozik semmi.

#### Scenario: Egyetlen hely
- **WHEN** a cím egyetlen szolgáltatónál tanár, és diákként sehol nincs felvéve
- **THEN** a gyökércím a tanári felületre irányít

#### Scenario: Több hely
- **WHEN** a cím egy szolgáltatónál tanár, egy másiknál diák
- **THEN** a gyökércím mindkét helyet felsorolja választásra

### Requirement: A kliens csak olvas
A böngésző MUST NOT közvetlenül írni az adatbázisba; minden módosítás
szerveroldali hívással történik. Közvetlen olvasás SHALL csak a következő
esetekben engedett:
- a szolgáltató tanára (ellenőrzött cím a szolgáltató tanári címlistáján)
  olvashatja a szolgáltató dokumentumát, kurzusait, anyagait,
  dokumentumait és egységeit, kérdésnaplóját és értesítéseit;
- a hozzáférés-rekordot a benne szereplő cím tulajdonosa és a szolgáltató
  tanára olvashatja;
- egy beszélgetést és üzeneteit csak a résztvevője olvashatja.
A tagsági rekordok és minden más adat MUST NOT olvasható lenni a kliensből.

#### Scenario: Tanár másik szolgáltatónál
- **WHEN** a `kovacs` tanára a `masik` szolgáltató dokumentumát olvasná
- **THEN** az olvasás tiltott

#### Scenario: Diák a szolgáltató adataira
- **WHEN** egy diák a szolgáltató kurzusait vagy kérdésnaplóját olvasná
- **THEN** az olvasás tiltott

#### Scenario: Diák a saját beszélgetésére
- **WHEN** a diák a saját beszélgetésének üzeneteit olvassa
- **THEN** az olvasás engedett, az írás tiltott

### Requirement: Feltöltés csak saját átmeneti helyre
A böngésző a fájltárba SHALL csak a saját `uploads/{felhasználó}/` helyére, csak
ellenőrzött címmel létrehozni fájlt: legfeljebb 20 MB-os PDF, DOCX vagy PPTX
fájlt, legfeljebb 50 MB-os EPUB fájlt, illetve legfeljebb 500 MB-os hang- vagy
videófájlt a támogatott típusokból. Minden más fájltár-olvasás és -írás MUST
tiltott lenni a kliensből.

#### Scenario: Idegen hely
- **WHEN** egy felhasználó más felhasználó `uploads/` helyére vagy a szolgáltatói ágba töltene fel
- **THEN** a feltöltés tiltott

#### Scenario: Saját feltöltés visszaolvasása
- **WHEN** a felhasználó a saját feltöltött fájlját olvasná
- **THEN** az olvasás tiltott

#### Scenario: Videó a saját helyre
- **WHEN** egy ellenőrzött felhasználó 300 MB-os MP4-et tölt a saját helyére
- **THEN** a feltöltés engedett

#### Scenario: Túl nagy PDF
- **WHEN** egy ellenőrzött felhasználó 30 MB-os PDF-et töltene fel
- **THEN** a feltöltés tiltott

#### Scenario: Epub a saját helyre
- **WHEN** egy ellenőrzött felhasználó 30 MB-os epubot tölt a saját helyére
- **THEN** a feltöltés engedett

### Requirement: Hibák egységes fordítása
A szerver a hibákat SHALL egységes kódokra fordítani: hiányzó belépés →
„unauthenticated”, tiltott művelet → „permission-denied”, nem létező elem →
„not-found”, érvénytelen bemenet → „invalid-argument”, elfogyott ingyenes
kérdés → „resource-exhausted” fal-jelzéssel; minden más hiba „internal”, a hiba
típusával és üzenetével.

#### Scenario: Érvénytelen bemenet
- **WHEN** egy hívás üres kurzusnévvel érkezik
- **THEN** a szerver „invalid-argument” hibát ad emberi nyelvű üzenettel

### Requirement: Fiókváltás tisztít
Amikor a belépett fiók megváltozik, a felület SHALL leállítani minden élő
adatfeliratkozást és elfelejteni a korábban megnyitott kurzusnézeteket.

#### Scenario: Kilépés és belépés másik címmel
- **WHEN** a felhasználó kilép, és másik címmel lép be
- **THEN** a felület az előző fiók adatait nem mutatja tovább
