---
id: T-035
title: 'ticket execute: a friss-kontextusu vegrehajtas legyen parancs, ne fegyelem'
status: done
origin: observation
types:
  - feature
  - workflow
profiles:
  - workflow
priority: high
risk: medium
batch: P-005
depends_on:
  - T-034
blocks: []
branch: feat/T-035-ticket-execute-a-friss-kontextusu-vegrehajtas-legyen-parancs
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-032
assigned_agent: claude
resolution: completed
---
# T-035 — `ticket execute`: a friss-kontextusú végrehajtás legyen parancs, ne fegyelem

## Outcome

Egyetlen paranccsal — `a-team ticket execute <id>` — egy ready ticket friss ágens-kontextusban fut le: a parancs elvégzi a startot, összeállítja a briefet, elindítja az ágenst kizárólag azzal, és a ticketet implementált, még nem reviewzott állapotban adja vissza. A koordinátor kontextusa nem hordoz ticket-munkát. A kontextus-öröklés csak explicit, indokolt és naplózott kivétel.

## Context

F-032 és D-009. A D-009 kimondja, hogy minden ticket friss ágens-kontextusban fut, és hogy koordinátor-kontextusban ticket-implementáció tilos — de ez ma csak skill-szövegben él. Mért következmény ebben a repóban (2026-08-02): a T-032, T-033, T-012, T-014 és T-015 végig a koordinátor felhalmozott kontextusában készült, és semmi nem állította meg; az operátor vette észre, nem a szerszám. A T-013-nál kézzel állítottuk helyre — `ticket brief T-013` (4509 token) → friss ágens csak a brieffel → a koordinátor review-ra maradt —, és működött, de emberi fegyelem tartotta össze.

Az operátor indoklása: így párhuzamosítható a munka (ma a koordinátor kontextusa a soros szűk keresztmetszet, a package `parallelism` mezője nem tud érvényesülni), minimális marad a kontextus, és megszűnik a ticketek közti átfolyás.

A T-031 mintája irányadó: ott addig volt hazug a mező, amíg az őszinte út nem lett az alapértelmezés és a kivétel explicit nyilatkozat. Ugyanez kell itt.

Függ a T-034-től: amíg az azonosító ütközhet, a párhuzamos végrehajtás adatromlást termel — ma egyetlen párhuzamos ágens is ütközést okozott.

## Actors

- Operátor, aki egy ticketet vagy egy csomagot végrehajtat.
- Koordinátor-ágens, amely sorrendez, kapuknál megáll és jegyzőkönyvez.
- Ticket-ágens, amely kizárólag a briefet kapja.
- A-Team CLI, amely a claimet, branchet, worktree-t, briefet és az ágens-indítást kezeli.

## Initial state

A ticket `ready`, érvényes, nincs claimje, a repó tiszta, és van elérhető ágens-parancs a gépen.

## States

- `unstarted`: a ticket ready, nincs claim.
- `briefed`: a claim, branch és worktree létrejött, a brief összeállt.
- `running`: a ticket-ágens fut a saját kontextusában.
- `implemented`: az ágens visszatért, a munka commitolva a feature branchen, a ticket még active.
- `refused`: valamelyik előfeltétel nem teljesült; semmi nem jött létre.
- `agent-failed`: az ágens hibával vagy üres eredménnyel tért vissza; a claim és a worktree megmarad vizsgálatra.

## Transitions

- `execute` egy ready ticketre: start → brief → ágens-indítás → várakozás → implemented.
- Bármely előfeltétel bukása `refused`, mutáció nélkül.
- Az ágens hibája `agent-failed`; a parancs nem törli a claimet és nem lép review-ba.
- A `--inherit-context` explicit kivétel: a hívó indokot ad, és ez a futam-jegyzőkönyvbe kerül.

## Triggers

Az `execute` parancs, az ágens visszatérése vagy hibája, és a megszakítás.

## Permissions

A parancs a meglévő `ticket start` írókon keresztül hoz létre claimet, branchet és worktree-t, és elindít egy külső ágens-parancsot. Nem lép review-ba, nem mergel, nem zár le ticketet, és nem ír kanonikus állapotot az ágens nevében.

## Error paths

