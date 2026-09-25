---
id: T-01kz1xrxw4aheeqv1ca0bv0fcq
title: A board atallitasa a Kotta Console v2 tervre
status: done
origin: human
types:
  - feature
profiles:
  - ui
  - workflow
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: feat/T-01kz1xrxw4aheeqv1ca0bv0fcq-a-board-atallitasa-a-kotta-console-v2-tervre
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
assigned_agent: claude
resolution: completed
---
# T-01kz1xrxw4aheeqv1ca0bv0fcq — A board átállítása a Kotta Console v2 tervre

## Outcome

The board is the Kotta Console v2 design: a dark rail carrying the mark and the derivation chain, a Home screen that answers "what waits on me, what doesn't add up, what runs next", and the existing views restyled onto the Modernist system. It states plainly that it does not write, and it does not.

## User goal

Answer "where do I need to decide, and what is not true" in one glance, then browse the corpus when looking for something specific. Not to move cards — the CLI and the agents do that.

## Entry point

`a-team ui` opens the board (since T-01kz1g2vyhfn5ezzvvyzn4w2gr it opens the browser itself). Home is the landing view. The rail switches views; nothing else navigates.

## Default state

Home, showing three bands in order: **Waiting on you** (the decision queues), **Doesn't add up** (contradictions), **What runs next?** (the menu of defined backlog contracts, with a `Run next →` affordance that names the CLI command rather than running it).

If work is running, the rail's `Running` entry carries a live count and `Watch →` leads to the run view.

## Loading state

The workspace read is a single request. Until it resolves, each band shows its heading and a quiet placeholder row — never a spinner over the whole page, never a layout that jumps when data lands.

## Empty state

Each band states the good news in words, not a blank: nothing waiting to decide, nothing contradictory, nothing defined to run. An empty workspace shows the same three bands with all three empty messages, plus how to create the first ticket.

## Error state

If the workspace cannot be read, the board says what it tried to read and why it failed, keeps the rail usable, and offers a retry. A single failing band does not blank the others.

## Success state

Not applicable in the usual sense: the board performs no mutation, so it reports no success. Reaching a coherent, current view of the workspace is the whole success condition.

## Disabled state

`Run next →` and every other affordance that names a CLI command is presentation only — it is a copyable command, never a button that acts. Nothing on the board is disabled because nothing on the board is enabled to write.

## Responsive behaviour

Designed for the desktop widths the design shows. Below the rail's breakpoint the rail collapses to the mark plus icons; the bands stack. No horizontal scrolling of the page at any supported width; wide content (tables, long ids) scrolls inside its own container.

## Keyboard and focus behaviour

Every rail entry and every row is reachable by keyboard in reading order. The drawer opens on Enter and closes on `Escape` — the design labels this `Close · esc`. Focus moves into the drawer on open and returns to the invoking row on close. Focus is always visible: the Modernist `:focus-visible` ring, 2px accent, never the browser default.

## Accessibility expectations

Zero serious or critical axe violations at the supported widths. The rail is a landmark; the bands are headed regions. Colour is never the only carrier of meaning — a state is a word as well as a tint. The accent-on-ground pair is tuned to 3:1, so accent text at paragraph size uses `--color-accent-700`, not the accent itself.

## Visual reference

`design/kotta/Kotta Console v2.dc.html` — vendored into this repository so it travels with the ticket. It is the specification for layout, wording and behaviour. Its design system is `design/kotta/_ds/modernist-.../styles.css` plus `readme.md`; `design/kotta/Kotta Logo.dc.html` carries the mark and its rules (the red note-head always sits on a line, never between; four staff lines above 24px, three below, two below 18px). `design/kotta/uploads/*.png` show the current board for comparison.

## Actors

- Operator reading the board.
- Agents and the CLI, which produce every change the board displays.
- The UI server, which reads the workspace from a stable ref.

## Initial state

An initialized workspace, read through the existing `/api/workspace` endpoint.

## States

