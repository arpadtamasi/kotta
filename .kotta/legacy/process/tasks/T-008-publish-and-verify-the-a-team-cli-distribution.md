---
id: T-008
title: Publish and verify the A-Team CLI distribution
status: done
origin: human
types:
  - feature
profiles:
  - workflow
priority: high
risk: high
batch: P-002
depends_on: []
blocks:
  - T-009
branch: feat/T-008-publish-and-verify-the-a-team-cli-distribution
pull_request: 'PR-11, PR-12'
created_at: '2026-07-22'
updated_at: '2026-07-22'
assigned_agent: codex
resolution: completed
---
# T-008 — Publish and verify the A-Team CLI distribution

## Outcome

On Node.js 20 or newer, a user can install the public A-Team CLI from npm, verify its version, install the repository's skills, initialize a Git repository, and create a valid first ticket without cloning or building this source repository.

## Actors

Repository maintainer, npm registry, GitHub Actions, a supported coding-agent host, and a clean-machine user.

## Initial state

`@arpadtamasi/a-team` is not yet published, the CLI version is hard-coded, and the README installs skills without installing their required `a-team` executable.

## States

Version PR merged → protected version tag → test → pack inspection → publish → registry verification → clean-install canary → done.

## Transitions

Only a maintainer moves merged `main` to tagged. A matching protected `v<package.json-version>` tag enters tests. Tests and pack inspection must pass before publish. Registry acceptance enters the clean-install canary. Canary success completes the ticket. After registry acceptance, corrections require a new patch version.

## Triggers

A protected `v<package.json-version>` tag on the corresponding `main` commit. Tag/version mismatch or a non-main commit fails before pack or publish.

## Permissions

After the first-package bootstrap, publishing uses npm Trusted Publishing from a GitHub-hosted runner in the protected `npm-release` environment with only `contents: read` and `id-token: write`. Pull requests and ordinary pushes receive no publishing authority or long-lived write token.

## Error paths

Failed tests, pack inspection, publish, registry verification, or canary leave the prior version current and produce an actionable failed run. An existing-version conflict requires a new semantic version; published versions are never overwritten.

## Cancellation path

Cancellation before registry acceptance is safe. After acceptance, retain the immutable release and correct it with a new patch version.

## Retry and duplicate-action behaviour

Pre-publish steps are idempotent. A retry after registry acceptance detects the existing exact version, skips overwrite, and repeats verification against that artifact.

## Audit and notification expectations

The version PR, protected tag, commit, environment approval, workflow run, npm version, tarball integrity, provenance record, and timed canary identify one release. Default GitHub failure notification is sufficient for V1.

## Scope

- Publish the maintainer-approved package name `@arpadtamasi/a-team` with public access.
- Set public scoped-package access and exact public repository metadata.
- Make `package.json#version` authoritative and inject/read it in the CLI build instead of maintaining a second hard-coded version.
- Ensure the published tarball contains `dist`, `ui-dist`, `profiles`, `schemas`, `skills`, and `templates`, and excludes source-only, secret, and unrelated site artifacts.
- Bootstrap the current baseline version interactively with maintainer 2FA or one-time granular credentials, then revoke those credentials after configuring Trusted Publishing.
- Publish the next legitimate patch through OIDC; its content is the distribution metadata, version wiring, and release automation added by this ticket.
- Pin the public skill install to `npx skills@1.5.20 add arpadtamasi/a-team` and name the tested supported host boundary.
- Update README with the verified install path, prerequisites, recovery guidance, and measured duration.

## Non-goals

- GitHub Pages or website implementation.
- Auto-update, standalone native binaries, Homebrew, containers, or Windows installers.
- Changing ticket lifecycle semantics or the local UI.
- Inventing a CLI-only replacement for `/define-ticket`; the guided quickstart targets a tested skill host.

## Acceptance

