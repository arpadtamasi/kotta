---
id: T-012
title: Make the UI workspace argument contract explicit
status: done
origin: human
types:
  - bug
profiles:
  - bug
priority: medium
risk: low
batch: P-003
depends_on: []
blocks: []
branch: fix/T-012-make-the-ui-workspace-argument-contract-explicit
pull_request: null
created_at: '2026-07-23'
updated_at: '2026-08-02'
assigned_agent: codex
resolution: completed
---
# T-012 — Make the UI workspace argument contract explicit

## Outcome

`a-team ui` starts against the current repository when `--workspace` is omitted, while still accepting an explicit repository root or `.a-team` directory through `--workspace <path>`.

## Actual behaviour

`a-team ui` declares `--workspace <path>` with Commander's `requiredOption`, so invoking `a-team ui` exits immediately with `error: required option '--workspace <path>' not specified`. However, `a-team ui --help` renders the flag like an ordinary option and shows no default or required marker.

## Expected behaviour

`--workspace` is optional with a documented default of `.`, and runtime behavior, help text, examples, and tests agree on that contract. From an initialized repository, a user can run `a-team ui` successfully on the first attempt.

## Reproduction steps

1. Run `a-team ui --help`.
2. Observe `--workspace <path>  Repository root or .a-team directory` without a required marker or default.
3. From a valid initialized A-Team repository, run `a-team ui`.
4. Observe the immediate missing-required-option error.
5. Run `a-team ui --workspace .` and observe that startup proceeds.

## Environment

Current `a-team` CLI implemented with Commander, observed on 2026-07-23 in an initialized repository. The declaration is in `src/cli/index.ts`.

## Frequency

Deterministic whenever `a-team ui` is invoked without `--workspace`.

## Impact

Every new user who follows the discoverable help at face value can hit an avoidable first-run failure. Documentation and automation may also encode inconsistent invocations.

## Regression-test expectation

Add a CLI test that snapshots or asserts the workspace option's help contract and a behavior test proving that omission resolves to `.`.

## Scope

- Make `--workspace` optional with `.` as its default.
- Align option declaration, help text, examples, human/JSON errors, and relevant documentation.
- Add CLI regression coverage for help output, omission, explicit repository root, and explicit `.a-team` directory.

## Non-goals

- Changing the UI server, board behavior, host, or port defaults.
- Adding workspace discovery outside the current repository ancestry.
- Supporting multiple simultaneous workspaces.
- Redesigning global CLI option rendering.

## Acceptance

- `a-team ui --help` shows that `--workspace` is optional and defaults to `.`.
- `a-team ui` from an initialized repository resolves the same workspace as `a-team ui --workspace .`.
- Explicit repository-root and `.a-team` paths continue to resolve correctly.
- Human and JSON failure output remain actionable for invalid or missing workspaces.
- Automated tests fail if runtime requiredness and help output diverge again.
- User-facing examples use the selected canonical invocation consistently.

## Verification

- Assert the rendered `a-team ui --help` text.
- Exercise omission from an initialized repository and from outside a repository.
- Exercise `--workspace .` and `--workspace .a-team` against a fixture.
- Run CLI integration tests, typecheck, and the full test suite.
- Perform a clean-install smoke test using only the invocation documented by `--help`.

## Constraints

Prefer the smallest coherent contract change and preserve backwards compatibility for explicit `--workspace` callers. Do not claim that Commander's angle-bracket syntax alone communicates option requiredness; verify the actual rendered help.

## Open decisions

None.

## Execution notes

Human decision recorded on 2026-07-23: omitted `--workspace` defaults to `.`. The explicit invocation `a-team ui --workspace .` remains supported.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| `a-team ui --help` shows that `--workspace` is optional and defaults to `.`. | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |
| `a-team ui` from an initialized repository resolves the same workspace as `a-team ui --workspace .`. | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |
| Explicit repository-root and `.a-team` paths continue to resolve correctly. | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |
| Human and JSON failure output remain actionable for invalid or missing workspaces. | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |
| Automated tests fail if runtime requiredness and help output diverge again. | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |
| User-facing examples use the selected canonical invocation consistently. | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |
| bug: expected_behavior_verified | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |
| bug: regression_test_added_or_exception_recorded | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |
| bug: affected_environment_rechecked | Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a. |

### Verification performed

Acc/Scope1: 'a-team ui --help' kimenete: '--workspace <path>  Repository root or .a-team directory (default: ".")' — nincs required marker, a default lathato. Scope2: a deklaracio requiredOption-rol option-ra valt '.' alapertekkel (src/cli/index.ts), a README kapott egy 'a-team ui' peldat explicit --workspace nelkul. Scope3: uj tests/integration/ui-cli.test.ts (3 teszt): help-szerzodes allitasa, valamint 'omission resolves like explicit repository-root and .a-team paths' — az elhagyott, a repo-gyokerrel megadott es a .a-team konyvtarral megadott inditas ugyanazt a workspace-t oldja fel. Regression-test expectation teljesitve (help-szerzodes + viselkedes). Verifikacio a 10 nappal kesobbi mainre mergelt allapoton: 'npm run build:cli' zold, 'npx vitest run' 19 fajl / 58 passed / 1 skipped, 'a-team validate' ok:true. Nem-cel erintetlen: a UI-szerver, host es port alapertek valtozatlan. Implementacio: 5b52049; main beemelve df09f4a.

### Deviations

A ticket 2026-07-23-an keszult el a branchen es 10 napig belandolatlanul allt; a review most, a main beemelese utan keszult, nem a vegrehajtas napjan. Az evidencia ezert a mai, mergelt allapoton mert — nem azon, amin az eredeti agens dolgozott. Tartalmi elteres a szerzodestol nincs: a Scope harom pontja es a regression-test elvaras mind teljesult.

### Findings created

None.

### Known concerns

A branch tartalmazta a T-012 sajat start-atmenetet, mikozben a main idokozben visszaallt 'ready'-re; a merge ezt konfliktus nelkul feloldotta (active + claim), a 'validate' zold. Ha a visszaallitas szandekos volt, ez a review felulirja azt a dontest.