- `loading` — the workspace read is in flight.
- `home` — the three bands.
- `chain` — one of Observations, Contracts, Batches.
- `decisions` — the flat cross-cutting list.
- `running` — the watch view.
- `drawer` — an entity open over any of the above.
- `error` — the workspace could not be read.

## Transitions

Rail entries switch view. A row opens the drawer. `Escape` or the close control returns to the underlying view with focus restored. A refresh re-reads the workspace and preserves the current view and drawer.

## Triggers

Opening the board, a rail click or keypress, a row activation, `Escape`, and an explicit refresh.

## Permissions

The board reads. It performs no mutation and presents no control that would.

## Error paths

Workspace read failure, a malformed entity, and a reference that points at nothing. The last one is displayed rather than hidden: the design shows `dangling reference` in the derivation panel.

## Cancellation path

Closing the drawer discards nothing, because nothing was being composed.

## Retry and duplicate-action behaviour

Refresh is idempotent. Repeated activation of the same row is a no-op on an already-open drawer.

## Audit and notification expectations

None. The board writes no record and sends nothing.

## Scope

- The dark rail: mark and wordmark, the derivation chain (`01 Observations · new information`, `02 Contracts · tickets`, `03 Batches · sequencing`), `Decisions` outside the chain, and `Running` with a live count and `Watch →`.
- The Home view with the three bands, wording taken from the design.
- **Waiting on you** derives from where the CLI refuses without `--approve`: undisposed findings, contracts in review, packages whose members are all done. Not the backlog — that is the menu, not a queue.
- **Doesn't add up** surfaces what `a-team validate` reports plus visible contradictions such as a dangling reference.
- The derivation panel on an entity: `came from` (`source_finding`) and `goes with` (`package`), with `dangling reference` when a target is missing.
- Restyling the existing chain, decisions and drawer views onto the Modernist tokens.
- The Modernist stylesheet replaces the current ad-hoc styles as the single source of visual truth.
- Component tests for the new surfaces, using the harness from T-01kz1nzpnafm6n5t0fz43g7nwh.

## Non-goals

- **Removing the six write endpoints.** The design says the board does not write, and this ticket stops presenting those surfaces — but `/api/chat`, `/api/ticket/ready`, `/api/package`, `/api/package/tickets`, `/api/finding` and `/api/finding/resolve` stay in place. Deleting them is a separate, reversible decision.
- Renaming `finding` to `observation` anywhere but the board's own labels; the CLI, schemas and file paths keep their names. That migration rides with the Kotta rename (P-004).
- The fate of the package `kind` field, which carries no information today and which the design does not render.
- Any change to the CLI, to the workspace format, or to how state is read.
- The landing page and the logo files, which are vendored for reference only.

## Acceptance

1. The rail matches the design: mark, the three chain entries with their numbers and subtitles, `Decisions` visually outside the chain, and `Running` with a count that reflects actually-running work.
2. Home shows the three bands in the design's order and wording, and each band's contents are derived as the Scope describes — in particular, defined backlog contracts appear under `What runs next?` and never under `Waiting on you`.
3. With an empty workspace, all three bands show their empty message; nothing renders blank.
4. Opening an entity shows the derivation panel with `came from` and `goes with`, and a missing target renders as `dangling reference` rather than disappearing.
5. `Escape` closes the drawer and returns focus to the row that opened it.
6. No control on the board issues a write. A test asserts the rendered board contains no mutation request path.
7. Zero serious or critical axe violations at the supported widths.
8. The workspace still loads through one request; the T-029 read-performance contract holds and its subprocess-count test still passes.
9. Component tests cover Home's default, loading, empty and error states, and the drawer's open and close.
10. Full suite, typecheck and all three builds green.

## Verification

Component tests through the jsdom harness for the states named in Acceptance 9, driving real interaction rather than asserting on source. A live check against `a-team ui` on this repository's own workspace and on a temporary empty one, with screenshots at the supported widths. An axe run at those widths. Re-run the T-029 subprocess-count test. `npx vitest run`, `npx tsc --noEmit`, `npm run build`.

## Constraints

