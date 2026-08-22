---
id: T-01kz1nzpnafm6n5t0fz43g7nwh
title: Component-test harness for the React board
status: done
origin: observation
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: feat/T-01kz1nzpnafm6n5t0fz43g7nwh-component-test-harness-for-the-react-board
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-033
assigned_agent: claude
resolution: completed
---
# T-01kz1nzpnafm6n5t0fz43g7nwh — Component-test harness for the React board

## Outcome

A React component can be rendered in a test and asserted on: what it shows, and how it reacts to interaction. `npx vitest run` runs those tests alongside the existing node-only suite, in the same command, without a browser.

## Context

Recorded during T-013. The `ui` profile requires evidence for the default, loading, empty, error, success and disabled states of a surface. None of that can be shown without rendering the component.

What the repository has today, and why none of it fits:

- **unit tests** — pure functions, no UI at all
- **source-contract tests** — they grep the source or the built bundle for a string. They pass while the surface is broken; T-013 had to fall back on exactly this.
- **Playwright** — a real browser, but it only runs against `site/`, and it is slow

So every UI ticket whose Verification names component tests is unsatisfiable as written. Six UI tickets are queued behind this one.

## Scope

- Add a browser-like test environment (`jsdom`) and a rendering library (`@testing-library/react`) as dev dependencies.
- Configure vitest so UI tests get that environment while the existing node-only tests keep theirs — one `npx vitest run` covers both.
- One exemplar component test against a real component in `ui/src/`, asserting rendered output and one interaction, so the pattern is copyable.
- A short note in the README on where UI tests live and how to write one.

## Non-goals

- Testing every existing component, or reaching any coverage target.
- Replacing the Playwright suite that covers `site/`.
- Any change to the board's behaviour, markup or styling.
- A visual-regression or screenshot mechanism.

## Acceptance

1. A component test renders a component from `ui/src/` and asserts on what the user sees; it fails when the rendered output stops matching.
2. The same test asserts one interaction (a click or an input) and its visible effect.
3. `npx vitest run` runs both the new UI tests and the whole existing suite, green, in one command.
4. The existing node-only tests keep running in their current environment — no test moves to jsdom by accident.
5. No test opens a real browser.
6. Typecheck and all three builds green.

## Verification

Run `npx vitest run` and confirm both groups execute. Prove the exemplar has teeth: change the component's rendered text and watch the test fail, then revert. Confirm the node-only suite count is unchanged.

## Constraints

Test-only dependencies; nothing ships in the built board. The existing suite must not slow down materially or change environment.

## Open decisions

None.

## Execution notes

`vitest.config.ts` holds the current node-only setup, and since T-01kz1g2vyhfn5ezzvvyzn4w2gr also carries `test.env` pinning the browser opener — keep that working. UI source is `ui/src/App.tsx`; pick a small, self-contained component from it as the exemplar rather than the whole board.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Friss agens, bemenet kizarolag a 881 tokenes brief. Harness: jsdom + @testing-library/react devDependenciakent; a jsdom fajlonkent, '// @vitest-environment jsdom' docblockkal kapcsolodik be — nem environmentMatchGlobs (Vitest 3-ban elavult) es nem test.projects (ott a browser-opener kornyezeti valtozot projektenkent duplikalni kellett volna, ami az Acc5-ot kockaztatja). Exemplar: tests/ui/done-stage.test.tsx, 3 teszt a DoneStage komponensre; a ui/src/App.tsx-ben mindossze KET export kulcsszo valtozott (DoneStage, Workspace tipus). Acc1+Acc2 (fogazat bizonyitva): a renderelt szoveget 'provenance intact.' -> 'provenance kept.'-re irva a teszt elbukik ('Unable to find an element with the text'), visszaallitva zold; a kereso onChange-et elrontva ('setQuery(e.target.value)' -> 'setQuery("")') az interakcios teszt bukik, visszaallitva zold. Az interakcios teszt a valodi kereso-inputba gepel, es allitja, hogy a nem egyezo sor eltunik es megjelenik az ures-allapot szovege. Acc3: egyetlen 'npx vitest run' futtatja mindkettot. Acc4 (a kert szamok): elotte 27 fajl / 144 teszt, utana 28 fajl / 147 teszt — az uj fajl 1 fajl / 3 teszt, tehat a node-only reszhalmaz valtozatlanul 27 fajl / 144 teszt; a kornyezet-koltseg is ezt tamasztja ala (environment 3ms -> 545ms, pontosan egy jsdom peldanyositas). A 'grep -rl @vitest-environment tests/' pontosan egy talalatot ad. Acc5: nincs valodi bongeszo — jsdom, es a vitest.config.ts test.env-je valtozatlanul 'true'-ra pinneli az A_TEAM_UI_OPEN_COMMAND-ot minden gyermek-folyamatra. Acc6: 'npx tsc --noEmit' tiszta, mindharom build zold. Koordinatori ellenorzes a main beemelese UTAN: 'npx vitest run' 28 fajl / 146 passed / 1 skipped. A ui-dist bajtazonos maradt a build utan — ez egyben bizonyitja, hogy a ket export hozzaadasa semmit nem valtoztatott a board viselkedesen, jelolesen vagy stilusan. Commitok: 7919832, es a koordinatori flake-javitas. |

