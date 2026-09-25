---
id: T-01kz1g2vvgqvvzef92qdtczv8w
title: >-
  Nincs CLI-ut egy csomag lezarasara, ha a ticketjei a csomag-folyamaton kivul
  keszultek el
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
  fix/T-01kz1g2vvgqvvzef92qdtczv8w-nincs-cli-ut-egy-csomag-lezarasara-ha-a-ticketjei-a-csomag-f
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-01kz1fndr7se26q7bcpv49d2hk
assigned_agent: claude
resolution: completed
---
# T-01kz1g2vvgqvvzef92qdtczv8w — >-

## Outcome

A package whose tickets all reached `done` can be closed through the CLI, whatever path the tickets took. `package status` never reports `backlog` for a package whose work is finished.

## Context

P-005, 2026-08-02: all three member tickets (T-034, T-036, T-035) are `done`, but the package still sits in `backlog` and no command can move it. The `package` verbs are new, add, remove, validate, ready, start, status, dedupe, finalize — there is no `close`.

Automatic completion lives in `updateContainingPackage` (`src/commands/ticket.ts`), but it scans only `.a-team/packages/active` and only runs on a ticket `close`/`cancel`. So a package whose tickets are executed one by one — which since T-035 (`ticket execute`) is a common path, not an exception — never becomes active, and therefore never becomes done.

The apparent workaround is a dead end: `package ready --approve` + `package start` moves the package to `active` and opens a coordinator branch, but there is then no closable ticket left to flip it to `done` — the package would be stuck worse than now.

## Scope

- A supported path to close a package whose member tickets are all in a terminal state, from any package state.
- `updateContainingPackage` also considers packages outside `active`, so the common path completes on its own.
- Refusal with a clear reason when a member ticket is not terminal.

## Non-goals

- Coordinator-branch cleanup — that is `package finalize` (T-015) and runs after this.
- Retroactively repairing other workspaces.
- Changing package membership or the ready/start contract.

## Acceptance

1. A package in `backlog` whose members are all `done` can be closed through the CLI and lands in `packages/done`; `package status` reports `done`.
2. Closing a package with a non-terminal member is refused, names the member, and changes nothing.
3. Closing the last ticket of a package that never went `active` completes the package without a separate command.
4. Human approval is required.
5. P-005 in this repository closes with the new path.
6. Full suite, typecheck and builds green; `a-team validate` ok.

## Verification

Integration tests over a temp repo: package with all-done members closed from `backlog`; refusal for a mixed package with a before/after snapshot; the auto-completion path. Then run it on P-005 here.

## Constraints

Closing a package must not alter its tickets. All mutations go through supported writers. A refusal leaves package and tickets untouched.

## Open decisions

None.

## Execution notes

`src/commands/package.ts` and `updateContainingPackage` in `src/commands/ticket.ts`. `closeTicket` is the closest existing shape for approval and commit conventions.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Friss agens, bemenet kizarolag a 833 tokenes brief. Uj closePackage(id, approved, root) a src/commands/package.ts-ben es 'a-team package close <id> [--approve]' a CLI-ben; az updateContainingPackage (src/commands/ticket.ts) mostantol a packages/{backlog,ready,active} konyvtarakat pasztazza, nem csak az active-ot. Viselkedes: --approve nelkul elutasit; megnevezi minden nem-done tagot EFFEKTIV allapottal (a sajat worktree-jeben futo ticket 'active'-kent latszik, nem 'ready'-kent); assertClean barmely iras elott; a fajlt packages/done-ba mozgatja status: done-nal, ujragenralja az indexet es commitol; ticketet soha nem erint; mar done csomagon no-op (changed:false, nincs commit). Acc1: backlog csomag, minden tagja done -> lezarhato, a packages/backlog fajl eltunik, a packages/done fajl status: done, a 'package status' done-t mond. Acc2: nem-terminalis taggal elutasit, a kimenet tartalmazza a '<T-id> is ready' szoveget, es a git-pillanatkep (porcelain + HEAD + ls-files .a-team) valamint a csomag-fajl bajtjai valtozatlanok. Acc3: valodi eletciklus (ticket start -> worktree commit -> ticket review -> merge -> ticket close) egy olyan csomagon, amely SOSEM lepett active-ba: az utolso ticket lezarasa maga viszi packages/done-ba, kulon parancs nelkul. Acc4: jovahagyas nelkul exit 1, 'Human close approval is required', pillanatkep valtozatlan. Acc5: a P-005-ot az agens fixture-on bizonyitotta, nem eles allapoton — a valodi .a-team masolata egy friss temp repoban, benne az igazi P-005 (backlog, tagjai T-034/T-036/T-035 mind done): ott a status backlog, a --approve nelkuli close elutasit, a jovahagyottal ok:true/changed:true, a fajl packages/done-ba kerul, a status done, a validate ok, es a 'git show --stat' EGYETLEN valtozott fajlt mutat (a csomag atnevezese + a status sor) — ticket nem mozdult. Az eles P-005-ot a koordinator zarja le a merge utan. Acc6 (koordinatori ujrafuttatas a main beemelese UTAN): 'npm run build:cli' zold, 'npx tsc --noEmit' tiszta, 'npx vitest run' 26 fajl / 134 passed / 1 skipped. |