The design file is the specification; where this ticket and the design disagree, the design wins and the disagreement is reported rather than resolved silently. Take every colour, font, space and radius from the Modernist stylesheet — no hard-coded hex, no invented spacing. The board reads from the frontmatter of a stable ref and must not introduce per-entity git calls. Whatever the board displays must agree with what the CLI reports.

## Open decisions

None.

## Execution notes

The board is one file, `ui/src/App.tsx`, with `ui/src/styles.css` beside it; components there are module-private, so each one a test touches needs an `export` added, as `DoneStage` has. `readWorkspace` in `src/commands/ui.ts` is the server-side read. The design's HTML is a `.dc.html` template — read it for layout, wording and structure, not to copy its markup verbatim into React.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| ui: required_states_verified | Friss agens, bemenet a 2867 tokenes brief + a repoba vendorolt design/kotta/. 43 perc, 108 tool-hivas. Acc1: rail-teszt 7 passed — landmark + jel + h1, szamozott lanc alcimekkel, Decisions a 'cross-cutting' utan, Running szamlalo ('1 contract under way in 1 batch'), betoltes alatt '—' helyorzo. Acc2: home-view 10 passed, benne EXPLICIT allitas, hogy mindket 'ready' contract a menu-regioban jelenik meg es EGYIK sorban sem — ez volt a legkonnyebben elrontható pont. Acc3: ures workspace elo probaval ('a-team ui --no-open --port 4398' friss 'a-team init'-en): mindharom sav a sajat ures-uzenetet mutatja, plusz 'a-team ticket new'; kepernyokep v2-05. Acc4+5: entity-drawer 10 passed — derivacio cim szerint contractra/observationre/batchre, 'source_finding: F-404' 'dangling reference'-kent renderelodik; Escape-re es 'Close · esc'-re a document.activeElement visszater az inditó sorra. Acc6: board-reads-only teszt rendereli az <App/>-et, bejarja mind az ot nezetet, megnyitja mindket overlayt, MINDEN gombra rakattint minden nezeten, es allitja, hogy minden fetch GET /api/workspace volt, valamint hogy a hat iras-utvonal, a <form> es a submit sehol nem jelenik meg. Acc7: @axe-core/playwright az elo boardon 1600/1280/1024/820px-en, hat nezeten, harom workspace-en (ez a repo, szintetikus futo, ures): 0 serious/critical, 0 vizszintes tullogas; egy minor aria-allowed-role javitva (aside->div). Acc8: a board csak a /api/workspace-t keri; a ui-batch-read teszt 5 passed, benne a <=2 subprocess es a pontos ['archive','rev-parse','status'] allitas — a T-029 szerzodese all. Acc9: ot jsdom-fajl, 41 teszt. Acc10 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 32 fajl / 184 passed / 1 skipped, 'npm run build' mindharom zold. Koordinatori ellenorzes: a hat POST-vegpont bizonyitottan a helyen van (grep: 6 talalat a src/commands/ui.ts-ben); a diff 28 fajl / 2403 beszuras. Vizualisan atneztem a v2-01-home.png-t: a rail, a harom sav, a dangling-reference ket-forras osszehasonlitas es a masolhato CLI-parancs mind a terv szerint all. Szerver: a readWorkspace mostantol a decisions-t is visszaadja UGYANABBOL a cache-elt pillanatkepbol — nulla tovabbi subprocess. Commit d9dcfdf. |
| ui: accessibility_verified | Friss agens, bemenet a 2867 tokenes brief + a repoba vendorolt design/kotta/. 43 perc, 108 tool-hivas. Acc1: rail-teszt 7 passed — landmark + jel + h1, szamozott lanc alcimekkel, Decisions a 'cross-cutting' utan, Running szamlalo ('1 contract under way in 1 batch'), betoltes alatt '—' helyorzo. Acc2: home-view 10 passed, benne EXPLICIT allitas, hogy mindket 'ready' contract a menu-regioban jelenik meg es EGYIK sorban sem — ez volt a legkonnyebben elrontható pont. Acc3: ures workspace elo probaval ('a-team ui --no-open --port 4398' friss 'a-team init'-en): mindharom sav a sajat ures-uzenetet mutatja, plusz 'a-team ticket new'; kepernyokep v2-05. Acc4+5: entity-drawer 10 passed — derivacio cim szerint contractra/observationre/batchre, 'source_finding: F-404' 'dangling reference'-kent renderelodik; Escape-re es 'Close · esc'-re a document.activeElement visszater az inditó sorra. Acc6: board-reads-only teszt rendereli az <App/>-et, bejarja mind az ot nezetet, megnyitja mindket overlayt, MINDEN gombra rakattint minden nezeten, es allitja, hogy minden fetch GET /api/workspace volt, valamint hogy a hat iras-utvonal, a <form> es a submit sehol nem jelenik meg. Acc7: @axe-core/playwright az elo boardon 1600/1280/1024/820px-en, hat nezeten, harom workspace-en (ez a repo, szintetikus futo, ures): 0 serious/critical, 0 vizszintes tullogas; egy minor aria-allowed-role javitva (aside->div). Acc8: a board csak a /api/workspace-t keri; a ui-batch-read teszt 5 passed, benne a <=2 subprocess es a pontos ['archive','rev-parse','status'] allitas — a T-029 szerzodese all. Acc9: ot jsdom-fajl, 41 teszt. Acc10 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 32 fajl / 184 passed / 1 skipped, 'npm run build' mindharom zold. Koordinatori ellenorzes: a hat POST-vegpont bizonyitottan a helyen van (grep: 6 talalat a src/commands/ui.ts-ben); a diff 28 fajl / 2403 beszuras. Vizualisan atneztem a v2-01-home.png-t: a rail, a harom sav, a dangling-reference ket-forras osszehasonlitas es a masolhato CLI-parancs mind a terv szerint all. Szerver: a readWorkspace mostantol a decisions-t is visszaadja UGYANABBOL a cache-elt pillanatkepbol — nulla tovabbi subprocess. Commit d9dcfdf. |
| ui: visual_evidence_present | Friss agens, bemenet a 2867 tokenes brief + a repoba vendorolt design/kotta/. 43 perc, 108 tool-hivas. Acc1: rail-teszt 7 passed — landmark + jel + h1, szamozott lanc alcimekkel, Decisions a 'cross-cutting' utan, Running szamlalo ('1 contract under way in 1 batch'), betoltes alatt '—' helyorzo. Acc2: home-view 10 passed, benne EXPLICIT allitas, hogy mindket 'ready' contract a menu-regioban jelenik meg es EGYIK sorban sem — ez volt a legkonnyebben elrontható pont. Acc3: ures workspace elo probaval ('a-team ui --no-open --port 4398' friss 'a-team init'-en): mindharom sav a sajat ures-uzenetet mutatja, plusz 'a-team ticket new'; kepernyokep v2-05. Acc4+5: entity-drawer 10 passed — derivacio cim szerint contractra/observationre/batchre, 'source_finding: F-404' 'dangling reference'-kent renderelodik; Escape-re es 'Close · esc'-re a document.activeElement visszater az inditó sorra. Acc6: board-reads-only teszt rendereli az <App/>-et, bejarja mind az ot nezetet, megnyitja mindket overlayt, MINDEN gombra rakattint minden nezeten, es allitja, hogy minden fetch GET /api/workspace volt, valamint hogy a hat iras-utvonal, a <form> es a submit sehol nem jelenik meg. Acc7: @axe-core/playwright az elo boardon 1600/1280/1024/820px-en, hat nezeten, harom workspace-en (ez a repo, szintetikus futo, ures): 0 serious/critical, 0 vizszintes tullogas; egy minor aria-allowed-role javitva (aside->div). Acc8: a board csak a /api/workspace-t keri; a ui-batch-read teszt 5 passed, benne a <=2 subprocess es a pontos ['archive','rev-parse','status'] allitas — a T-029 szerzodese all. Acc9: ot jsdom-fajl, 41 teszt. Acc10 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 32 fajl / 184 passed / 1 skipped, 'npm run build' mindharom zold. Koordinatori ellenorzes: a hat POST-vegpont bizonyitottan a helyen van (grep: 6 talalat a src/commands/ui.ts-ben); a diff 28 fajl / 2403 beszuras. Vizualisan atneztem a v2-01-home.png-t: a rail, a harom sav, a dangling-reference ket-forras osszehasonlitas es a masolhato CLI-parancs mind a terv szerint all. Szerver: a readWorkspace mostantol a decisions-t is visszaadja UGYANABBOL a cache-elt pillanatkepbol — nulla tovabbi subprocess. Commit d9dcfdf. |
| workflow: happy_path_verified | Friss agens, bemenet a 2867 tokenes brief + a repoba vendorolt design/kotta/. 43 perc, 108 tool-hivas. Acc1: rail-teszt 7 passed — landmark + jel + h1, szamozott lanc alcimekkel, Decisions a 'cross-cutting' utan, Running szamlalo ('1 contract under way in 1 batch'), betoltes alatt '—' helyorzo. Acc2: home-view 10 passed, benne EXPLICIT allitas, hogy mindket 'ready' contract a menu-regioban jelenik meg es EGYIK sorban sem — ez volt a legkonnyebben elrontható pont. Acc3: ures workspace elo probaval ('a-team ui --no-open --port 4398' friss 'a-team init'-en): mindharom sav a sajat ures-uzenetet mutatja, plusz 'a-team ticket new'; kepernyokep v2-05. Acc4+5: entity-drawer 10 passed — derivacio cim szerint contractra/observationre/batchre, 'source_finding: F-404' 'dangling reference'-kent renderelodik; Escape-re es 'Close · esc'-re a document.activeElement visszater az inditó sorra. Acc6: board-reads-only teszt rendereli az <App/>-et, bejarja mind az ot nezetet, megnyitja mindket overlayt, MINDEN gombra rakattint minden nezeten, es allitja, hogy minden fetch GET /api/workspace volt, valamint hogy a hat iras-utvonal, a <form> es a submit sehol nem jelenik meg. Acc7: @axe-core/playwright az elo boardon 1600/1280/1024/820px-en, hat nezeten, harom workspace-en (ez a repo, szintetikus futo, ures): 0 serious/critical, 0 vizszintes tullogas; egy minor aria-allowed-role javitva (aside->div). Acc8: a board csak a /api/workspace-t keri; a ui-batch-read teszt 5 passed, benne a <=2 subprocess es a pontos ['archive','rev-parse','status'] allitas — a T-029 szerzodese all. Acc9: ot jsdom-fajl, 41 teszt. Acc10 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 32 fajl / 184 passed / 1 skipped, 'npm run build' mindharom zold. Koordinatori ellenorzes: a hat POST-vegpont bizonyitottan a helyen van (grep: 6 talalat a src/commands/ui.ts-ben); a diff 28 fajl / 2403 beszuras. Vizualisan atneztem a v2-01-home.png-t: a rail, a harom sav, a dangling-reference ket-forras osszehasonlitas es a masolhato CLI-parancs mind a terv szerint all. Szerver: a readWorkspace mostantol a decisions-t is visszaadja UGYANABBOL a cache-elt pillanatkepbol — nulla tovabbi subprocess. Commit d9dcfdf. |
| workflow: failure_and_cancellation_paths_verified | Friss agens, bemenet a 2867 tokenes brief + a repoba vendorolt design/kotta/. 43 perc, 108 tool-hivas. Acc1: rail-teszt 7 passed — landmark + jel + h1, szamozott lanc alcimekkel, Decisions a 'cross-cutting' utan, Running szamlalo ('1 contract under way in 1 batch'), betoltes alatt '—' helyorzo. Acc2: home-view 10 passed, benne EXPLICIT allitas, hogy mindket 'ready' contract a menu-regioban jelenik meg es EGYIK sorban sem — ez volt a legkonnyebben elrontható pont. Acc3: ures workspace elo probaval ('a-team ui --no-open --port 4398' friss 'a-team init'-en): mindharom sav a sajat ures-uzenetet mutatja, plusz 'a-team ticket new'; kepernyokep v2-05. Acc4+5: entity-drawer 10 passed — derivacio cim szerint contractra/observationre/batchre, 'source_finding: F-404' 'dangling reference'-kent renderelodik; Escape-re es 'Close · esc'-re a document.activeElement visszater az inditó sorra. Acc6: board-reads-only teszt rendereli az <App/>-et, bejarja mind az ot nezetet, megnyitja mindket overlayt, MINDEN gombra rakattint minden nezeten, es allitja, hogy minden fetch GET /api/workspace volt, valamint hogy a hat iras-utvonal, a <form> es a submit sehol nem jelenik meg. Acc7: @axe-core/playwright az elo boardon 1600/1280/1024/820px-en, hat nezeten, harom workspace-en (ez a repo, szintetikus futo, ures): 0 serious/critical, 0 vizszintes tullogas; egy minor aria-allowed-role javitva (aside->div). Acc8: a board csak a /api/workspace-t keri; a ui-batch-read teszt 5 passed, benne a <=2 subprocess es a pontos ['archive','rev-parse','status'] allitas — a T-029 szerzodese all. Acc9: ot jsdom-fajl, 41 teszt. Acc10 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 32 fajl / 184 passed / 1 skipped, 'npm run build' mindharom zold. Koordinatori ellenorzes: a hat POST-vegpont bizonyitottan a helyen van (grep: 6 talalat a src/commands/ui.ts-ben); a diff 28 fajl / 2403 beszuras. Vizualisan atneztem a v2-01-home.png-t: a rail, a harom sav, a dangling-reference ket-forras osszehasonlitas es a masolhato CLI-parancs mind a terv szerint all. Szerver: a readWorkspace mostantol a decisions-t is visszaadja UGYANABBOL a cache-elt pillanatkepbol — nulla tovabbi subprocess. Commit d9dcfdf. |
| workflow: authorization_and_idempotency_verified | Friss agens, bemenet a 2867 tokenes brief + a repoba vendorolt design/kotta/. 43 perc, 108 tool-hivas. Acc1: rail-teszt 7 passed — landmark + jel + h1, szamozott lanc alcimekkel, Decisions a 'cross-cutting' utan, Running szamlalo ('1 contract under way in 1 batch'), betoltes alatt '—' helyorzo. Acc2: home-view 10 passed, benne EXPLICIT allitas, hogy mindket 'ready' contract a menu-regioban jelenik meg es EGYIK sorban sem — ez volt a legkonnyebben elrontható pont. Acc3: ures workspace elo probaval ('a-team ui --no-open --port 4398' friss 'a-team init'-en): mindharom sav a sajat ures-uzenetet mutatja, plusz 'a-team ticket new'; kepernyokep v2-05. Acc4+5: entity-drawer 10 passed — derivacio cim szerint contractra/observationre/batchre, 'source_finding: F-404' 'dangling reference'-kent renderelodik; Escape-re es 'Close · esc'-re a document.activeElement visszater az inditó sorra. Acc6: board-reads-only teszt rendereli az <App/>-et, bejarja mind az ot nezetet, megnyitja mindket overlayt, MINDEN gombra rakattint minden nezeten, es allitja, hogy minden fetch GET /api/workspace volt, valamint hogy a hat iras-utvonal, a <form> es a submit sehol nem jelenik meg. Acc7: @axe-core/playwright az elo boardon 1600/1280/1024/820px-en, hat nezeten, harom workspace-en (ez a repo, szintetikus futo, ures): 0 serious/critical, 0 vizszintes tullogas; egy minor aria-allowed-role javitva (aside->div). Acc8: a board csak a /api/workspace-t keri; a ui-batch-read teszt 5 passed, benne a <=2 subprocess es a pontos ['archive','rev-parse','status'] allitas — a T-029 szerzodese all. Acc9: ot jsdom-fajl, 41 teszt. Acc10 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 32 fajl / 184 passed / 1 skipped, 'npm run build' mindharom zold. Koordinatori ellenorzes: a hat POST-vegpont bizonyitottan a helyen van (grep: 6 talalat a src/commands/ui.ts-ben); a diff 28 fajl / 2403 beszuras. Vizualisan atneztem a v2-01-home.png-t: a rail, a harom sav, a dangling-reference ket-forras osszehasonlitas es a masolhato CLI-parancs mind a terv szerint all. Szerver: a readWorkspace mostantol a decisions-t is visszaadja UGYANABBOL a cache-elt pillanatkepbol — nulla tovabbi subprocess. Commit d9dcfdf. |

