---
id: T-022
title: A szomszed workspace-ek migracioja a kotta migrate paranccsal
status: done
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: P-004
depends_on:
  - T-023
blocks: []
branch: feat/T-022-a-szomszed-workspace-ek-migracioja-a-kotta-migrate-paranccsa
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-03'
assigned_agent: claude
resolution: completed
---
# T-022 — A szomszéd workspace-ek migrációja a `kotta migrate` paranccsal

## Outcome

The three neighbour workspaces — oneanda, crm-kit, flowbench — run on the current Kotta shape: `.kotta/` directory, the new vocabulary, `defined` instead of `ready`. Each migrated by running `kotta migrate`, each in its own commit, each with a green `kotta validate` afterwards.

## Context

D-006 staged the rename; T-020 made both directory names work, including under the previously released CLI; T-023 provides `kotta migrate` and migrates this repository with it. This ticket applies the same command to the neighbours.

The T-020 agent already proved the mechanics on **copies** of all three: byte-identical validate results before and after, in both symlink directions, and still green after `mv .a-team .kotta && ln -s .kotta .a-team` — even with the old released CLI. So the risk here is not whether it works, but that these are live workspaces with other people's history in them.

oneanda is the large one: 164 contracts, 101 observations, 21 batches, and 42 pre-existing validate errors that are **not ours** and must not be silently repaired by this ticket.

## Scope

- Run `kotta migrate` on each of oneanda, crm-kit and flowbench.
- One commit per repository, whose message names the command and carries its output.
- A `kotta validate` run in each, before and after, with the two outputs compared.
- Record the pre-existing error count in each repository before migrating, so the after-state can be judged against it.

## Non-goals

- Fixing any pre-existing validate error in a neighbour workspace. oneanda's 42 are recorded and left alone; repairing them is separate work with a separate owner.
- Touching product code in any neighbour repository. Only the workspace directory moves.
- Publishing or upgrading the Kotta dependency in those repositories beyond what the migration needs.
- Migrating any workspace not named here.

## Acceptance

1. Each of the three repositories has its workspace under `.kotta/`, migrated by the command rather than by hand.
2. In each, `kotta validate` after the migration reports exactly the errors it reported before — no new class, and none silently repaired. oneanda's count is 42 before and 42 after unless a difference is explained in the evidence.
3. Every cross-reference still resolves in each workspace; no identifier changed.
4. Each repository has exactly one migration commit, carrying the command's output.
5. The board opens against each migrated workspace and lists the same entity counts as before.
6. Nothing outside the workspace directory changed in any neighbour repository — shown by the diff.

## Verification

For each repository: capture `kotta validate --json` before, run `kotta migrate --dry-run`, run it, capture validate after, diff the two, and diff the working tree to prove nothing else moved. Then start the board against each and compare entity counts with the pre-migration numbers.

## Constraints

These are live repositories with other people's work in them. Migrate on a clean tree; if a repository is dirty, stop and report rather than committing around it. Never repair a pre-existing error as a side effect. Never change an identifier.

## Open decisions

None.

## Execution notes

Paths: `/Users/rp/Dev/ezchops/oneanda`, plus crm-kit and flowbench. The T-020 review evidence records the copy-based rehearsal and the exact numbers it saw, including oneanda's 42.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Contract acceptance criteria | Ket menetben, ket agens-futasban. Az elso megallt a crm-kit es a flowbench piszkos munkafajan a szerzodes Constraints kikoteset kovetve; az operator elrendezte a fajlokat, majd az agens ugyanabbol a kontextusbol folytatta. A koordinator ellenorizte, hogy az operator commitjai a workspace-hez NEM nyultak ('git diff --name-only <regi> <uj> -- .a-team' ures mindket repoban), es az agens az elrendezes utan ujra felvette az alapvonalakat es a dry-runokat — mindket kimenet bajtazonos volt a tisztitas elottivel. ONEANDA (2d0e937c, main, lokalisan): 42 hiba elotte es utana, bajtazonos hibalistaval (35 DEVIATION_MISMATCH + 7 MISSING_PROFILE_SECTION), 164 contract, 14 dontes. A commit 314 bejegyzes: 313 atnevezes (R097-R100) es egy hozzaadas, termek-kod nulla; a HEAD~1:.a-team es a HEAD:.kotta azonosito-halmaza azonos (299), a migrate maga 301 valtozatlant jelent. CRM-KIT (cad6fad, main): 0 hiba elotte es utana, 10 contract, 3 dontes; 26 bejegyzes, ebbol 25 atnevezes es a .gitattributes; 15 azonosito, azonos halmaz. FLOWBENCH (9a000ce, main): 0 hiba elotte es utana, 15 contract, 8 dontes; 63 bejegyzes: 59 atnevezes, 1 hozzaadas es HAROM TORLES (lasd deviaciok). Board-ellenorzes mindharomban: a fuggetlenul, a HEAD~1:.a-team-bol szamolt entitas-szamok pontosan egyeznek a board olvasataval (crm-kit 10/0/2/3, flowbench 15/20/6/8), 0 diagnosztika, 0 notice. Az ures-board csapda egyikben sem harapott, mert mindharom commit kozvetlenul a main-re ment. Koordinatori ujraellenorzes: mindharom repo '.kotta' alatt, munkafajuk tiszta, es a validate szamai megegyeznek a jelentessel (42/0/0). Az agens sajat worktree-je: 34 fajl / 211 passed / 1 skipped, validate ok, munkafa tiszta. |

### Verification performed