### Verification performed

Friss agens, bemenet kizarolag a 881 tokenes brief. Harness: jsdom + @testing-library/react devDependenciakent; a jsdom fajlonkent, '// @vitest-environment jsdom' docblockkal kapcsolodik be — nem environmentMatchGlobs (Vitest 3-ban elavult) es nem test.projects (ott a browser-opener kornyezeti valtozot projektenkent duplikalni kellett volna, ami az Acc5-ot kockaztatja). Exemplar: tests/ui/done-stage.test.tsx, 3 teszt a DoneStage komponensre; a ui/src/App.tsx-ben mindossze KET export kulcsszo valtozott (DoneStage, Workspace tipus). Acc1+Acc2 (fogazat bizonyitva): a renderelt szoveget 'provenance intact.' -> 'provenance kept.'-re irva a teszt elbukik ('Unable to find an element with the text'), visszaallitva zold; a kereso onChange-et elrontva ('setQuery(e.target.value)' -> 'setQuery("")') az interakcios teszt bukik, visszaallitva zold. Az interakcios teszt a valodi kereso-inputba gepel, es allitja, hogy a nem egyezo sor eltunik es megjelenik az ures-allapot szovege. Acc3: egyetlen 'npx vitest run' futtatja mindkettot. Acc4 (a kert szamok): elotte 27 fajl / 144 teszt, utana 28 fajl / 147 teszt — az uj fajl 1 fajl / 3 teszt, tehat a node-only reszhalmaz valtozatlanul 27 fajl / 144 teszt; a kornyezet-koltseg is ezt tamasztja ala (environment 3ms -> 545ms, pontosan egy jsdom peldanyositas). A 'grep -rl @vitest-environment tests/' pontosan egy talalatot ad. Acc5: nincs valodi bongeszo — jsdom, es a vitest.config.ts test.env-je valtozatlanul 'true'-ra pinneli az A_TEAM_UI_OPEN_COMMAND-ot minden gyermek-folyamatra. Acc6: 'npx tsc --noEmit' tiszta, mindharom build zold. Koordinatori ellenorzes a main beemelese UTAN: 'npx vitest run' 28 fajl / 146 passed / 1 skipped. A ui-dist bajtazonos maradt a build utan — ez egyben bizonyitja, hogy a ket export hozzaadasa semmit nem valtoztatott a board viselkedesen, jelolesen vagy stilusan. Commitok: 7919832, es a koordinatori flake-javitas.

### Deviations

Ket tetel. (1) A dontesek kozul a jsdom bekapcsolasa fajlonkenti docblockkal tortenik, nem globalis konfiggal — indoklas fent, es ettol az Acc4 szerkezetileg igaz, nem csak merési eredmeny. (2) KOORDINATORI BEAVATKOZAS: a teljes keszlet nem tudott zoldre futni, mert a tests/integration/ui-port-cli.test.ts afterEach-e megolte a spawnolt UI-folyamatokat, de nem varta meg a tenyleges kilepesuket — az eletben maradt gyerek fogta a socketet azon a porton, amit a teszt zarni akart, igy a server.close() sosem tert vissza, es 10 masodperces hook-timeout futasonkent MAS tesztet buktatott. Ket egymast koveto futasom bukott el igy, kulon teszten. Ez a harness Acceptance 3-at (egyetlen zold 'npx vitest run') tette teljesithetetlenne, ezert kijavitottam: az afterEach megvarja a gyerek 'exit' esemenyet, majd closeAllConnections() utan zar. Harom egymast koveto celzott futas es a teljes keszlet is zold. Ez tulmegy a harness szerzodesen, de nelkule a ticket nem zarhato le.

### Findings created

F-01kz1pyenv49cygqcwhqqt57nj (bug) — az agens rogzitette, hogy a ui-port-cli.test.ts flaky: a tiszta, modositatlan worktree-n a base commiten ketszer egymas utan 'Hook timed out in 10000ms' hibaval bukott, kesobb ugyanaz a futas atment. A koordinatori javitas ezt a findingot megoldja; a diszpozicionalasakor ellenorizni kell, hogy nem maradt-e masik oka. Megjegyzendo, hogy letezik egy szomszedos finding (…-nbxc71r5) ugyanerrol a fajlrol, hogy foglalt 4311 eseten semmit nem allit — a ket findingot erdemes egyutt triazsolni.

### Known concerns

(a) A hat sorban allo UI-tickethez tudni kell: a ui/src/App.tsx komponensei modul-privatak, ezert mindegyikhez hozza kell adni egy 'export'-ot, ahogy a DoneStage kapott — a README ezt kimondja. (b) A masik nyitott ui-port-cli baj (foglalt 4311 eseten csendes kihagyas) NEM oldodott meg ezzel a javitassal; az tovabbra is el.