### Verification performed

Friss agens, bemenet a 2867 tokenes brief + a repoba vendorolt design/kotta/. 43 perc, 108 tool-hivas. Acc1: rail-teszt 7 passed — landmark + jel + h1, szamozott lanc alcimekkel, Decisions a 'cross-cutting' utan, Running szamlalo ('1 contract under way in 1 batch'), betoltes alatt '—' helyorzo. Acc2: home-view 10 passed, benne EXPLICIT allitas, hogy mindket 'ready' contract a menu-regioban jelenik meg es EGYIK sorban sem — ez volt a legkonnyebben elrontható pont. Acc3: ures workspace elo probaval ('a-team ui --no-open --port 4398' friss 'a-team init'-en): mindharom sav a sajat ures-uzenetet mutatja, plusz 'a-team ticket new'; kepernyokep v2-05. Acc4+5: entity-drawer 10 passed — derivacio cim szerint contractra/observationre/batchre, 'source_finding: F-404' 'dangling reference'-kent renderelodik; Escape-re es 'Close · esc'-re a document.activeElement visszater az inditó sorra. Acc6: board-reads-only teszt rendereli az <App/>-et, bejarja mind az ot nezetet, megnyitja mindket overlayt, MINDEN gombra rakattint minden nezeten, es allitja, hogy minden fetch GET /api/workspace volt, valamint hogy a hat iras-utvonal, a <form> es a submit sehol nem jelenik meg. Acc7: @axe-core/playwright az elo boardon 1600/1280/1024/820px-en, hat nezeten, harom workspace-en (ez a repo, szintetikus futo, ures): 0 serious/critical, 0 vizszintes tullogas; egy minor aria-allowed-role javitva (aside->div). Acc8: a board csak a /api/workspace-t keri; a ui-batch-read teszt 5 passed, benne a <=2 subprocess es a pontos ['archive','rev-parse','status'] allitas — a T-029 szerzodese all. Acc9: ot jsdom-fajl, 41 teszt. Acc10 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 32 fajl / 184 passed / 1 skipped, 'npm run build' mindharom zold. Koordinatori ellenorzes: a hat POST-vegpont bizonyitottan a helyen van (grep: 6 talalat a src/commands/ui.ts-ben); a diff 28 fajl / 2403 beszuras. Vizualisan atneztem a v2-01-home.png-t: a rail, a harom sav, a dangling-reference ket-forras osszehasonlitas es a masolhato CLI-parancs mind a terv szerint all. Szerver: a readWorkspace mostantol a decisions-t is visszaadja UGYANABBOL a cache-elt pillanatkepbol — nulla tovabbi subprocess. Commit d9dcfdf.