Nem ready ticket, meglévő claim, piszkos repó, hiányzó ágens-parancs, brief-összeállítási hiba, az ágens nem nulla exitje, üres vagy értelmezhetetlen ágens-eredmény — mindegyik cselekvőképes hibaüzenetet ad, és megkülönbözteti, hogy a végrehajtási kontextus létrejött-e.

## Cancellation path

Megszakítás az ágens indítása előtt semmit nem hagy hátra. Megszakítás futó ágens mellett a claimet és a worktree-t érintetlenül hagyja, és megnevezi, mit kell kézzel eldönteni.

## Retry and duplicate-action behaviour

Már claimelt ticketre az `execute` elutasít, nem indít második ágenst. Az `agent-failed` után az újrapróbálás a meglévő végrehajtási kontextust használja, nem hoz létre másodikat.

## Audit and notification expectations

A parancs kiírja a brief méretét tokenben, az elindított ágenst és a végrehajtási kontextust; a brief-méret ticketenként a futam-jegyzőkönyvbe kerül (F-016 első valós költségadata). Külső értesítés nincs.

## Scope

- Új parancs: `a-team ticket execute <id> --agent <agent>`, amely a startot, a briefet és az ágens-indítást egy útba fogja.
- Az ágens kizárólag a briefet kapja bemenetként; a koordinátor kontextusa nem kerül át.
- A brief mérete és a kiválasztott ágens megjelenik a kimenetben, `--json`-ban is.
- `--inherit-context <indok>` explicit kivételként, kötelező indokkal, naplózva.
- A `ticket start` kimenete a következő lépésként az `execute`-ot nevezi meg.
- Az `execute-ticket` és `execute-package` skillek a parancsra hivatkoznak, nem kézi lépéssorra.
- Dokumentáció az operátornak.

## Non-goals

- A review, merge és close automatizálása — azok külön kapuk maradnak.
- Több ticket egyidejű indítása egyetlen `execute` hívásból; a párhuzamosítás a csomag-szintű munka, és a T-034 landolása után.
- Ágens-választás intelligenciája, modell-konfiguráció, költségkeret.
- Az ágens munkájának minőségi bírálata — az a review dolga.

## Acceptance

1. Ready ticketen az `execute` létrehozza a claimet, branchet és worktree-t, elindítja az ágenst, és a ticketet `active` állapotban, commitolt munkával adja vissza.
2. A ticket-ágens bemenete bizonyíthatóan csak a brief: a parancs által átadott prompt nem tartalmaz a briefen kívüli munkaanyagot.
3. A kimenet — humán és `--json` — megnevezi a brief token-méretét, az ágenst, a branchet és a worktree-t.
4. Nem ready ticket, meglévő claim, piszkos repó és hiányzó ágens-parancs mind elutasít, mutáció nélkül.
5. Az ágens nem nulla exitje `agent-failed`-et ad, a claim és a worktree megmarad, a ticket nem lép review-ba.
6. Már claimelt ticketen az újbóli `execute` elutasít, második ágenst nem indít.
7. `--inherit-context` indok nélkül elutasít; indokkal lefut, és az indok megjelenik a kimenetben.
8. A `ticket start` kimenete megnevezi az `execute`-ot mint következő lépést.
9. Teljes tesztkészlet, typecheck és mindhárom build zöld.

## Verification

Integrációs tesztek ideiglenes repóban, az ágens-parancs helyett determinisztikus szkript-dublőrrel: sikeres futás, nem nulla exit, üres eredmény, és a négy elutasítási ág. A prompt tartalmának állítása a dublőr által kapott bemenetből. `npx vitest run`, `npx tsc --noEmit`, mindhárom build.

## Constraints

A parancs nem kerülheti meg a meglévő `ticket start` szerződését és kapuit. Az ágens-indítás legyen kicserélhető, hogy tesztben dublőrrel futhasson. A hívó gépén hiányzó ágens-parancs nem okozhat félig létrejött végrehajtási kontextust.

## Open decisions

None.

## Execution notes