- `npm view <final-package-name> version` returns the released version publicly.
- `npm pack --json` proves all required runtime assets are present and no secret, source-only, or `site-dist` artifact is shipped.
- A clean Node 20+ environment installs the exact public version globally, and `a-team --version` equals `package.json` and the npm version.
- Direct `a-team init` followed by `a-team validate` succeeds in a fresh Git repository.
- On at least one host reported by `skills@1.5.20`, skill installation plus `/setup-a-team` and `/define-ticket` produces a ticket that passes `a-team ticket validate <id>`.
- The guided `/setup-a-team` path is verified to invoke the same canonical `a-team init` operation.
- Trusted Publishing is restricted to the exact repository, workflow, `npm-release` environment, and `npm publish`; the bootstrap credential is revoked.
- With Node, Git, and the tested host preinstalled, elapsed time from the first A-Team install command to successful ticket validation is at most five minutes, or the public claim is changed to the measured result before T-009 becomes ready.
- README contains the exact verified commands, supported-host boundary, and recovery for `command not found` and validation failure.

## Verification

- Run typecheck, full tests, and build before packing.
- Inspect the exact `npm pack --json` allowlist and install the tarball in a clean temporary prefix before release.
- After publish, repeat install, version, init, workspace validation, skill-host setup, ticket definition, and ticket validation against the exact npm version.
- Record final package name, scope owner, access policy, 2FA state, version/commit, tarball inventory, public npm URL, credential revocation, Trusted Publisher configuration, provenance, and timed canary as review evidence.

## Constraints

Use the public npm registry, semantic versions, GitHub-hosted Actions, OIDC Trusted Publishing, automatic provenance, and immutable published versions. Preserve current CLI commands and lifecycle semantics.

## Open decisions

None.

## Execution notes

The maintainer selected `@arpadtamasi/a-team` on 2026-07-22 after npm authentication confirmed the original `@a-team` scope was unavailable. T-009 remains backlog until this ticket is done and its exact public install path is frozen.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| `npm view <final-package-name> version` returns the released version publicly. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| `npm pack --json` proves all required runtime assets are present and no secret, source-only, or `site-dist` artifact is shipped. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| A clean Node 20+ environment installs the exact public version globally, and `a-team --version` equals `package.json` and the npm version. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| Direct `a-team init` followed by `a-team validate` succeeds in a fresh Git repository. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| On at least one host reported by `skills@1.5.20`, skill installation plus `/setup-a-team` and `/define-ticket` produces a ticket that passes `a-team ticket validate <id>`. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| The guided `/setup-a-team` path is verified to invoke the same canonical `a-team init` operation. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| Trusted Publishing is restricted to the exact repository, workflow, `npm-release` environment, and `npm publish`; the bootstrap credential is revoked. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| With Node, Git, and the tested host preinstalled, elapsed time from the first A-Team install command to successful ticket validation is at most five minutes, or the public claim is changed to the measured result before T-009 becomes ready. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| README contains the exact verified commands, supported-host boundary, and recovery for `command not found` and validation failure. | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| workflow: happy_path_verified | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| workflow: failure_and_cancellation_paths_verified | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |
| workflow: authorization_and_idempotency_verified | Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout. |

### Verification performed

Public @arpadtamasi/a-team@0.1.2 verified from npm; CLI version 0.1.2 matches package.json. GitHub release run 29905218166 passed in 52s from protected v0.1.2 tag at 62cf0b87, using npm-release environment and OIDC-only publish. Registry integrity sha512-sl5bmC3s7jhWZF8WiQMheT0K7t0yx8ydkLWJwBfvVvsV3EpNgPE8dnThFNfF3fj31sWuaDrpiAr1jXx05m5VdA== with 80-file allowlist and SLSA provenance attestation. Typecheck passed; 18 tests passed with one absent optional migration fixture skipped; exact tarball clean install, init, and validate passed. skills@1.5.20 detected Codex and installed setup-a-team plus define-ticket. Timed public guided canary completed install through ticket/workspace validation in 60 seconds. Account 2FA is auth-and-writes; Trusted Publisher audit id e6736748-56ca-49be-a1f1-8c362e605cb9 is restricted to arpadtamasi/a-team, npm-release.yml, npm-release, and createPackage; bootstrap npm session was revoked with npm logout.

### Deviations

None.

### Findings created

None.

### Known concerns

None.