### Deviations

Het ponton tert el a terv es a brief, mind nyilatkozva; a legfontosabb a hatodik. (1) A 'Running' a tervben a rail lababan all szamlalo nelkul, a brief szamlalot kert — mindketto megvalosult: a lab-gomb hordozza a szamot es a 'Watch →' szoveget, a terv sotet Running-savja megmaradt. (2) A terv a derivaciot sticky aside-kent rajzolja, KIZAROLAG a Contracts nezetben; a brief viszont drawer-allapotkent kezeli Escape+fokusz szemantikaval, es a tervben az observation, a batch es a decision egyaltalan nem kap reszletnezetet. Az agens itt a BRIEF-nek adott igazat, es ezt kulon jelezte — ez az egyetlen hely, ahol nem a terv nyert. (3) A terv 'narrowed by D-010' / 'continues D-005' relaciokat rajzol, de a decision-modell csak id/title/date-et ismer — ilyen adat sehol nincs. A board lapos, legujabb-elso listat mutat, es 'reads with <cim>'-et ott, ahol a proza emlit egy masik dontest: emlites, nem kitalalt relacio. Findingkent rogzitve. (4) A terv sorai 'kotta ticket reconcile <id>'-t neveznek meg, ami nem letezik a CLI-ben — mivel a boardnak a CLI-vel kell egyeznie, a drift- es dangling-sorok az 'a-team validate'-re, a tagsagi eltres a 'package validate'-re mutat. Findingkent rogzitve. (5) A terv fejlece tobb-workspace valtot hordoz; a szerver egyetlen workspace-t szolgal ki, ezert kimaradt. (6) KONTRASZT: a Modernist rendszer a sajat .btn-primary-jaban az akcentust tolti ki vilagos szoveg ala, ami 3.75:1 — serious axe-sertes interfesz-mereten. A ket szerzodesi kikotes itt utkozott ('a terv nyer' vs 'nulla serious axe'), es az agens az Acceptance 7-nek adott igazat: egy --accent-fill token az ilyen kitolteseket a --color-accent-700-ra lepteti, a masodlagos szoveg pedig 80%/78%-os inkre valt a terv 45-65%-a helyett. A tiszta --color-accent tovabbra is viszi a teljes chrome-ot, a vonalakat, a savokat es a sav-elt. (7) A readWorkspace bovitese: 'az allapot olvasasanak megvaltoztatasa' Non-goal volt, de az Acc1 Decisions-szamlalot kovetel es a terv a nezetet — a /api/workspace az egyetlen forras. A gyujtes a meglevo pillanatkep-uton megy, uj subprocess es formatum-valtozas nelkul. Tovabba: TOROLTE a tests/ui/done-stage.test.tsx-et, mert a DoneStage komponens megszunt ('a Done itt szuro-ertek, nem kulon hely') — az ot uj jsdom-fajl veszi at a peldakent valo szerepet, es egyetlen node-kornyezetu teszt sem koltozott jsdom-ra. Vegul: a chat-dock, a capture/validate/tagsagi urlapok, a source- es migracios drawer, valamint az /api/agents lekeres eltunt a FELULETROL — minden vegpont a helyen maradt.

