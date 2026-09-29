# 2C — a board diagramjai és a provenance megjelenítése

Worktree: `../kotta-k1-ui`, ág `spike/k1-ui` (az 1. szakasz fejéről; a `ui/` board már csak a spec-listát mutatja). Csak ott dolgozz; commitolj; ne pusholj. `src/cli/index.ts`-hez ne nyúlj; `src/commands/ui.ts`-ben csak adatvégpontok.

Olvasd előbb: a change `specs/model-views/spec.md`, `tasks.md` 6.; `ui/src/App.tsx`, `src/commands/ui.ts` (hogyan szolgálja ki a boardot és milyen JSON-t ad), `src/spec/registry.ts`, `tests/ui/*.test.tsx`; és `briefs/README.md` közös szerződéseit.

## A prototípusok, amiket Reactben újra kell írni

- **Use case diagram:** Mermaid `flowchart LR`, három subgraph (Szereplők, Használati esetek, Célok); szereplő→use case folytonos él a use case `actor` mezőjéből, use case→cél szaggatott él a `goal` mezőből; id-k rövidítve (`A0/U0/G0`), címek feliratként, idézőjel és zárójel Mermaid-biztosan escape-elve.
- **Story map:** user storyk szereplőnként csoportosítva, kártyánként Story és Value.
- **Entitás-térkép:** `flowchart LR`; él két entitás között, ha az egyik Meaning/Attributes/Invariants szövege említi a másik címének tövét — a felület mondja ki, hogy ezek az élek a prózából vannak kiolvasva, nem típusos élekből.
- **Állapotgépek:** `stateDiagram-v2`, `direction LR`; az átmenetek a `## Transitions` szakaszból: `- **A → B**: miért` vagy `A → B: miért` alakú sorok, `|` és `/` elválasztott forrás/cél, `(none) → X` kezdő pszeudoállapot, végállapot a „terminal”/„végállapot” mondatból; ha nincs gépileg olvasható átmenet, a szöveg jelenik meg a „a spec ezt prózában írja le, gépileg nem rajzolható” megjegyzéssel.

## Feladat

1. **Négy diagram-nézet** fülként a spec-lista mellett: Használati esetek, Történetek, Entitások, Állapotgépek. Mermaid kliensoldalon (`mermaid` rögzített verzióval a board függőségei közt; a bundle maradjon ésszerű). Minden diagram `overflow-x: auto` konténerben. Alatta a nézet node-listája lenyitható részletekkel (szakaszok, élek linkként).
2. **Provenance-jelölés** a README szerződése szerint: `level` badge (kimondott / részben következtetett / kitalált), `decided_by` badge (te mondtad / gép javasolta, te jóváhagytad / a gép döntötte el). Diagramon: kimondott = folytonos keret, részben következtetett = szaggatott borostyán, kitalált = szaggatott piros (`classDef`). Provenance nélküli node badge nélkül. Fejléc-összesítés és szűrő: „csak amit a gép döntött el” — ez az átnézési lista.
3. **Node-tól a narratíváig:** a node fiókja mutatja a `provenance.quote`-ot és a `sources`-t; ha egy forrás `openspec/changes/**` alatti fájlt nevez meg (`conversation.md`, `proposal.md`), a szerver csak olvasva kiszolgálja, és a fiók a hivatkozott szakaszra linkel/beágyazza. Kis, csak olvasó végpont a `src/commands/ui.ts`-ben a kiszolgált workspace-gyökér `openspec/` mappájára, path-traversal ellen védve.
4. **Képesség-csoportosítás:** ha a node-ok `capability:` mezőt hordoznak, a use case diagram és az entitás-térkép képességenként subgraph-okba rendeződik; különben egy csoport.
5. **Nincs folyamat-nézet:** a UI-ban és tesztjeiben ne maradjon task, batch, claim, jóváhagyási sor.
6. **Téma és elrendezés** a meglévő board tokenjeivel, világos és sötét; az axe-alapú akadálymentességi tesztminta minden új nézetre. Tesztek (vitest + Testing Library): mindegyik nézet renderel egy ~15 node-os fixture workspace-ből; provenance badge-ek és szűrő; állapotgép-parszolás (rajzolható és nem); a narratíva-végpont útvonal-biztonsága.
7. `npm run typecheck`, `npm test`, `npm run build` (a board bundle-lel) zöld.

Minden tisztázatlan pont a change `DECISIONS.md`-jébe. Zárójelentés magyarul, tömören: nézetek, a diagramok építése és ami nem rajzolható, a provenance megjelenítése, a narratíva-végpont és biztonsága, bundle-méret, tesztszámok, typecheck/build, commitok, DECISIONS-bejegyzések.