Az `ui` parancs már felderíti a `codex` és `claude` binárist (`commandAvailable` a `src/commands/ui.ts`-ben) — az ágens-indítás erre építhet. A brief a meglévő `ticket brief` szolgáltatás.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| workflow: happy_path_verified | Friss agens vegrehajtasa, bemenet kizarolag a 2384 tokenes brief (benne D-009). Uj parancs: 'a-team ticket execute <id> --agent <agent>' (src/commands/execute.ts). Elofeltetel-sorrend barmilyen mutacio elott: --inherit-context indok, ready allapot, nincs meglevo claim/vegrehajtasi kontextus, --agent megadva, assertClean, agens-parancs feloldva es leprobalva — igy hianyzo agens-binaris nem hagyhat felig felepitett kontextust. Utana startTicket (a szerzodese valtozatlan, nincs megkerulve) -> briefTicket -> agens inditasa a worktree-ben, a brief STDIN-en, semmi mas. Acc1: teljes ut tesztelve — claim, branch, worktree letrejon, az agens fut, ticketState 'active', a munkaja commitolva a worktree-ben, 'git status --porcelain' ures. Acc2 (a leglenyegesebb): a teszt-dublor rogziti argv+cwd+stdin, es a teszt allitja, hogy recorded.stdin PONTOSAN egyenlo a 'ticket brief --json' data.brief mezojevel — a koordinator kontextusabol semmi nem kerul at. Acc3: JSON es human kimenet is hordozza a briefTokens/briefSections, agent, agentCommand, branch, worktree mezoket. Acc4: negy elutasitas — nem ready, meglevo claim, piszkos repo, hianyzo agens-parancs —, mindegyik nem nulla exit, es utanuk nincs .worktrees/<id>, nincs branch, es a dublor egyszer sem hivodott meg. Acc5: nem nulla agens-exit (exit 3) -> ok:false, state 'agent-failed', a claim es a worktree megmarad, review-ba nem lep; az ures kimenet esete kulon teszt. Acc6: masodik 'execute' claimelt ticketen elutasit, es a dublor rogzito-fajlja bajtra azonos marad utana — masodik agens nem indult. Acc7: '--inherit-context ""' elutasit, ertek nelkul a commander utasit el, indokkal lefut es az indok megjelenik a kimenetben es a promptban is. Acc8: a 'ticket start' human kimenete tartalmazza az 'a-team ticket execute <id> --resume' sort (nextStep mezo), es a folytatott futas valoban implementalja a ticketet. Acc9 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 25 fajl / 125 passed / 1 skipped, mindharom build zold. Plusz a workflow profil megsemmisitesi agara: SIGINT egy fuggo agensnek -> EXECUTION_CANCELLED, claim es worktree serrtetlen. A launcher-varrat: A_TEAM_AGENT_COMMAND kornyezeti valtozo plusz injektalhato AgentLauncher — a tesztek soha nem inditanak valodi claude vagy codex processzt. Commit cba48c4. |
| workflow: failure_and_cancellation_paths_verified | Friss agens vegrehajtasa, bemenet kizarolag a 2384 tokenes brief (benne D-009). Uj parancs: 'a-team ticket execute <id> --agent <agent>' (src/commands/execute.ts). Elofeltetel-sorrend barmilyen mutacio elott: --inherit-context indok, ready allapot, nincs meglevo claim/vegrehajtasi kontextus, --agent megadva, assertClean, agens-parancs feloldva es leprobalva — igy hianyzo agens-binaris nem hagyhat felig felepitett kontextust. Utana startTicket (a szerzodese valtozatlan, nincs megkerulve) -> briefTicket -> agens inditasa a worktree-ben, a brief STDIN-en, semmi mas. Acc1: teljes ut tesztelve — claim, branch, worktree letrejon, az agens fut, ticketState 'active', a munkaja commitolva a worktree-ben, 'git status --porcelain' ures. Acc2 (a leglenyegesebb): a teszt-dublor rogziti argv+cwd+stdin, es a teszt allitja, hogy recorded.stdin PONTOSAN egyenlo a 'ticket brief --json' data.brief mezojevel — a koordinator kontextusabol semmi nem kerul at. Acc3: JSON es human kimenet is hordozza a briefTokens/briefSections, agent, agentCommand, branch, worktree mezoket. Acc4: negy elutasitas — nem ready, meglevo claim, piszkos repo, hianyzo agens-parancs —, mindegyik nem nulla exit, es utanuk nincs .worktrees/<id>, nincs branch, es a dublor egyszer sem hivodott meg. Acc5: nem nulla agens-exit (exit 3) -> ok:false, state 'agent-failed', a claim es a worktree megmarad, review-ba nem lep; az ures kimenet esete kulon teszt. Acc6: masodik 'execute' claimelt ticketen elutasit, es a dublor rogzito-fajlja bajtra azonos marad utana — masodik agens nem indult. Acc7: '--inherit-context ""' elutasit, ertek nelkul a commander utasit el, indokkal lefut es az indok megjelenik a kimenetben es a promptban is. Acc8: a 'ticket start' human kimenete tartalmazza az 'a-team ticket execute <id> --resume' sort (nextStep mezo), es a folytatott futas valoban implementalja a ticketet. Acc9 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 25 fajl / 125 passed / 1 skipped, mindharom build zold. Plusz a workflow profil megsemmisitesi agara: SIGINT egy fuggo agensnek -> EXECUTION_CANCELLED, claim es worktree serrtetlen. A launcher-varrat: A_TEAM_AGENT_COMMAND kornyezeti valtozo plusz injektalhato AgentLauncher — a tesztek soha nem inditanak valodi claude vagy codex processzt. Commit cba48c4. |
| workflow: authorization_and_idempotency_verified | Friss agens vegrehajtasa, bemenet kizarolag a 2384 tokenes brief (benne D-009). Uj parancs: 'a-team ticket execute <id> --agent <agent>' (src/commands/execute.ts). Elofeltetel-sorrend barmilyen mutacio elott: --inherit-context indok, ready allapot, nincs meglevo claim/vegrehajtasi kontextus, --agent megadva, assertClean, agens-parancs feloldva es leprobalva — igy hianyzo agens-binaris nem hagyhat felig felepitett kontextust. Utana startTicket (a szerzodese valtozatlan, nincs megkerulve) -> briefTicket -> agens inditasa a worktree-ben, a brief STDIN-en, semmi mas. Acc1: teljes ut tesztelve — claim, branch, worktree letrejon, az agens fut, ticketState 'active', a munkaja commitolva a worktree-ben, 'git status --porcelain' ures. Acc2 (a leglenyegesebb): a teszt-dublor rogziti argv+cwd+stdin, es a teszt allitja, hogy recorded.stdin PONTOSAN egyenlo a 'ticket brief --json' data.brief mezojevel — a koordinator kontextusabol semmi nem kerul at. Acc3: JSON es human kimenet is hordozza a briefTokens/briefSections, agent, agentCommand, branch, worktree mezoket. Acc4: negy elutasitas — nem ready, meglevo claim, piszkos repo, hianyzo agens-parancs —, mindegyik nem nulla exit, es utanuk nincs .worktrees/<id>, nincs branch, es a dublor egyszer sem hivodott meg. Acc5: nem nulla agens-exit (exit 3) -> ok:false, state 'agent-failed', a claim es a worktree megmarad, review-ba nem lep; az ures kimenet esete kulon teszt. Acc6: masodik 'execute' claimelt ticketen elutasit, es a dublor rogzito-fajlja bajtra azonos marad utana — masodik agens nem indult. Acc7: '--inherit-context ""' elutasit, ertek nelkul a commander utasit el, indokkal lefut es az indok megjelenik a kimenetben es a promptban is. Acc8: a 'ticket start' human kimenete tartalmazza az 'a-team ticket execute <id> --resume' sort (nextStep mezo), es a folytatott futas valoban implementalja a ticketet. Acc9 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 25 fajl / 125 passed / 1 skipped, mindharom build zold. Plusz a workflow profil megsemmisitesi agara: SIGINT egy fuggo agensnek -> EXECUTION_CANCELLED, claim es worktree serrtetlen. A launcher-varrat: A_TEAM_AGENT_COMMAND kornyezeti valtozo plusz injektalhato AgentLauncher — a tesztek soha nem inditanak valodi claude vagy codex processzt. Commit cba48c4. |

