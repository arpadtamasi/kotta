# A minőségi elvárásokat Kotta észreveszi és felveszi

## Why

A board hierarchiájának tervezésekor (spec-hierarchiaja, 2026-10-09) az ágens tíz minőségi elvárást
— 11px-es szöveg, alacsony ragadós fejléc, a szövegben is kereső keresés, hétköznapi címkék —
build-jegyzetként, prózában hagyott a proposalban, „csak megjelenítésnek” ítélve. rp megkérdezte:
„miért nem véd ezeket semmi?”. A válasz: a proposal az archiválás után történet, egy jegyzetre semmi
nem hivatkozhat, és a `kotta gap` nem számolja. A tízből négy minőségi elvárás lett.

rp kérése: „hogy a kotta figyeljen rájuk és ha felmerül egy ilyen, jelezze és vegye fel”.

A Kotta saját specjében eddig négy minőségi elvárás volt, egyik sem a board olvashatóságáról: a
minőséget gyakran kimondják, és ritkán rögzítik.

## What changes

- **A quality requirement is recorded where it is said** (új): ha a beszélgetés vagy a proposal
  azt mondja, mennyire legyen olvasható, megtalálható, gyors, stabil, akadálymentes a termék, az
  ágens kimondja, hogy ez minőségi elvárás, és minőségi elvárásként, válasszal és mérőszámmal
  felveszi a change-be. Ha a mérőszámot senki nem mondta, nyitott döntésként kérdezi meg, nem
  választ csendben. Prózai build-jegyzetként nem hagyhatja.
- **The plan names what the proposal promises without a node** (új): a `kotta plan` jelöltként
  listázza a proposal *What changes* részének minden olyan pontját, amely nem nevez meg csomópontot,
  és megkérdezi: ígéret-e (és akkor csomópont kell), vagy ígéretet nem érintő munka. A kaput nem
  akasztja meg.
- Két példa, a spec-hierarchiaja esetén.

Ehhez a buildben a szállított szabályfájl (`templates/AGENTS.md`), a `plan-change` és a
`quality-scenarios` skill szövege és a `kotta plan` változik.

## Open decisions

Nincs. A szándékot rp mondta ki; a mechanikus jelzés formája az ágensé, és a kapunál listán van.