Ket menetben, ket agens-futasban. Az elso megallt a crm-kit es a flowbench piszkos munkafajan a szerzodes Constraints kikoteset kovetve; az operator elrendezte a fajlokat, majd az agens ugyanabbol a kontextusbol folytatta. A koordinator ellenorizte, hogy az operator commitjai a workspace-hez NEM nyultak ('git diff --name-only <regi> <uj> -- .a-team' ures mindket repoban), es az agens az elrendezes utan ujra felvette az alapvonalakat es a dry-runokat — mindket kimenet bajtazonos volt a tisztitas elottivel. ONEANDA (2d0e937c, main, lokalisan): 42 hiba elotte es utana, bajtazonos hibalistaval (35 DEVIATION_MISMATCH + 7 MISSING_PROFILE_SECTION), 164 contract, 14 dontes. A commit 314 bejegyzes: 313 atnevezes (R097-R100) es egy hozzaadas, termek-kod nulla; a HEAD~1:.a-team es a HEAD:.kotta azonosito-halmaza azonos (299), a migrate maga 301 valtozatlant jelent. CRM-KIT (cad6fad, main): 0 hiba elotte es utana, 10 contract, 3 dontes; 26 bejegyzes, ebbol 25 atnevezes es a .gitattributes; 15 azonosito, azonos halmaz. FLOWBENCH (9a000ce, main): 0 hiba elotte es utana, 15 contract, 8 dontes; 63 bejegyzes: 59 atnevezes, 1 hozzaadas es HAROM TORLES (lasd deviaciok). Board-ellenorzes mindharomban: a fuggetlenul, a HEAD~1:.a-team-bol szamolt entitas-szamok pontosan egyeznek a board olvasataval (crm-kit 10/0/2/3, flowbench 15/20/6/8), 0 diagnosztika, 0 notice. Az ures-board csapda egyikben sem harapott, mert mindharom commit kozvetlenul a main-re ment. Koordinatori ujraellenorzes: mindharom repo '.kotta' alatt, munkafajuk tiszta, es a validate szamai megegyeznek a jelentessel (42/0/0). Az agens sajat worktree-je: 34 fajl / 211 passed / 1 skipped, validate ok, munkafa tiszta.

### Deviations

Ket tetel, mindketto a migrate parancs viselkedeserol szol, nem a vegrehajtasrol. (1) A GYOKER .gitattributes: a migrate minden repoban letrehoz egy '.kotta/index.md merge=union' sort tartalmazo fajlt a workspace-konyvtaron KIVUL, es ezt sem a dry-run, sem az alkalmazott kimenet nem jelenti (grep-szam 0 mind a negy kimeneten). Szemantikailag helyes — a merge-attributumnak kovetnie kell az atnevezett konyvtarat —, de az Acceptance 6 ('a workspace-konyvtaron kivul semmi nem valtozott') szo szerint nem teljesul. Az agens belevette a commitba (kihagyva a fa tartosan piszkos maradna), megnevezte a commit-uzenetben, es bugkent rogzitette. (2) FLOWBENCH, harom torles: a '.a-team/.DS_Store', '.a-team/findings/.DS_Store' es '.a-team/packages/.DS_Store' KOVETETT fajlok voltak, meg abbol az idobol, amikor a flowbench .gitignore-jaban nem volt .DS_Store szabaly. A migrate a bajtokat helyesen atmozgatta — mindharom ott van a lemezen, 6148 bajtosan —, de az UJ uton a .gitignore mar illeszkedik rajuk, ezert a git nem tudja kovetni oket. Nettoban harom fajl kikerult a verziokovetesbol egy olyan atnevezes mellekhatasakent, amit a parancs vesztesegmentesnek mutat be. Az agens NEM eroltette vissza 'git add -f'-fel — az a repo sajat ignore-szabalya ellen dolgozna, es az operator eggyel korabban eppen a .gitignore-t modositotta —, hanem megnevezte a commit-uzenetben es bugkent rogzitette. Koordinatori ellenorzes: a ket fajl a lemezen megvan, kovetve nincs. A mechanizmus latens minden olyan workspace-ben, amely a sajat .gitignore-ja altal illesztett kovetett fajlt tartalmaz — legkozelebb nem biztos, hogy macOS-szemet lesz.

### Observations created

Negy, mind --discovered-during T-022. (1) bug — a 'kotta migrate' bejelentes nelkul ir gyoker-szintu .gitattributes-t, sem dry-runban, sem utana. (2) improvement — nincs elovett alapvonal: a 'kotta validate' elutasitja a pre-vocabulary workspace-t, ezert a szerzodes sajat elotte/utana osszevetese EGY eszkozzel nem futtathato; javaslat, hogy a --dry-run adja meg az elorejelzett migracio-utani validate-eredmenyt. (3) process — a crm-kit es a flowbench idegen piszkos fan elakadt, a proba-szamokkal egyutt rogzitve, hogy a munka folytathato legyen (ez azota megoldodott). (4) bug — a workspace atnevezese kiejti a verziokovetesbol azokat a kovetett fajlokat, amelyekre az uj uton mar illeszkedik a .gitignore, es ezt sehol nem jelenti.

### Known concerns

(a) Egyik migracios commit sincs pusholva: a oneanda egy commitnyira van az origin/main elott, a crm-kitnek es a flowbenchnek nincs remote-ja. (b) Mindharom commit KOZVETLENUL a main-en all, nem branchen — ez tudatos volt (a board igy nem olvas uresen, es idegen repoban nem marad kobor branch), de eltér a szokasos ag-higienetol. (c) A flowbench harom .DS_Store fajlja a lemezen megvan, de verziokovetesen kivul; ha valaki klonozza a repot, ezek nem jonnek vele — ez ebben az esetben ertektelen, de a mechanizmus nem az. (d) A oneanda 42 hibaja tovabbra is erintetlen es a mienk sem; kulon munka, kulon gazdaval.