### Verification performed

Friss agens vegrehajtasa, bemenet kizarolag a 2384 tokenes brief (benne D-009). Uj parancs: 'a-team ticket execute <id> --agent <agent>' (src/commands/execute.ts). Elofeltetel-sorrend barmilyen mutacio elott: --inherit-context indok, ready allapot, nincs meglevo claim/vegrehajtasi kontextus, --agent megadva, assertClean, agens-parancs feloldva es leprobalva — igy hianyzo agens-binaris nem hagyhat felig felepitett kontextust. Utana startTicket (a szerzodese valtozatlan, nincs megkerulve) -> briefTicket -> agens inditasa a worktree-ben, a brief STDIN-en, semmi mas. Acc1: teljes ut tesztelve — claim, branch, worktree letrejon, az agens fut, ticketState 'active', a munkaja commitolva a worktree-ben, 'git status --porcelain' ures. Acc2 (a leglenyegesebb): a teszt-dublor rogziti argv+cwd+stdin, es a teszt allitja, hogy recorded.stdin PONTOSAN egyenlo a 'ticket brief --json' data.brief mezojevel — a koordinator kontextusabol semmi nem kerul at. Acc3: JSON es human kimenet is hordozza a briefTokens/briefSections, agent, agentCommand, branch, worktree mezoket. Acc4: negy elutasitas — nem ready, meglevo claim, piszkos repo, hianyzo agens-parancs —, mindegyik nem nulla exit, es utanuk nincs .worktrees/<id>, nincs branch, es a dublor egyszer sem hivodott meg. Acc5: nem nulla agens-exit (exit 3) -> ok:false, state 'agent-failed', a claim es a worktree megmarad, review-ba nem lep; az ures kimenet esete kulon teszt. Acc6: masodik 'execute' claimelt ticketen elutasit, es a dublor rogzito-fajlja bajtra azonos marad utana — masodik agens nem indult. Acc7: '--inherit-context ""' elutasit, ertek nelkul a commander utasit el, indokkal lefut es az indok megjelenik a kimenetben es a promptban is. Acc8: a 'ticket start' human kimenete tartalmazza az 'a-team ticket execute <id> --resume' sort (nextStep mezo), es a folytatott futas valoban implementalja a ticketet. Acc9 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 25 fajl / 125 passed / 1 skipped, mindharom build zold. Plusz a workflow profil megsemmisitesi agara: SIGINT egy fuggo agensnek -> EXECUTION_CANCELLED, claim es worktree serrtetlen. A launcher-varrat: A_TEAM_AGENT_COMMAND kornyezeti valtozo plusz injektalhato AgentLauncher — a tesztek soha nem inditanak valodi claude vagy codex processzt. Commit cba48c4.

