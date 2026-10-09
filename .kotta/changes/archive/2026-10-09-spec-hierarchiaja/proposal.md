# A spec hierarchiája: céltól a példáig

## Why

Az intimity specifikációját (egy importált, 226 csomópontos modell) végignézve az ágens szóban jól el
tudta mondani, mi az app: egy cél, egy menet (párosítás → osztás → titkos válasz → eredmény), és
körülötte változatok és kiegészítők. A specben ez a szerkezet nincs meg, és a boardon sem követhető:
„inkább az az érdekes, hogy az elmondásod jó volt, a hierarchia meg ezek szerint más” (rp,
2026-10-09).

Két ok rakódik egymásra:

- **A séma** nem tudja kifejezni.
  - A cél formának nincs „ezt a célt szolgálja” éle, így az import minden képességből egy egymás
    melletti célt csinál.
  - A menet négy lépése négy különböző célt szolgál, így egy célon belüli sorrend sem írná le.
- **A board** azt is elveszíti, ami megvan. Ezt egy kétágenses dizájnkritika mérte (21/40):
  - a Hierarchia nézet a szereplőtől indul, a célok kimaradnak belőle, a példák csak számok;
  - a használati esetek ábécérendben állnak;
  - a Használati esetek ábra nem rajzolja a «tartalmazza» és «kiterjeszti» éleket;
  - a fiókban nyers mezőnevek állnak, fordított irányban;
  - üres elfogadott spec mellett a nyitóképernyő „0 nodes”-t mutat;
  - a szerkezet hiányairól a board hallgat.

Az első tervet két kritikus nem fogadta el javításnak. A menetet egy `follows` éllel, célon belül
rendezte volna sorba, és ez a több célon átívelő menetet nem mutatja meg. Ez a változat erre a
bírálatra és rp döntéseire épül.

## What changes

**A séma**
- **A goal can serve a goal** (új): a szállított cél forma opcionális, kör nélküli `serves` éle.
- **A summary use case tells a journey** (új): egy összefoglaló szintű használati eset `includes`
  listája a menet lépései, sorrendben. Új él nincs, a meglévő `level` és `includes` kap jelentést.
  Egy lépést kiterjesztő eset a menet változata. Ami egyetlen menetben sincs benne és egy lépést sem
  terjeszt ki, az kiegészítő. A lista sorrendjét Kotta parancs nem rendezi át. Kiegészítő és
  infrastruktúra a menetbe nem tartozó célok saját `serves`-beágyazásával válik el, új mező nélkül.

**A board**
- **The board shows the specification as a tree** (változik): a fa a célból indul, a szereplő
  szerinti elrendezés mellette marad.
  - Fölötte áll a menet sávja; az összefoglaló eset sávként és egy sorként látszik a célja alatt.
  - A célok a menet szerinti sorrendben jönnek (a változat célja közvetlenül a változtatott lépés
    célja után), a menetbe nem tartozók külön, utánuk, saját beágyazásukkal.
  - Alattuk a használati esetek, a követelmények, a példák.
  - A több helyen álló használati eset egyszer, teljes alakban látszik, máshol hivatkozásként.
- **The tree names the gaps in its structure** (új): a fejléc megszámolja és megnevezi a szerkezeti
  hiányokat, és megmondja, mivel zárhatók (egy change-ben).
- **The board names a relation in words** (új): a fiók elöl a saját szöveget mutatja, utána a helyet
  a fában, utána a kapcsolatokat a saját irányukban, szavakkal. A megnyitott út a címsorban áll.
- **The use-case diagram draws how use cases relate** (új): rendes UML használatieset-jelölés —
  pálcikaember, ellipszis, rendszerhatár, szaggatott «include» és «extend» nyíl. A célok elöl, a
  jelölésen kívül állnak.
- **The board says what the human decided** (új): egy jóváhagyott change megmondja, mit fed le az
  igen — ki, mikor, az egész delta, ebből mennyit döntött ember és mennyit az ágens egyedül —, és
  megnyitható a lista, amit a kapu mutatott. Egy elfogadott csomópont megnevezi a change-et, amely
  behozta, és a saját jelölését. Az ágens által eldöntött csomópont soha nem látszik egyenként
  átnézettnek.
