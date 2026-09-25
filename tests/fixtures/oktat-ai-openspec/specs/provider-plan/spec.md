# provider-plan Specification

## Purpose
A szolgáltató havidíjas csomagot kap, amelyet mérünk, de soha nem vágunk el:
ez a képesség rögzíti a szolgáltató kézi felvételét, a csomagot, a havi
mérést és a keret fölötti figyelmeztetést.

## Requirements

### Requirement: Szolgáltató kézi felvétele
Szolgáltatót SHALL csak a platform-admin venni fel, a beállított admin
tokennel. Ha nincs admin token beállítva, vagy a kapott token nem egyezik, a
szerver MUST „admin token szükséges” hibával elutasítani. A felvételhez
érvényes, szabad slug, nem üres név és érvényes e-mail-cím kell. A szolgáltató
aktív állapotban jön létre; a megadott cím a tulajdonos tanár; a válasz a
tanári felület linkjét adja.

#### Scenario: Sikeres felvétel
- **WHEN** az admin érvényes tokennel felveszi a `kovacs` szolgáltatót a `tanar@example.hu` címmel
- **THEN** a szolgáltató aktív, a cím tanárként be tud lépni, és a válaszban ott a `/kovacs/tanar` link

#### Scenario: Foglalt slug
- **WHEN** a slugon már van szolgáltató
- **THEN** a felvétel hibával elutasul

#### Scenario: Token nélkül
- **WHEN** a hívás nem hozza a helyes admin tokent
- **THEN** a szerver „permission-denied” hibát ad

### Requirement: Csomag
Minden szolgáltatónak SHALL csomagja lenni: a benne foglalt aktív
beiratkozások száma, a beiratkozásonkénti kérdéskeret és a feltöltött oldalak
kerete. Ha a felvételkor nincs megadva, az alapérték a beállításból jön
(alapból 30 beiratkozás, 40 kérdés beiratkozásonként, 500 oldal). A csomagban
foglalt havi kérdésszám a beiratkozások és a beiratkozásonkénti keret szorzata.

#### Scenario: Alapértelmezett csomag
- **WHEN** a szolgáltatót csomagadatok nélkül veszik fel
- **THEN** a csomag 30 beiratkozás, 1200 havi kérdés és 500 oldal

### Requirement: Havi mérés
A szerver a szolgáltató használatát SHALL naptári hónaponként (UTC, `ÉÉÉÉ-HH`)
mérni:
- **kérdés**: diák minden kérdése és újragenerálása a feltevés pillanatában; a tanár saját tesztje nem számít;
- **token**: minden válasz (a tanári tesztet is beleértve) input- és outputtokenje a válasz végén;
- **oldal** és **képi oldal**: egy dokumentum összes egysége, illetve a képi feldolgozásra küldött egységei, egyszer, amikor a dokumentum feldolgozása befejeződik; hang- és videóanyag darabjai nem oldalak;
- **perc**: egy hang- vagy videóanyag feldolgozott hossza percben (felfelé kerekítve), egyszer, amikor a feldolgozása befejeződik.
Az aktív beiratkozások száma folyó számláló, nem havi.

#### Scenario: Diákkérdés számítása
- **WHEN** egy diák kérdést tesz fel, és a válasz hibára fut
- **THEN** a havi kérdésszám akkor is eggyel nő

#### Scenario: Tanári teszt
- **WHEN** a tanár a saját teszt-chatjében kérdez
- **THEN** a havi kérdésszám nem nő, a tokenfogyás igen

#### Scenario: Felvétel percei
- **WHEN** egy 90 perc 20 másodperces videó feldolgozása befejeződik
- **THEN** a hónap perceinek száma 91-gyel nő, az oldalszám nem változik

### Requirement: Keret fölött jelzés, nem elvágás
A szerver SHALL keret fölöttinek tekinteni a hónapot, ha az aktív
beiratkozások száma meghaladja a csomagét, vagy a havi kérdésszám a csomagban
foglaltat, vagy a havi oldalszám az oldalkeretet, vagy a havi percszám a
perckeretet (alapból 600 perc). Keret fölött senkit MUST NOT elvágni: a kérdés,
a feltöltés és az aktiválás ugyanúgy működik.

#### Scenario: Kérdéskeret túllépése
- **WHEN** a havi kérdésszám a csomagban foglalt fölé ér
- **THEN** a diákok továbbra is kérdezhetnek

#### Scenario: Perckeret túllépése
- **WHEN** a havi percszám a perckeret fölé ér
- **THEN** a szolgáltató egy perc-értesítést kap, és a feltöltés továbbra is működik

### Requirement: Egyszeri figyelmeztetés
Minden kérdés vége, minden oldalkönyvelés és minden aktiválás után a szerver
SHALL ellenőrizni a keretet, és minden túllépési fajtához (beiratkozás, kérdés,
oldal) hónaponként legfeljebb egy értesítést létrehozni a szolgáltatónál. Egy
új értesítés létrehozásakor SHALL egy levelet is küldeni a szolgáltató címére
„keretfigyelmeztetés” tárggyal; ugyanarra a fajtára és hónapra MUST NOT
másodszor küldeni.

#### Scenario: Ismételt túllépés egy hónapon belül
- **WHEN** a kérdéskeret túllépése után újabb kérdések érkeznek ugyanabban a hónapban
- **THEN** a szolgáltató csak egy kérdés-értesítést és egy levelet kap

#### Scenario: Új hónap
- **WHEN** a következő hónapban is túllépés történik
- **THEN** új értesítés és új levél készül

### Requirement: Csomag a tanári felületen
A tanári áttekintés SHALL élőben mutatni a folyó hónap használatát: aktív
hozzáférés a csomaghoz képest, diákkérdés a csomagban foglalthoz képest,
feltöltött oldal az oldalkerethez képest (a képi oldalak számával),
feldolgozott perc a perckerethez képest, és a tokenfogyást keret nélkül. Ha
bármelyik keret túllépett, a felület SHALL kimondani, hogy senkit nem vágunk el,
és mutatni a hónap legfeljebb három legfrissebb értesítését.

#### Scenario: Túllépés a felületen
- **WHEN** a hónap oldalszáma meghaladja a keretet
- **THEN** a tanár áttekintésén megjelenik a keret fölötti jelzés az oldal-értesítéssel

### Requirement: Fordítás mérése
A szerver SHALL a lefordított egységek számát a szolgáltató havi használatán
(„fordított oldal”) könyvelni, a fordítás elkészültekor, nyelvenként egyszer
egységenként. A tanári áttekintés a fordított oldalak számát keret nélkül
SHALL mutatni.

#### Scenario: Görög anyag fordítása
- **WHEN** a görög Odüsszeia 333 oldala magyarra fordítódik
- **THEN** a hónap fordított oldalainak száma 333-mal nő, és ez az áttekintésen látszik

### Requirement: Az ellenőrző szolgáltató nem számít a mérésbe
Az élesítés utáni próba szolgáltatójának használata (kérdés, token, oldal,
képi oldal, fordított oldal, perc) MUST NOT a szolgáltatók havi mérésében és a
keret-figyelmeztetésekben megjelenni, és a próba MUST NOT levelet küldeni.

#### Scenario: Próba a deploy után
- **WHEN** az élesítés utáni próba lefut, és kérdést tesz fel a saját kurzusán
- **THEN** a próbaszolgáltató kérdései és tokenjei nem keverednek a valódi szolgáltatók mérésébe, és keret-levél nem megy ki
