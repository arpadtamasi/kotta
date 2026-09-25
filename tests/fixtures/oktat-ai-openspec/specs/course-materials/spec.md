# course-materials Specification

## Purpose
A tanár a saját anyagát tölti fel a kurzusra, és látja, hol tart a
feldolgozása: ez a képesség rögzíti a feltöltést, a duplikátumot, a levételt,
az anyagverziót és a feldolgozás látható állapotát.

## Requirements

### Requirement: Felhasználási nyilatkozat
A szerver MUST elutasítani a feltöltést, ha a hívás nem hozza a felhasználási
nyilatkozat elfogadását, és SHALL anyagonként rögzíteni az elfogadás idejét és
a feltöltő felhasználót. A felület a fájlválasztót SHALL letiltani, amíg a
nyilatkozatot (jogosultság a felhasználásra, szerzői jogi bejelentési cím) be
nem jelölték.

#### Scenario: Nyilatkozat nélkül
- **WHEN** a feltöltés nyilatkozat nélkül érkezik
- **THEN** a szerver „a feltöltéshez el kell fogadni a felhasználási nyilatkozatot” hibával elutasítja

### Requirement: Fájltípus és méret
Feltölthető anyag SHALL a PDF, DOCX, PPTX és EPUB dokumentum, a hang (MP3, M4A,
WAV, OGG, WEBM, FLAC) és a videó (MP4, WEBM). A fajtát a megadott tartalomtípus
adja, ha támogatott, különben a fájlnév kiterjesztése; más fájlt a szerver MUST
elutasítani. A dokumentum a beállított dokumentum-korlátnál (alapból 20 MB), az
EPUB a beállított epub-korlátnál (alapból 50 MB), a hang és a videó a
beállított médiakorlátnál (alapból 500 MB) nagyobb nem lehet, különben „a fájl
túl nagy” hibával MUST elutasulni; a beállított hossznál (alapból 180 perc)
hosszabb felvétel feldolgozása „a felvétel túl hosszú” okkal bukik el. Az üres
fájlt és azt, amelynek feldolgozása már induláskor elbukik, „nem dolgozható
fel” hibával kell elutasítani.

#### Scenario: Nem támogatott típus
- **WHEN** a tanár `.txt` fájlt tölt fel
- **THEN** a feltöltés elutasul

#### Scenario: Sérült fájl
- **WHEN** a PDF-nek jelölt fájl tartalma nem PDF
- **THEN** a feltöltés „a fájl nem dolgozható fel (üres vagy sérült)” hibával elutasul

#### Scenario: Előadás-felvétel
- **WHEN** a tanár egy 300 MB-os, 90 perces MP4-et tölt fel
- **THEN** a feltöltés elfogadott, és a feldolgozás a háttérben elindul

#### Scenario: Túl nagy dokumentum
- **WHEN** a tanár egy 30 MB-os PDF-et tölt fel
- **THEN** a feltöltés „a fájl túl nagy” hibával elutasul

#### Scenario: Képes könyv epubként
- **WHEN** a tanár egy 23 MB-os epubot tölt fel
- **THEN** a feltöltés elfogadott

### Requirement: Feltöltés átmeneti helyről
A felület a fájlt SHALL előbb a felhasználó átmeneti fájltár-helyére tölteni
látható haladással, majd a szervernek csak az útvonalat átadni. A szerver MUST
elutasítani az útvonalat, ha az nem a hívó saját átmeneti helye, vagy `..`-t
tartalmaz, és SHALL törölni az átmeneti fájlt a hívás végén, sikertől
függetlenül. A hívás a dokumentum és az anyag felvétele és a feldolgozás
ütemezése után visszatér; a feldolgozást nem várja meg.

#### Scenario: Idegen átmeneti útvonal
- **WHEN** a hívás egy másik felhasználó átmeneti fájljára hivatkozik
- **THEN** a szerver „ez a feltöltés nem a tiéd” tiltással elutasítja

#### Scenario: Gyors visszatérés
- **WHEN** a tanár egy nagy PDF-et tölt fel
- **THEN** a hívás a feldolgozás vége előtt visszatér, és a felület a haladást élőben mutatja

### Requirement: Azonos tartalom egyszer
Egy szolgáltatónál azonos bájttartalmú fájl SHALL ugyanazt a dokumentumot
jelenteni, és nem indíthat új feldolgozást, hacsak a korábbi el nem bukott.
Ha ugyanaz a dokumentum már a kurzus élő anyaga, a feltöltés MUST NOT új anyagot
létrehozni vagy az anyagverziót növelni, és a válasz duplikátumot jelez. Ha a
dokumentum másik kurzuson van, ehhez a kurzushoz új anyagként kerül fel.

