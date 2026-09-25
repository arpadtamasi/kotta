# enrollment-access Specification

## Purpose
A diák kurzusonként kap hozzáférést az e-mail-címére, és néhány ingyenes
kérdés után a tanár kapcsolja aktívra: ez a képesség rögzíti a hozzáférés
életciklusát és az ingyenes kérdések falát.

## Requirements

### Requirement: Hozzáférés kurzusonként, címre
A hozzáférés SHALL egy szolgáltató egy kurzusához és egy (kisbetűsített)
e-mail-címhez tartozni, fióktól függetlenül. Aki ezzel az ellenőrzött címmel
belép, hozzáfér; meghívó, elfogadás és levél nincs. Egy kurzus hozzáférése
MUST NOT másik kurzushoz jogot adni.

#### Scenario: Másik kurzus
- **WHEN** a diák a Fizika 8-hoz kapott hozzáférést
- **THEN** a Fizika 9 megnyitása „ehhez a kurzushoz nincs hozzáférésed” tiltással elutasul

### Requirement: Hozzáférés megadása
A tanár SHALL egy e-mail-címnek hozzáférést adni a kurzushoz; a hozzáférés
próba (`trial`) állapotban jön létre. Érvénytelen cím MUST hibát adni; ha a
címnek már próba- vagy aktív hozzáférése van a kurzushoz, a megadás MUST „ez a
cím már hozzáfér a kurzushoz” hibával elutasulni.

#### Scenario: Új diák
- **WHEN** a tanár felveszi a `diak@example.test` címet
- **THEN** a diáklistában megjelenik próba állapotban, 0 kérdéssel

#### Scenario: Már felvett cím
- **WHEN** a tanár egy aktív hozzáférésű címet vesz fel újra
- **THEN** a szerver hibával elutasítja

### Requirement: Visszavonás
A tanár SHALL visszavonni egy próba- vagy aktív hozzáférést. Csak a saját
kurzusa hozzáférését vonhatja vissza; más kurzusé, nem létező vagy már
visszavont hozzáférés MUST „nincs ilyen hozzáférés” hibát adni. Aktív
hozzáférés visszavonása SHALL eggyel csökkenteni a szolgáltató aktív
beiratkozásainak számát. A visszavont diák a kurzust nem nyithatja meg, és a
nyitva lévő kurzusoldala élőben kimondja, hogy a tanár visszavonta.

#### Scenario: Visszavonás nyitott oldal mellett
- **WHEN** a tanár visszavonja egy éppen chatelő diák hozzáférését
- **THEN** a diák oldala újratöltés nélkül a visszavonást mutatja

### Requirement: Visszaállítás
Visszavont hozzáférés SHALL visszaállítható lenni egy új megadással ugyanarra a
címre. A visszaállított hozzáférés SHALL a visszavonás előtti állapotába
kerülni: ami aktív volt, aktív lesz, megtartott aktiválási idővel, és a
szolgáltató aktív beiratkozásainak száma eggyel nő (utána a csomag kerete
ellenőrzésre kerül); ami próba volt, próba lesz. A kérdésszám mindkét esetben
megmarad. Ha a visszavonás előtti állapot nincs rögzítve, a meglévő
aktiválási idő aktív, a hiánya próba állapotot jelent.

#### Scenario: Aktív hozzáférés visszaállítása
- **WHEN** egy 5 kérdést feltett, aktív, majd visszavont diák hozzáférését a tanár visszaállítja
- **THEN** a hozzáférés aktív 5 kérdéssel, a diák kérdezhet, és az aktív beiratkozások száma a visszavonás előttire áll vissza

#### Scenario: Próba-hozzáférés visszaállítása
- **WHEN** egy 2 kérdést feltett, próba, majd visszavont diák hozzáférését a tanár visszaállítja
- **THEN** a hozzáférés próba 2 kérdéssel, és az aktív beiratkozások száma nem változik

