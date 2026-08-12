---
id: T-01kztp3e01729h4655n34p7qcp
title: >-
  Kotta ships its own rules file and offers a pointer, without ever owning the
  project's AGENTS.md
status: defined
origin: human
types:
  - feature
profiles:
  - workflow
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-12'
updated_at: '2026-08-12'
---
# T-01kztp3e01729h4655n34p7qcp — Kotta ships its own rules file and offers a pointer, without ever owning the project's AGENTS.md

## Outcome

An agent that opens a Kotta project finds the rules it must follow **and** the command that installs
the tool those rules require, in a file Kotta ships and keeps current. The project's own `AGENTS.md`
is never rewritten: Kotta offers one pointer line and adds it only on an explicit yes.

## Measured problem

On 2026-08-12 an agent running in a hosted environment (claude.ai web) against a Kotta workspace
reported that it could not proceed at all: no `kotta` CLI, no public npm package it could find, and
`AGENTS.md` forbidding the hand-edit that would otherwise be the way out.

Half of that is a wrong conclusion from a correct observation. `npm view @arpadtamasi/kotta version`
returns `0.5.0`; `npm view kotta` is a 404. The binary is `kotta`, the package is scoped, and an
agent reasoning from one to the other stops.

The other half is the hole, and it is larger than the report. **Kotta ships no `AGENTS.md` at all.**
There is no `templates/AGENTS.md`; `kotta init` does not write one; `skills/setup-kotta/SKILL.md`
never mentions the file. The only way it reaches a project is a human copying it out of the Kotta
repository, which is also why the install line at `README.md:20` never travels with it. The document
that states "the CLI is the whole interface" and "never hand-edit workspace files" names neither the
package nor the install command anywhere in its 120 lines, and then closes the last door.

The obvious fix — have `init` write `AGENTS.md` — is the wrong one, and the operator said why: *"nem
írhatja felül egyáltalán, ott lehet más is."* In a real project that file carries the project's own
conventions; this repository's copy carries a "This repository" section. A generator that overwrites
it forfeits exactly the trust its other rules depend on. `D-01kztp2epe4sehb25mpv7hc33b` records the
resulting split: Kotta owns a file under `.kotta/`, which it already owns entirely, and touches the
project's file only by invitation.

## Actors

- **Human.** Decides whether the pointer line is added to their `AGENTS.md`. It is their file, and
  the decision is one line, reversible by deleting it.
- **Calling agent.** Runs `init` or `sync`, reads back the exact line Kotta reports, asks the human
  in chat, and re-runs with the flag on an explicit yes.
- **Kotta.** Writes and refreshes `.kotta/AGENTS.md`, reports drift, appends the pointer when asked,
  and refuses to touch anything else in the project's file.

## Initial state

An initialized or about-to-be-initialized repository, in one of three shapes: no `AGENTS.md`; an
`AGENTS.md` carrying the project's own content; or an `AGENTS.md` that already contains the pointer.

## States

For `.kotta/AGENTS.md`, mirroring the states `sync` already distinguishes for skills:

- **absent** — never written, or deleted.
- **current** — byte-identical to the shipped template rendered for this workspace.
- **drifted** — present and different, because Kotta was upgraded or because someone edited it.

For the project's `AGENTS.md`:

- **unlinked** — no pointer to `.kotta/AGENTS.md`.
- **linked** — the pointer is present, wherever in the file it sits.

## Transitions

- **absent → current.** `kotta init` renders the template and writes `.kotta/AGENTS.md`. `kotta sync`
  does the same for a workspace initialized before this contract.
- **current → current.** A newer shipped template replaces an unmodified file on `sync`.
- **drifted → drifted.** `sync` reports and changes nothing. The skills rule, unchanged: Kotta does
  not get to decide that an edited copy is disposable.
- **unlinked → linked.** `kotta init --link-agents` and `kotta sync --link-agents` append the pointer
  line to the project's `AGENTS.md`, creating that file with only the pointer in it when none exists.
- **linked → linked.** The same flag is a no-op.

No transition rewrites, reorders or removes anything already in the project's `AGENTS.md`.