### Verification performed

Friss agens, bemenet kizarolag a 833 tokenes brief. Uj closePackage(id, approved, root) a src/commands/package.ts-ben es 'a-team package close <id> [--approve]' a CLI-ben; az updateContainingPackage (src/commands/ticket.ts) mostantol a packages/{backlog,ready,active} konyvtarakat pasztazza, nem csak az active-ot. Viselkedes: --approve nelkul elutasit; megnevezi minden nem-done tagot EFFEKTIV allapottal (a sajat worktree-jeben futo ticket 'active'-kent latszik, nem 'ready'-kent); assertClean barmely iras elott; a fajlt packages/done-ba mozgatja status: done-nal, ujragenralja az indexet es commitol; ticketet soha nem erint; mar done csomagon no-op (changed:false, nincs commit). Acc1: backlog csomag, minden tagja done -> lezarhato, a packages/backlog fajl eltunik, a packages/done fajl status: done, a 'package status' done-t mond. Acc2: nem-terminalis taggal elutasit, a kimenet tartalmazza a '<T-id> is ready' szoveget, es a git-pillanatkep (porcelain + HEAD + ls-files .a-team) valamint a csomag-fajl bajtjai valtozatlanok. Acc3: valodi eletciklus (ticket start -> worktree commit -> ticket review -> merge -> ticket close) egy olyan csomagon, amely SOSEM lepett active-ba: az utolso ticket lezarasa maga viszi packages/done-ba, kulon parancs nelkul. Acc4: jovahagyas nelkul exit 1, 'Human close approval is required', pillanatkep valtozatlan. Acc5: a P-005-ot az agens fixture-on bizonyitotta, nem eles allapoton — a valodi .a-team masolata egy friss temp repoban, benne az igazi P-005 (backlog, tagjai T-034/T-036/T-035 mind done): ott a status backlog, a --approve nelkuli close elutasit, a jovahagyottal ok:true/changed:true, a fajl packages/done-ba kerul, a status done, a validate ok, es a 'git show --stat' EGYETLEN valtozott fajlt mutat (a csomag atnevezese + a status sor) — ticket nem mozdult. Az eles P-005-ot a koordinator zarja le a merge utan. Acc6 (koordinatori ujrafuttatas a main beemelese UTAN): 'npm run build:cli' zold, 'npx tsc --noEmit' tiszta, 'npx vitest run' 26 fajl / 134 passed / 1 skipped.

### Deviations

A szerzodestol nincs eltres. Ket iteleti dontes review-ra: (a) a close mar done csomagon idempotens no-op, nem hiba — igy egy ujraprobalo koordinatornak nem kell allapotra elagaznia; (b) tiszta munkafat kovetel (assertClean), a 'ticket close' mintajara.

### Findings created

F-01kz1kb601ce79vwj48et554b5 — a schemas/package.schema.json 'additionalProperties: false'-t hasznal, de nincs benne 'coordinator' property, tehat elutasitana minden olyan csomagot, amit a T-015 ota a 'package start' ir; ugyanakkor a sema a kodbol sehonnan nincs hivatkozva (a validatePackage kezzel irt ellenorzeseket vegez). Rogzitve, nem javitva.

### Known concerns

(a) A fenti finding ketto bajt jelez egyszerre: a sema elavult ES nincs hasznalatban — vagyis a schemas/ konyvtar ma dekoracio, nem kapu. (b) A close az effektiv ticket-allapotra tamaszkodik, ami a duplikalt allapotu entitasoknal ma a legkorabbi peldanyt adja — ezt a kanonikus-olvasat ticket (T-01kz1g2w1fs2qx0bs72e9pkmg4) rendezi; addig egy merge-duplikalt tag felrevezetheti a lezarast.
