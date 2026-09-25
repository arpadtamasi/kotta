---
id: T-01kz1g2vyhfn5ezzvvyzn4w2gr
title: a-team ui does not open the browser — auto-open the served URL on start
status: done
origin: observation
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: >-
  fix/T-01kz1g2vyhfn5ezzvvyzn4w2gr-a-team-ui-does-not-open-the-browser-auto-open-the-served-url
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-014
assigned_agent: claude
resolution: completed
---
# T-01kz1g2vyhfn5ezzvvyzn4w2gr — a-team ui does not open the browser — auto-open the served URL on start

## Outcome

`a-team ui` opens the served URL in the default browser on start, and can be told not to.

## Context

Today the command prints the URL and waits; the operator copies it by hand on every start. Since T-014 the port is not even predictable — an occupied 4311 makes the UI pick the next free port — so the printed URL is the only way to know where the board is.

## Scope

- Open the resolved URL in the default browser once the server is listening.
- `--no-open` to suppress it.
- Do not open when `--json` is used, since that mode is for automation.
- A failed open is a warning, never a startup failure.

## Non-goals

- Choosing or configuring which browser is used.
- Reusing an existing tab, or any browser automation beyond handing over the URL.
- Changing host, port or fallback behaviour.

## Acceptance

1. `a-team ui` opens the actual served URL, including a port chosen by fallback.
2. `a-team ui --no-open` starts and opens nothing.
3. `a-team ui --json` opens nothing.
4. A failing opener prints a warning; the server keeps running and the exit status is unaffected.
5. Tests never launch a real browser.
6. Full suite, typecheck and builds green.

## Verification

Integration tests with an injectable opener double asserting the URL it received, plus the three suppression paths and the failure path. `npx vitest run`, `npx tsc --noEmit`, `npm run build:cli`.

## Constraints

The opener must be substitutable so tests never spawn a browser. Opening happens after a successful bind, never before.

## Open decisions

None.

## Execution notes

`src/commands/ui.ts` already resolves the final port through `bindUiServer` (T-014); the opener hangs off the same result. Platform command: `open` on darwin, `xdg-open` on linux, `start` on win32.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Friss agens, bemenet kizarolag a 613 tokenes brief. Implementacio a src/commands/ui.ts-ben: UI_OPEN_COMMAND_ENV (A_TEAM_UI_OPEN_COMMAND), BrowserOpener tipus, resolveOpenCommand(platform) — darwin 'open', linux 'xdg-open', win32 'cmd /c start ""', a kornyezeti valtozo felulir —, es egy alapertelmezett openInBrowser (spawn, stdio ignore, unref, error/nem-nulla exit eseten elutasit). A uiCommand kapott egy open?: boolean opciot es egy injektalhato opener parametert; a kiiras UTAN adja at az URL-t, ha !json && open !== false. CLI: --no-open. Acc1: az opener-dublor pontosan a 'http://127.0.0.1:<lekotott port>' cimet kapja, ami megegyezik a stdout-tal; a fallback agon 4311-et foglalva a lekotott port nagyobb, es AZT az URL-t nyitja. Acc2: open:false -> az opener egyszer sem hivodik, a szerver fut. Acc3: json:true -> nem nyit, a JSON ok:true. Acc4: elutasito opener -> 'Warning: could not open ... Open it yourself.' a stderr-en, a szerver tovabb el (a /api/agents fetch sikeres), a process.exitCode valtozatlan. Acc5 (a kemeny kikotes): a tesztek soha nem inditanak valodi bongeszot — in-process injektalt opener, CLI-szinten egy rogzito szkript A_TEAM_UI_OPEN_COMMAND-on at (a rogzitett URL egyenlo a kiirttal, --no-open eseten semmi nincs rogzitve), es a vitest.config.ts test.env-je minden gyermek-folyamatra 'true'-ra allitja az opener-parancsot, igy egyetlen suite sem erhet el bongeszot. Acc6 (koordinatori ujrafuttatas a main beemelese UTAN): 'npm run build:cli' zold, 'npx tsc --noEmit' tiszta, 'npx vitest run' 27 fajl / 143 passed / 1 skipped, 'a-team validate' ok:true. A main beemelesekor egy konfliktus volt a CHANGELOG.md-ben (a package close es a ui open bejegyzes ugyanoda kerult) — koordinatorkent oldottam fel, mindket bejegyzes megmaradt. |

