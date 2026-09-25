# A bizonyíték kódból jön, nem a specifikáció másolatából

## Why

A `kotta gap` ma minden commitolt fájlt bizonyítéknak vesz, amely a `.kotta/` workspace-en kívül
van és nem egy csomag kiadott `kotta-spec/` mappája (`src/core/modules.ts`, `isEvidencePath`).
Az 1.0 óta azonban a repóban van egy másik hely, ahol a node-ok azonosítói szükségképpen
szerepelnek: az `openspec/` fa. Az archivált change `model/` könyvtára a node-ok másolata, az
`approval.yaml` a jóváhagyott delta id-jeit sorolja, és a generált narratív spec minden
követelmény alá `<!-- kotta: ID -->` kötést ír. Egyik sem arról szól, hogy a kód betartja az
ígéretet.

A 2026-09-25-i dokumentációírás közben a kaszinó-projekten mértük: a 184 elfogadott node
mindegyike „cited” szintű, miközben a kód egyetlen azonosítót sem nevez meg — minden bizonyíték
az `openspec/` alól jön. Ráadásul a generált spec útvonala `openspec/specs/...`, és a fájlosztályozó
a `specs/` könyvtárnevet tesztnek veszi, így a generált próza „teszt”-fájlként számít. A hiba a
modulbesorolást is torzítja: `modules.ts` ugyanezzel a szűrővel dönti el, melyik modul fájljai
hivatkoznak a node-ra, így az `openspec/` alatti említés a `(root)` álmodulba sorolja a node-ot.

Ugyanezen a napon került elő egy kisebb import-hiba: a `kotta import openspec` egy olyan
`## Purpose` szakaszból is célt vázol, amely csak a generátor „nincs cél-node” megjegyzését
tartalmazza. A megjegyzés nem szöveg; nem lehet belőle node.

## What Changes

- **A specifikáció bármely másolata nem bizonyíték.** A bizonyíték-szűrő kizárja az `openspec/`
  fát (change-ek, archívum, generált specek) ugyanúgy, ahogy ma a `kotta-spec/`-et. A szabály
  kimondva: bizonyíték az, ami az ígéretet betartja vagy ellenőrzi — kód, teszt, parancsdefiníció —,
  nem az, ami az ígéretet kimondja vagy másolja.
- **A teszt-osztályozás nem a `specs/` könyvtárnévre épül**, ha az útvonal az `openspec/` alatt van;
  a kizárás ezt magával hozza, a szabály pedig nevesíti.
- **A jelentés kimondja, mit nem számolt.** A `gap` (és `modules`) `--json` kimenete megnevezi a
  kizárt forrásokat, hogy a „miért none ez a node” kérdésre a jelentésből legyen válasz.
- **Az import nem vázol célt megjegyzésből.** Egy `## Purpose`, amelyben a megjegyzések levágása
  után nincs szöveg, nem ad goal-vázlatot; az import a figyelmeztetései közé írja, hogy a képességnek
  nincs kimondott célja, és a tervezés-fázis kérdez rá.

## Capabilities

### Modified Capabilities
- `evidence`: mi számít bizonyítéknak, és mi nem — a specifikáció másolatai kizárva.
- `migration`: az OpenSpec-import nem készít node-ot olyan szakaszból, amely csak megjegyzés.

## Impact

- `src/core/modules.ts` (`isEvidencePath`, a fájlosztályozás), `src/commands/gap.ts`,
  `src/commands/modules.ts`, `src/commands/import.ts`; tesztek a `tests/unit` és
  `tests/integration` alatt; `docs/modules-and-evidence.md` „Known limit” pontja törlendő.
- Viselkedésváltozás minden 1.0-s workspace-ben, ahol archivált change van: a `cited` szintű
  node-ok száma csökken — ez a helyes szám. A kaszinón várhatóan 184 → 0 cited, amíg a kód nem
  nevez meg azonosítót.