## Triggers

- A repository is initialized for Kotta.
- Kotta is upgraded and the shipped rules move ahead of the installed copy.
- An agent finds it has no CLI and no way to learn where one comes from.

## Permissions

- Writing `.kotta/AGENTS.md` needs no approval. Kotta owns `.kotta/` outright, and this is the file
  that says so.
- Writing into the project's `AGENTS.md` requires `--link-agents`, and the flag is only used after an
  explicit human yes in the conversation, per rule 5. There is no interactive terminal prompt: this
  CLI has never had one, and asking belongs in the chat where the human already is.
- Without the flag nothing outside `.kotta/` is written, and the result reports the exact line to add
  so the agent can quote it when asking. Silence is not consent, and a non-interactive run — CI, a
  headless agent — simply never passes the flag.

## Error paths

- **The project's `AGENTS.md` is not writable.** `--link-agents` refuses, names the path, and leaves
  `.kotta/AGENTS.md` written. The two writes are independent and the second failing never undoes the
  first.
- **`.kotta/AGENTS.md` has drifted and `sync` was asked to refresh it.** Reported as drifted, left
  untouched, named in the summary the way a drifted skill is.
- **`--link-agents` outside a Kotta workspace.** Refuses with the message `init` already gives for a
  missing workspace.
- **The package version cannot be read when rendering the template.** Refuses rather than writing an
  install line that names no version; a wrong install line is the defect being fixed.

## Cancellation path

There is nothing to cancel: both writes are single-file and idempotent. The human's way out of a
linked `AGENTS.md` is to delete the line — one line, in their own file, which is the whole reason the
pointer is one line. Declining in chat means the flag is never passed, and the reported line stands
as the instruction.

## Retry and duplicate-action behaviour

- Re-running `init` or `sync` on a current `.kotta/AGENTS.md` reports it unchanged, as `sync` already
  reports unchanged skills.
- Re-running with `--link-agents` on a linked file detects the pointer by its path — not by exact
  line equality, so a human who reworded the surrounding prose does not get a duplicate — and does
  nothing.
- A run interrupted between the two writes leaves the workspace file written and the project file
  untouched; re-running completes it. Neither write is partial: both are whole-file operations.

## Audit and notification expectations

- `init` and `sync` report, per file: written, unchanged, drifted, or skipped, and for the project
  file whether it was linked or only reported.
- `kotta status` reports a drifted or missing `.kotta/AGENTS.md` next to the existing skills line, so
  an upgraded Kotta says out loud that the rules moved.
- No lifecycle event and no approval receipt. These are workspace files, not contract state, and
  inventing a receipt for a one-line append would cheapen the receipts that do gate work.

## Scope

1. `templates/AGENTS.md`: the shared rules, with the install line rendered at write time from the
   package's own name and version so it cannot drift from what is published. Non-portable prose —
   this repository's "This repository" section — stays out of it.
2. `initCommand` (`src/commands/init.ts`) renders it to `.kotta/AGENTS.md`.
3. `syncSkills` grows a workspace-file target and becomes the operation that keeps `.kotta/AGENTS.md`
   current, reusing its own comparison rule: identical is adopted, modified is reported, nothing is
   clobbered. Rename it if the name stops describing it.
4. `skillDrift`'s reporting in `kotta status` covers the rules file.
5. `--link-agents` on both `init` and `sync`: append the pointer to the project's `AGENTS.md`,
   creating it when absent, idempotent by path, never rewriting existing content.
6. Without the flag, both commands report the exact line to add.
7. This repository consumes its own template: the shared prose of the root `AGENTS.md` moves into
   `templates/AGENTS.md`, `.kotta/AGENTS.md` is written from it, and the root file becomes the
   pointer plus the "This repository" section — so the copy Kotta ships is the copy Kotta runs on.
8. `skills/setup-kotta/SKILL.md` names the file, the flag, and that the pointer is a human yes.
9. Tests for every transition, refusal and idempotency case above.

## Non-goals

- Owning, reformatting or reordering the project's `AGENTS.md`. One appended line is the entire
  contact surface.