#### Scenario: Ugyanaz a fájl újra ugyanarra a kurzusra
- **WHEN** a tanár ugyanazt a DOCX-et másodszor tölti fel a kurzusra
- **THEN** a válasz duplikátumot jelez, az anyaglista és az anyagverzió nem változik

#### Scenario: Elbukott dokumentum újra
- **WHEN** egy korábban elbukott feldolgozású fájlt töltenek fel újra
- **THEN** a feldolgozás újraindul

### Requirement: Anyagverzió
Minden új anyag felvétele és minden levétel SHALL eggyel növelni a kurzus
anyagverzióját, és frissíteni az anyag utolsó módosításának idejét. A kurzus
anyagai a kurzus dokumentumlistáját alkotják.

#### Scenario: Új anyag
- **WHEN** a tanár új anyagot tölt fel a 2-es anyagverziójú kurzusra
- **THEN** az anyagverzió 3 lesz

### Requirement: Anyag levétele
A tanár SHALL levenni egy anyagot a kurzusról. A levett anyag levételi időt
kap, kikerül a kurzus dokumentumlistájából, és a listákból eltűnik; nem
létező vagy már levett anyag levétele MUST „nincs ilyen anyag” hibát adni. Ha
a kurzus élő, és a levétel után nem maradna kész egységű anyaga, a felület a
levétel előtt SHALL figyelmeztetni, hogy a kurzus élő marad, de a diákok nem
kérdezhetnek, és megerősítést kérni; más esetben a levétel megerősítés nélküli.
A levétel nem változtat a kurzus állapotán. Az anyag a levétel pillanatában
SHALL kikerülni a kurzus keresőindexéből; a dokumentum mesterpéldánya, tárolt
adatai és az eredeti fájl megmaradnak, és a szolgáltató más kurzusain az anyag
továbbra is kereshető.

#### Scenario: Közös dokumentum levétele egy kurzusról
- **WHEN** a tanár levesz egy anyagot, amelynek dokumentuma egy másik kurzuson is szerepel
- **THEN** a másik kurzuson a dokumentum továbbra is kereshető

#### Scenario: Élő kurzus utolsó kész anyaga
- **WHEN** a tanár egy élő kurzus egyetlen kész anyagát venné le
- **THEN** a felület figyelmeztet, hogy a diákok nem kérdezhetnek majd, megerősítés után a levétel megtörténik, és a kurzus élő marad

#### Scenario: Nem utolsó anyag
- **WHEN** a tanár egy élő kurzusról levesz egy anyagot, és marad másik kész anyag
- **THEN** a levétel figyelmeztetés nélkül megtörténik

### Requirement: Anyaglista és feldolgozási állapot
A tanári kurzusoldal SHALL élőben listázni a kurzus élő anyagait feltöltés
szerint, és mindegyiknél a következő állapotot mutatni:
- nincs még dokumentum: „Várakozik”;
- a feldolgozás kész, de a kereshető egységek száma kisebb a kész egységekénél: „Kereshetővé tétel”;
- kész: a kész egységek száma;
- részben kész: kész/összes egység és a hibásak száma;
- sikertelen: a hibakód;
- egyébként a fázis (előkészítés, szövegkinyerés, képi feldolgozás, indexelés) és a százalék.
Ha a folytatás ütemezése nem sikerült, az anyag „Elakadt” jelzést SHALL kapni
az okkal. A sorban a felület SHALL mutatni a felismert címet (ennek híján a
fájlnevet), a szerzőket, a fejezetszámot, a méretet, a feltöltés napját, az
oldalszámot, a képi oldalak számát, a még kötegre váró oldalakat, és azt, ha a
PDF-ben nincs nyomtatott oldalszám.

#### Scenario: Feltöltés után
- **WHEN** a tanár feltölt egy DOCX-et
- **THEN** a sor a feltöltési haladás után a feldolgozás fázisát, végül a kész egységek számát mutatja újratöltés nélkül

#### Scenario: Kész, de még nem kereshető
- **WHEN** a feldolgozás befejeződött, de az index még nincs kitéve
- **THEN** a sor „Kereshetővé tétel” állapotot mutat

