---
id: T-028
title: >-
  The CLI is not reachable where the work happens, and the skills are bypassed —
  831 a-team commands, 5 skill invocations
status: backlog
origin: observation
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-023
---
# T-028 — A kotta bináris legyen elérhető minden worktree-ben és subshellben

## Outcome

Az `a-team` (később `kotta`) parancs megbízhatóan fut minden olyan helyen, ahová a szerszám maga küldi az ágenseket: worktree-kben, subshellekben, nem-interaktív shellekben. A `command not found: a-team` hibaosztály megszűnik.

## Context

Az F-023 mérése (oneanda, 2026-07-31/08-01): 12× `command not found: a-team` worktree-kben és subshellekben; az operátornak kézzel kellett abszolút útvonalat írnia a promptba (`/Users/rp/.nvm/.../bin/a-team`), az ágensek `export PATH=...` prefixekkel kerülgették. A bináris nvm-mel települ, a nem-interaktív shell viszont nem tölti be az nvm-környezetet — a szerszám a saját ágenseinek nem elérhető.

A finding másik fele (skillek megkerülése) NEM ennek a ticketnek a tárgya: azt a D-009 + T-026 kezeli szerkezetileg.

## Scope

- A `ticket start` / worktree-létesítés garantálja, hogy a worktree-ben futó ágens megtalálja a CLI-t: a claim vagy a brief hordozza a feloldott abszolút binárisútvonalat, és/vagy a worktree kap egy `.a-team/bin` szimlinket a feloldott binárisra.
- A skillek (`execute-ticket`, `execute-package`, `start-ticket`) a feloldott útvonalat használják, ne a PATH-ban bízzanak.
- Diagnosztika: `a-team doctor` vagy a `validate` jelzi, ha a bináris nem oldható fel nem-interaktív shellből.
- Dokumentáció: telepítési megjegyzés az nvm-ös környezetről.

## Non-goals

- Nem csomagolás-átalakítás (nem standalone bináris build) — az a rename/publish (T-020) utáni kérdés lehet.
- Nem érinti a skill-megkerülés problémát (D-009/T-026 kezeli).

## Acceptance

1. Friss worktree-ben, nem-interaktív shellből (`sh -c`) a CLI meghívható a claim/briefben hordozott útvonalon, PATH-beállítás nélkül — teszttel bizonyítva.
2. Az execute-flow skillek a feloldott útvonalra hivatkoznak; nincs bennük csupasz `a-team` hívás PATH-feltételezéssel.
3. A diagnosztika kimondja, ha a feloldás nem lehetséges, és megmondja a javítást.
4. A oneanda workspace-ben reprodukált 12-féle hibahelyzet közül egy sem áll elő újra — füstteszttel.

## Constraints

- A megoldás ne függjön nvm-től, homebrew-tól vagy konkrét shell-től — a feloldott abszolút útvonal az igazság.
- A worktree-be tett hivatkozás nem kerülhet a repóba (gitignore vagy claim-mező).

## Execution notes

A legkisebb jó megoldás valószínűleg: a `ticket start` a claim YAML-ba írja a `process.execPath` + CLI-entrypoint feloldott útvonalát, és a brief kiírja. A skillek onnan olvassák.

## Verification

Integrációs teszt nem-interaktív shell-hívással; füstteszt egy valós worktree-ben.

## Open decisions

None.