### Verification performed

Friss agens, bemenet kizarolag a 613 tokenes brief. Implementacio a src/commands/ui.ts-ben: UI_OPEN_COMMAND_ENV (A_TEAM_UI_OPEN_COMMAND), BrowserOpener tipus, resolveOpenCommand(platform) — darwin 'open', linux 'xdg-open', win32 'cmd /c start ""', a kornyezeti valtozo felulir —, es egy alapertelmezett openInBrowser (spawn, stdio ignore, unref, error/nem-nulla exit eseten elutasit). A uiCommand kapott egy open?: boolean opciot es egy injektalhato opener parametert; a kiiras UTAN adja at az URL-t, ha !json && open !== false. CLI: --no-open. Acc1: az opener-dublor pontosan a 'http://127.0.0.1:<lekotott port>' cimet kapja, ami megegyezik a stdout-tal; a fallback agon 4311-et foglalva a lekotott port nagyobb, es AZT az URL-t nyitja. Acc2: open:false -> az opener egyszer sem hivodik, a szerver fut. Acc3: json:true -> nem nyit, a JSON ok:true. Acc4: elutasito opener -> 'Warning: could not open ... Open it yourself.' a stderr-en, a szerver tovabb el (a /api/agents fetch sikeres), a process.exitCode valtozatlan. Acc5 (a kemeny kikotes): a tesztek soha nem inditanak valodi bongeszot — in-process injektalt opener, CLI-szinten egy rogzito szkript A_TEAM_UI_OPEN_COMMAND-on at (a rogzitett URL egyenlo a kiirttal, --no-open eseten semmi nincs rogzitve), es a vitest.config.ts test.env-je minden gyermek-folyamatra 'true'-ra allitja az opener-parancsot, igy egyetlen suite sem erhet el bongeszot. Acc6 (koordinatori ujrafuttatas a main beemelese UTAN): 'npm run build:cli' zold, 'npx tsc --noEmit' tiszta, 'npx vitest run' 27 fajl / 143 passed / 1 skipped, 'a-team validate' ok:true. A main beemelesekor egy konfliktus volt a CHANGELOG.md-ben (a package close es a ui open bejegyzes ugyanoda kerult) — koordinatorkent oldottam fel, mindket bejegyzes megmaradt.

### Deviations

Ket tetel. (1) A uiCommand mostantol a Server peldanyt adja vissza void helyett — a hivokat nem erinti, de a teszteknek kell, hogy le tudjak allitani a szervereket listener-szivargas nelkul. (2) A fallback-teszt csak akkor hagyja ki magat, ha a gep egyaltalan nem tudja lekotni a 4311-et; ha mas processz tartja, a fallback ag valojaban lefut — ezen a gepen a 4311 foglalt volt, tehat az allitas tenylegesen futott.

### Findings created

F-01kz1kdr45j5k28zvqnbxc71r5 (process) — a tests/integration/ui-port-cli.test.ts:82 es :106 korai return-nel kihagyja magat, ha a 4311 foglalt, igy a ket fallback-teszt ugy megy at, hogy semmit nem allit; ezen a gepen a teljes futas alatt pontosan ez tortent.

### Known concerns

Ez a finding a sajat korabbi T-014 munkam gyengejet talalta el: ott ezt a csendes kihagyast known concernkent nyilatkoztam es tudatos cserenek neveztem, most viszont bizonyitott, hogy a gyakorlatban MINDIG kihagyja magat ezen a gepen — vagyis a CLI-szintu fallback-bizonyitek ott de facto hianyzik. A mostani ticket sajat fallback-tesztje ezt reszben potolja, de a T-014 ket tesztjet erdemes atirni.