- **The board shows what waits at the gate** (változik): üres elfogadott spec mellett a board az
  egyetlen nyitott change-en nyílik, több change esetén azok listáján.

- **A use case can be decomposed** (változik, csak a Scope): kimondja, hogy az `includes` sorrendje
  csak összefoglaló szinten jelent valamit.

**Minőségi elvárások** (új, négy; eddig a board olvashatóságára nem volt ilyen)
- **The board reads calmly:** ami minden soron egyforma, az egyszer, a csoportfejben áll; a rögzített
  fejléc legfeljebb 120 pixel, és nem nő, ha a proposal kinyílik; a származási összefoglaló kérésre
  nyílik.
- **Anything on the board can be found and linked:** a keresés a szövegben is keres; a nézet, a
  szűrők, a keresés és a nyitott csomópont a címsorban áll; `/`, Escape, nyilak; az ábra csak
  fókuszban vagy módosító billentyűvel nyeli el a görgetést.
- **The board speaks in plain words:** nincs nyers mezőnév vagy nagybetűs érték; a fül címe a Kotta
  és a projekt neve; a számok azt számolják, amit a nézet mutat; ugyanaz a fajta csomópont mindenhol
  ugyanaz a szó; a „ha elhagyjuk” kiírja, hogy szimuláció.
- **The view holds still:** az új nézet a tetején nyílik, a régi ott, ahol hagyták; „mindet kinyit /
  becsuk”; egy mozdulatos szűrőtörlés; előnézet egy kapcsolt csomópont fölött.

**A CLI**
- **Validate names a flat structure** (új): figyelmeztetés, ha több cél nem szolgál másikat, vagy
  egy szereplőnek nincs menete.
- **The import asks what its goals serve** (új): az import a proposal nyitott döntései közé írja,
  milyen célt szolgálnak a célok és mi a menet. Maga nem találja ki.

**Példák:** huszonegy új, az intimity specjén, és egy módosított (*The tree with the drop
highlight*). A bennük szereplő cél (*Find an evening both welcome*) és menet (*Spend an evening
together*) szemléltetés. Az intimity saját célját és menetét az intimityben, saját change-ben kell
eldönteni.

**A meglévő *Accessible web surfaces* ígéret alatt, új csomópont nélkül, a buildben megy:**
- a 9px-es címkék legalább 11px-esek lesznek;
- a keresőmező helyőrzőjének kontrasztja 4,5:1-re nő;
- a 820px alatti navigáció elérhető marad;
- a fa billentyűvel bejárható lesz.

**A build után ellenőrizni kell:**
- a hibás állapotokat (törött hivatkozás, olvashatatlan change), és hogy az üzenetük megmondja-e a
  teendőt;
- a 390px-es nézetet;
- a sötét módot;
- a Mermaid megjelenítést;
- az ábra elemeire kattintást.

Ezek a kritikából kimaradtak.

**Későbbre marad:** a board saját olvasási útmutatója és a címkék jelmagyarázata (rp: „várhat még”).

**Egy meglévő workspace** a `serves` élt úgy kapja meg, ahogy minden formaváltozást: egy change-en át,
amely a formát hordozza (*A form change goes through the gate*).

**Marad, ami volt:**
- a „ha elhagyjuk” kiemelés;
- az overall és a hely nélküli követelmények;
- a képesség mint szűrő;
- a board csak olvas.

## Open decisions

Nincs. rp 2026-10-09-én döntött:
- az irányról: „Séma + board együtt”;
- a terjedelemről: „Mind az öt”;
- a menet formájáról: „Összefoglaló eset”;
- a fa gyökeréről: „Igen, a célból induljon”;
- a bontásról: „Egy change marad”;
- a jóváhagyás láthatóságáról: „igen, fontos, nekem is hiányzott”;
- a jelölésről: „ahol meg van, ott rendes UML”;
- a többi heurisztikáról: 3–8 igen, a 9. meg kell nézni, a 10. várhat.

Ezeket strukturált kérdésekre adta, ezért a `conversation.md` nem tartalmazza őket. A részletek (élnév,
szavak, hiánylista, figyelmeztetések) az ágensé, és a kapunál listán vannak.