- Any interactive terminal prompt. This CLI has never had one and does not get one here.
- Writing into the project's file on a non-interactive run. `D-01kztp2epe4sehb25mpv7hc33b` settles
  this: no human, no write.
- Publishing under the bare `kotta` name on npm. That is a separate question about the registry, not
  about this repository, and naming the scoped package correctly is what fixes the reported failure.
- Changing any rule the file states. This contract moves the rules to where they can be found; it
  does not edit them.
- Making the pointer a machine-enforced include for every agent host. `@path` is followed by some
  hosts and read as a plain reference by others; both are acceptable outcomes for one line.

## Acceptance

- `kotta init` in a fresh repository writes `.kotta/AGENTS.md`, and the file contains an install
  command naming `@arpadtamasi/kotta` and the package's own version.
- `kotta init` alone leaves an existing `AGENTS.md` byte-identical, and reports the line to add.
- `kotta init --link-agents` appends the pointer to an existing `AGENTS.md` and leaves every prior
  byte of it in place and in order.
- `kotta init --link-agents` in a repository with no `AGENTS.md` creates one containing the pointer.
- Running `--link-agents` a second time changes nothing and says so.
- `kotta sync` refreshes an outdated but unmodified `.kotta/AGENTS.md`, and reports a hand-edited one
  as drifted without touching it.
- `kotta status` names a missing or drifted `.kotta/AGENTS.md`.
- A repository whose `AGENTS.md` is not writable still gets `.kotta/AGENTS.md`, and the refusal names
  the path.
- This repository's own `.kotta/AGENTS.md` is written from the shipped template, and its root
  `AGENTS.md` carries the pointer and the repository-specific section only.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run tests/integration/init.test.ts tests/integration/sync.test.ts` — write, refresh,
  drift, link, re-link, absent-file link, unwritable-file refusal.
- A test asserting the rendered install line contains the package name and version read from
  `package.json`, so a rename or a release cannot leave the template behind.
- A test asserting an existing `AGENTS.md` is unchanged byte-for-byte after `init` without the flag,
  and changed only by an appended line with it.
- A test asserting the pointer is detected by path, not by exact line, so a reworded line is not
  duplicated.
- A test asserting `kotta status` names a drifted rules file.
- `npx vitest run --exclude '.worktrees/**'` — the full suite.
- `npm run typecheck` and `npm run build`.
- Manual: initialize a throwaway repository that already has an `AGENTS.md` with its own content,
  confirm it is untouched, then link and confirm exactly one line was added.

## Constraints

- Nothing outside `.kotta/` is written without `--link-agents`.
- The project's `AGENTS.md` is only ever appended to. No rewrite, no reorder, no deletion, no
  reformatting of what is already there.
- An edited `.kotta/AGENTS.md` is reported, never replaced.
- The install line is generated, never hand-typed into the template. The defect that started this was
  a name that could not be derived from what the reader had.
- No interactive prompt, and no write to a project file in a run with no human to ask.

## Open decisions

None.

## Execution notes

- `D-01kztp2epe4sehb25mpv7hc33b` is the product intent for every choice above and should be read
  first.
- `syncSkills` (`src/commands/sync.ts:104-140`) already implements the exact comparison and adoption
  rule this needs — `sameSkill`, the ownership manifest, the skipped-because-someone-else's branch.
  Extend that machinery rather than writing a second copy of it, and keep `skillDrift`
  (`src/commands/sync.ts:150`) as the single place that answers "is the installed copy current".
- There is no readline, prompt or `isTTY` use anywhere in `src/`. That is deliberate; do not
  introduce one.
- The package name and version come from the installed package's own `package.json`, not from the
  workspace being initialized.
- `F-01kztn8rzehzvdfqq1snwc55jk` is the observation behind this contract, and its evidence is
  incomplete: it was written before the "Kotta ships no `AGENTS.md` at all" finding, which is stated
  in full here instead. Disposition it against this contract rather than resolving it separately.
- Scope item 7 changes the file the agent executing this contract is reading. Move the shared prose
  verbatim; a reworded rule smuggled in during a file move is the kind of change nobody reviews.