### Requirement: Feltöltési hiba a felületen
A felület SHALL a feltöltés alatt álló fájlt külön sorban mutatni százalékkal,
majd „Feldolgozás indul” jelzéssel; hiba esetén a hibaüzenetet és elvetési
lehetőséget. A felület a bejelentkezés hiányát, a nem támogatott típust és a
20 MB fölötti méretet a feltöltés előtt SHALL kimondani.

#### Scenario: Túl nagy fájl a felületen
- **WHEN** a tanár 25 MB-os PDF-et választ
- **THEN** a sor „A fájl nagyobb 20 MB-nál.” hibát mutat, és nem indul feltöltés

### Requirement: Üzemeltetői eltávolítás bejelentés alapján
A platform-admin SHALL egy szolgáltató egy dokumentumát a tanártól
függetlenül eltávolítani, a beállított admin tokennel és a bejelentés
hivatkozásával. Helyes token nélkül a kérés MUST „admin token szükséges”
hibával elutasulni. Eltávolításkor a dokumentum MUST lekerülni minden kurzusról
(a levételhez hasonlóan, anyagverzió-növeléssel), kikerülni a keresőindexből,
és törlődnie kell a dokumentumnak, az egységeinek, a köteg-rekordjainak, az
eredeti fájlnak és az oldalképeinek. A dokumentumról SHALL eltávolítási nyom
maradni (időpont, bejelentés hivatkozása), a tartalma nélkül. A már elkészült
válaszok szövege és a kérdésnapló bejegyzései MUST NOT változni. Ugyanaz a
tartalom eltávolítás után újra feltölthető; ilyenkor új feldolgozás indul, a
korábbi eredmény nélkül.

#### Scenario: Bejelentett tankönyv
- **WHEN** az admin eltávolít egy dokumentumot, amely a szolgáltató két kurzusán is szerepel
- **THEN** a dokumentum egyik kurzuson sem kereshető, a szövege, az eredeti fájl és az oldalképek törlődnek, és mindkét kurzus anyagverziója nő

#### Scenario: Régi hivatkozás
- **WHEN** egy diák egy eltávolított dokumentumra mutató régi hivatkozásra kattint
- **THEN** a felület kimondja, hogy a forrás már nem része a kurzusnak, a válasz megmarad

#### Scenario: Korábbi válaszok
- **WHEN** egy eltávolított dokumentumból korábban idéző válasz van egy diák beszélgetésében
- **THEN** a válasz szövege és a naplóbejegyzés változatlan marad, csak a hivatkozása nem nyílik meg

#### Scenario: Újrafeltöltés eltávolítás után
- **WHEN** a tanár ugyanazt a fájlt tölti fel újra, amelyet bejelentés alapján eltávolítottunk
- **THEN** a feltöltés elfogadott, és a feldolgozás elejéről indul

#### Scenario: Token nélkül
- **WHEN** a kérés nem hozza a helyes admin tokent
- **THEN** a szerver „permission-denied” hibát ad, és semmi nem törlődik

### Requirement: Eltávolítás a tanár felé
A tanár SHALL látni az anyaglistán, hogy egy anyagát bejelentés alapján
eltávolítottuk (fájlnév és időpont), és a szolgáltatónál a felületen látható
értesítés SHALL keletkezni róla; levél MUST NOT menni.

#### Scenario: Tanár a kurzusoldalon
- **WHEN** a tanár megnyitja egy olyan kurzus anyaglistáját, amelyről anyagot távolítottunk el
- **THEN** az anyag „bejelentés alapján eltávolítva” jelzéssel látszik, és letölteni, kérdezni belőle nem lehet

### Requirement: Képi mód feltöltéskor
A feltöltő felület SHALL felkínálni a képi módot (Automatikus, Minden oldal
képként, Csak szöveg) rövid magyarázattal, alapból Automatikus értékkel; a mód
a feltöltéssel a szerverre kerül, és a dokumentumon rögzül. Ismeretlen módot a
szerver MUST elutasítani. Ha ugyanaz a tartalom már fel van dolgozva, a
feltöltés duplikátum marad, és a korábbi mód nem változik; a felület ilyenkor
az újrafeldolgozást ajánlja. Az anyaglista SHALL mutatni az anyag képi módját.

#### Scenario: Mód a feltöltésnél
- **WHEN** a tanár „Minden oldal képként” módot választ, és feltölt egy PDF-et
- **THEN** a dokumentum ezzel a móddal dolgozódik fel, és az anyaglistán ez látszik

#### Scenario: Ismeretlen mód
- **WHEN** a hívás `mind` módot küld
- **THEN** a szerver érvénytelen bemenetként elutasítja