### Deviations

Negy ertelmezes, mind nyilatkozva. (1) A '--resume' kapcsolo nincs a Scope-ban nevesitve, de a Retry szakasz kovetelmenye ('az agent-failed utani ujraprobalas a meglevo vegrehajtasi kontextust hasznalja, nem hoz letre masodikat') az Acc6 mellett enelkul elerhetetlen — explicit ujraproba/csatlakozas utkent vettem fel. (2) Az Acc8 szo szerint azt keri, hogy a start az 'execute'-ot nevezze meg; mivel az execute meglevo claimre elutasit, a start az 'execute <id> --resume' alakot irja ki, es megemliti, hogy az 'execute --agent' egy lepesben mindent elvegez. (3) A 'megszakitas az agens inditasa elott semmit nem hagy hatra' pont: a start->launch szinkron es masodperc alatti, ezert a startTicket visszagorgetese nincs implementalva; a preflight — vagyis a teljes mutacio elotti fazis — kozbeni megszakitas valoban nem hagy semmit. (4) Az '--inherit-context' nem tud szo szerint atultetni egy koordinator-beszelgetest CLI-alfolyamaton keresztul; nyilatkozott, naplozott kivetelkent valosult meg: az indok explicit deviacio-blokkkent kerul a promptba es mindket kimeneti modban megjelenik.

### Findings created

None.

### Known concerns

(a) Az '--inherit-context' nevevel tobbet iger, mint amit tesz: nem kontextust orokit, hanem indokolt kivetelt naplóz. Ha valaha valodi kontextus-atadas kell, a nev mar foglalt lesz. (b) Az agens-argumentumok agensenkent be vannak drotozva (claude: ['-p'], codex: ['exec','-']); uj agens felvetele kodvaltozas. (c) A parancs egyszerre egy ticketet futtat; a csomag-szintu parhuzamositas — ami az egesz D-009 erv gazdasagi resze — tovabbra sincs meg, es a T-035 Non-goals kifejezetten kizarta.