#### Scenario: Régi visszavont rekord
- **WHEN** egy e változás előtt visszavont, aktiválási idővel rendelkező hozzáférést állít vissza a tanár
- **THEN** a hozzáférés aktív lesz

### Requirement: Aktiválás
A tanár SHALL egy próba-hozzáférést aktívra kapcsolni, jelezve, hogy a diák
nála fizetett. Az aktiválás eggyel növeli az aktív beiratkozások számát, és
utána a csomag kerete ellenőrzésre kerül. Már aktív hozzáférés aktiválása
MUST NOT változást okozni; visszavont vagy nem létező hozzáférés aktiválása
MUST „csak élő hozzáférés aktiválható” hibát adni. Aktívból próbába a felület
nem kínál visszalépést.

#### Scenario: Fal lebontása
- **WHEN** a tanár a falnál álló diákot aktívra kapcsolja
- **THEN** a diák oldalán a fal újratöltés nélkül eltűnik, és ugyanabban a beszélgetésben folytathatja

### Requirement: Ingyenes kérdések és fal
Próba-hozzáféréssel a diák SHALL kurzusonként a beállított számú (alapból 3)
kérdést feltenni. A kérdés a feltevés pillanatában számít, akkor is, ha a
válasz hibára fut; az újragenerálás is kérdésnek számít. Ha a feltett kérdések
száma elérte a keretet, a szerver a további kérdést és újragenerálást MUST
fal-jelzésű „resource-exhausted” hibával elutasítani. Aktív hozzáférésnél és a
tanárnál nincs fal.

#### Scenario: Negyedik kérdés
- **WHEN** egy próba-hozzáférésű diák a harmadik kérdése után újra kérdez
- **THEN** a szerver fal-hibával elutasítja, és a kérdés nem kerül a naplóba

#### Scenario: Újragenerálás fogy
- **WHEN** a diák az első kérdésére „Másik megfogalmazás”-t kér
- **THEN** a kérdésszáma kettő lesz

### Requirement: Fal a diák felületén
A diák kurzusoldala a hozzáférését SHALL élőben olvasni, és mutatni a hátralévő
ingyenes kérdések számát (próbánál) vagy az aktív hozzáférést. Ha a próba
kerete elfogyott, a kérdezőmező helyén a fal SHALL megjelenni azzal, hogy a
folytatáshoz a tanárnak kell szólni, és a korábbi válaszok alatt a „Másik
megfogalmazás” és az „Újrapróbálás” művelet MUST NOT megjelenni. Amint a
hozzáférés aktív lesz, a fal eltűnik, és a műveletek újra megjelennek,
újratöltés nélkül.

#### Scenario: Harmadik kérdés után
- **WHEN** a diák feltette a harmadik ingyenes kérdését
- **THEN** a kérdezőmező helyén a fal jelenik meg

#### Scenario: Újrakérés a falnál
- **WHEN** a falnál álló diák a korábbi válaszait nézi
- **THEN** egyik válasz alatt sincs „Másik megfogalmazás”, és a hibás válasz alatt sincs „Újrapróbálás”

#### Scenario: Aktiválás után
- **WHEN** a tanár aktívra kapcsolja a falnál álló diákot
- **THEN** a diák oldalán a fal eltűnik, és a válaszok alatt újra ott a „Másik megfogalmazás”

### Requirement: Diáklista a tanárnak
A tanári kurzusoldal SHALL élőben listázni a kurzus összes hozzáférését a
megadás sorrendjében: cím, állapot (próba, aktív, visszavonva), kérdésszám
(próbánál a kerettel), és „A falnál” jelzés, ha a próba kerete elfogyott.
Próbánál aktiválást, nem visszavont hozzáférésnél visszavonást, visszavontnál
visszaállítást SHALL kínálni.

#### Scenario: Falnál álló diák
- **WHEN** egy próba-hozzáférésű diák elérte a keretet
- **THEN** a tanár listájában „A falnál” jelzést és „Fizetett → aktív” műveletet lát