### Requirement: Újrafeldolgozás
A tanár SHALL egy anyagot újrafeldolgoztatni, választott képi móddal. Az
újrafeldolgozás a dokumentum egységeit, képi köteg-rekordjait, oldalképeit és
keresőindexét eldobja, és a feldolgozást az elejéről indítja; a dokumentum
azonosítója, a kurzusok anyagai és a korábbi válaszok megmaradnak, a régi
hivatkozások a feldolgozás után ugyanarra az oldalra mutatnak. Futó
feldolgozás közben az újrafeldolgozás MUST elutasulni. Az újrafeldolgozott
oldalak a hónap használatára újra könyvelődnek.

#### Scenario: Képregény újra
- **WHEN** a tanár a kész, automatikus módú képregényt „Minden oldal képként” móddal újrafeldolgoztatja
- **THEN** a dokumentum feldolgozás alatt áll, majd minden oldala képi leírással kereshető

#### Scenario: Feldolgozás közben
- **WHEN** a dokumentum még feldolgozás alatt áll
- **THEN** az újrafeldolgozás „a feldolgozás még fut” hibával elutasul

### Requirement: Nyelv és fordítás az anyaglistán
Az anyaglista SHALL mutatni az anyag felismert nyelvét, és ha az eltér a kurzus
nyelvétől, a kurzus nyelvű fordítás állását (lefordított/összes egység, illetve
„fordítás kész”). A kurzus nyelve a kurzus fejlécében SHALL látszani és ott
módosítható.

#### Scenario: Fordítás folyamatban
- **WHEN** a görög Odüsszeia fordítása a 120. oldalnál tart egy magyar kurzuson
- **THEN** az anyag sora „görög · fordítás 120/333” jelzést mutat

### Requirement: Felvétel az anyaglistán
Hang- vagy videóanyagnál az anyaglista SHALL mutatni a felvétel hosszát és az
átirat állását (kész darabok / összes darab), és a sikertelen feldolgozás
okát (nincs hangsáv, túl hosszú, nincs beszéd).

#### Scenario: Átírás közben
- **WHEN** egy 90 perces felvétel 18 darabjából 7 kész
- **THEN** a sor a hosszt (1:30:00) és a „7/18 darab” állást mutatja

### Requirement: Anyagnézet a tanárnak
A szolgáltató tanára SHALL megnyitni egy anyag feldolgozott egységeinek
listáját a kurzus bármely állapotában. A lista egységenként a megjelenített
helyet (oldal, szakasz, dia vagy időtartomány), a szöveg rövid részletét és a
jelöléseket mutatja: képi feldolgozáson átment, üres, hibás, fordításra vár.
Egy egységet megnyitva a tanár ugyanazt látja, amit a diák a forrásnézetben: a
szöveget, az oldalképet, felvételnél az átiratot és a lejátszót. A gépi
fordítás itt sem látszik: csak a megtalálást szolgálja. Diák MUST NOT elérni az anyagnézetet.

#### Scenario: Képregény ellenőrzése
- **WHEN** a tanár megnyitja a képregény anyagnézetét
- **THEN** mind a négy oldalt látja a helyével és a leírás részletével, és látszik, melyik ment képi feldolgozásra

#### Scenario: Egység megnyitása
- **WHEN** a tanár rákattint egy egységre
- **THEN** a szöveg, és ha van, az oldalkép vagy az átirat és a lejátszó is megjelenik

### Requirement: Anyag állapotának összefoglalója
Az anyagnézet SHALL összefoglalni az anyag állapotát: a kész, az üres és a
hibás egységek számát, a képi feldolgozáson átment egységek számát, és ha a
kurzus nyelve eltér az anyag nyelvétől, a fordítás állását. A tanár egy
kapcsolóval SHALL csak a problémás (üres vagy hibás) egységeket látni. Ha
van üres egység, a nézet kimondja a lehetséges okot (képi feldolgozás nélküli
szkennelt oldal), és az újrafeldolgozást ajánlja.

#### Scenario: Szkennelt könyv kulcs nélkül
- **WHEN** egy szkennelt PDF minden oldala üres maradt
- **THEN** az összefoglaló ezt kimondja, és az újrafeldolgozásra mutat

#### Scenario: Problémás egységek szűrése
- **WHEN** a tanár egy 333 oldalas anyagnál a problémás egységekre szűr
- **THEN** csak az üres és a hibás egységek maradnak a listában
