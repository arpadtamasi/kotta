---
id: T-01kz1g2vra99x0xhw144x6rke4
title: decision create fails in a fresh worktree when .a-team/decisions is empty
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
  fix/T-01kz1g2vra99x0xhw144x6rke4-decision-create-fails-in-a-fresh-worktree-when-a-team-decisi
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-01kz1dbnrr9tcghwnr1rg6fqm9
assigned_agent: claude
resolution: completed
---
# T-01kz1g2vra99x0xhw144x6rke4 — decision create fails in a fresh worktree when .a-team/decisions is empty

## Outcome

`a-team decision create` works in a freshly created worktree. A missing `.a-team/decisions` directory is created by the writer instead of crashing with `ENOENT`.

## Context

Discovered during T-034. Git does not carry empty directories into a linked worktree, so `.a-team/decisions` is absent there until something writes into it. `decision create` reads the directory before writing and fails with `ENOENT: scandir <worktree>/.a-team/decisions`. Reproduced: `git init` + `a-team init` + `git worktree add` + `decision create --approve`.

Every other writer — `finding`, `package`, `ready`, `review`, `close`, `cancel`, and since T-034 `ticket new` — already creates its directory first. This is the last one missing the same line.

## Scope

- Create `.a-team/decisions` when it is absent, before reading or writing, in the decision writer.
- Regression test that runs `decision create` in a linked worktree whose `.a-team/decisions` does not exist.

## Non-goals

- Any change to decision identity, validation, or the `--id` contract.
- Auditing other writers for the same class of gap beyond decisions.

## Acceptance

1. `decision create --from <draft> --approve` succeeds in a linked worktree with no `.a-team/decisions` directory, and the record lands in that worktree.
2. The created decision passes `a-team validate`.
3. Behaviour in a normal checkout is unchanged.
4. Full suite, typecheck and builds green.

## Verification

Integration test creating a temp repo, `a-team init`, `git worktree add`, then `decision create` inside the worktree. `npx vitest run`, `npx tsc --noEmit`, `npm run build:cli`.

## Constraints

The fix is a directory creation only; it must not change what a decision record contains or how its id is derived.

## Open decisions

None.

## Execution notes

`src/core/decision.ts` / `src/commands/decision.ts`; compare with how `newFinding` prepares its directory.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Friss agens, bemenet kizarolag a 649 tokenes brief. A javitas egyetlen sor a src/commands/decision.ts-ben: mkdirSync(directory, {recursive:true}) kozvetlenul a duplikatum-pasztazo readdirSync ELOTT, kommenttel arrol, hogy a git nem viszi at az ures konyvtarakat linkelt worktree-be. Reprodukcio a javitas elott: temp repo + a-team init + git worktree add, majd a worktree-ben 'decision create --from src.md --approve --json' -> ENOENT scandir <wt>/.a-team/decisions, exit 1. Acc1: ugyanaz a forgatokonyv a javitas utan ok:true, a rekord a WORKTREE .a-team/decisions konyvtaraba kerul, es a fokonyvtar decisions konyvtara bizonyitottan ures marad (ls -A). Acc2: a worktree-ben futtatott validate ok:true, decisions:1. Acc3: valtozatlan viselkedes normal checkoutban — ott is ok:true, es a 6 meglevo decision-teszt (kozte a konkurens iro id-foglalasa es az injektalt hiba utani takaritas) valtozatlanul zold. Acc4 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 26 fajl / 130 passed / 1 skipped, build zold. Az agens regresszio-orszemet is futtatott: a compiled dist-bol kiszedve az mkdirSync-et az uj teszt elbukik — vagyis a teszt valoban ezt a hibat fogja. Koordinatori diff-ellenorzes: 'git diff --stat main...HEAD' 6 fajl, ebbol a kodvaltozas 5 sor a decision.ts-ben es 27 sor uj teszt. Commit 6c46a91. |

### Verification performed

Friss agens, bemenet kizarolag a 649 tokenes brief. A javitas egyetlen sor a src/commands/decision.ts-ben: mkdirSync(directory, {recursive:true}) kozvetlenul a duplikatum-pasztazo readdirSync ELOTT, kommenttel arrol, hogy a git nem viszi at az ures konyvtarakat linkelt worktree-be. Reprodukcio a javitas elott: temp repo + a-team init + git worktree add, majd a worktree-ben 'decision create --from src.md --approve --json' -> ENOENT scandir <wt>/.a-team/decisions, exit 1. Acc1: ugyanaz a forgatokonyv a javitas utan ok:true, a rekord a WORKTREE .a-team/decisions konyvtaraba kerul, es a fokonyvtar decisions konyvtara bizonyitottan ures marad (ls -A). Acc2: a worktree-ben futtatott validate ok:true, decisions:1. Acc3: valtozatlan viselkedes normal checkoutban — ott is ok:true, es a 6 meglevo decision-teszt (kozte a konkurens iro id-foglalasa es az injektalt hiba utani takaritas) valtozatlanul zold. Acc4 (koordinatori ujrafuttatas): 'npx tsc --noEmit' tiszta, 'npx vitest run' 26 fajl / 130 passed / 1 skipped, build zold. Az agens regresszio-orszemet is futtatott: a compiled dist-bol kiszedve az mkdirSync-et az uj teszt elbukik — vagyis a teszt valoban ezt a hibat fogja. Koordinatori diff-ellenorzes: 'git diff --stat main...HEAD' 6 fajl, ebbol a kodvaltozas 5 sor a decision.ts-ben es 27 sor uj teszt. Commit 6c46a91.

### Deviations

Ket apro tetel a Scope betujen tul. (1) CHANGELOG-bejegyzes a repo per-javitas konvencioja szerint (ahogy a T-034/T-035/T-036 is kapott); a teljes mintazott ticket-azonositot idezi, nem talal ki hozza szekvencialis szamot. (2) A teszt endsWith-szel allitja a visszaadott utat pontos egyezes helyett, mert a macOS mkdtemp /var/... utat ad, a CLI viszont /private/var/...-ra oldja fel.

### Findings created

None.

### Known concerns

A Non-goals kizarta a tobbi iro atvizsgalasat, tehat nem tudjuk, maradt-e meg hasonlo hely; a T-034 mar javitotta a 'ticket new'-t, ez a decisions-t — a mintazat ket kulon alkalommal jott elo, ami arra utal, hogy erdemes lenne egyszer vegigmenni az osszes iron. Ez kulon munka.