### Findings created

Negy, mind az agenstol: F-01kz20fzmjvj7hpcdn2s40aw1j (risk) — a board ket ellentmondas-osztalyt nem tud megmutatni, amit az 'a-team validate' jelent: a MISSING_CLAIM/INVALID_CLAIM (a claimek nincsenek benne az olvasatban) es a DUPLICATE_STATE (a readWorkspace csendben deduplikal). F-01kz20ghs2e8ym44v45mqcvk49 (product) — az allapot-driftre nincs reconcile parancs, holott a terv ilyet rajzol. F-01kz20h7kvbk1s8drg8pv9r452 (product) — egy dontes nem tudja rogziteni, hogy szukit vagy folytat egy masikat; pont ez a D-010/D-003 es a D-005/D-006/D-007 lanc esete. F-01kz20ghvyn7zfbjffa4dg5622 (process) — a ui/UX-SPEC.md a v2 elotti boardot irja le; kapott egy 'superseded' banner, de a torzse javitatlan.

### Known concerns

(a) A hatodik deviacio kovetkezmenye latvanyt erint: a terv elsodleges gombja mas szinu lesz, mint amit a designer rajzolt. Ez tudatos csere az akadalymentessegert, es a designernek vissza kell jeleznunk — lehet, hogy a rendszer akcentusat kell melyiteni, nem a boardot kivetelezni. (b) A done-stage teszt torlesevel a ma landolt harness eredeti peldaja eltunt; az ot uj fajl potolja, de a harness ticket bizonyiteka mar nem all onmagaban. (c) A tervbol harom elem tudatosan kimaradt vagy modosult (decision-relaciok, reconcile-parancs, workspace-valto), mindharom sajat findinggal vagy indoklassal — a designernek ezeket egyben erdemes megmutatni.
