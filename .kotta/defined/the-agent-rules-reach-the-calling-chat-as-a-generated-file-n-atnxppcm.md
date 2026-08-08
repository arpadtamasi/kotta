---
id: T-01kzh5ta34v0b4q5mxatnxppcm
title: >-
  The agent rules reach the calling chat as a generated file, not a hand-copied
  one
status: defined
origin: human
types:
  - bug
profiles:
  - bug
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-08'
updated_at: '2026-08-08'
---
# T-01kzh5ta34v0b4q5mxatnxppcm — The agent rules reach the calling chat as a generated file, not a hand-copied one

## Outcome

The rules an agent must follow are written by Kotta into `.kotta/rules.md`, and a repository's
`AGENTS.md` includes that file with one line. Changing a rule becomes one release rather than one
edit per repository, and a project's `AGENTS.md` keeps only what is actually about that project.

## Actual behaviour

The rules live in `AGENTS.md`, which is copied by hand into every repository that uses Kotta.
Nothing propagates a change.

Measured on 2026-08-08, after one rule changed in this repository: four downstream workspaces
carried a stale version of it, each phrased slightly differently, and each had to be edited by hand.

| workspace | what it said |
| --- | --- |
| `crm-kit` | ``**`--approve` is a human gate.** Never pass it, on any command.`` |
| `goschool-web` | ``**`--approve` is a human gate.** Never pass it on the human's behalf.`` |
| `flowbench` | `**Approval is a human gate.** Never pass `--approve` on the human's behalf.` — and numbered 4, not 5 |
| `oneanda` | no numbered rule at all; the gate is described in prose |

Three wordings of one rule, one absence, and one numbering difference — from copies of a single
source. The lifecycle tables had drifted the same way.

`T-01kz3kx1ex19tjw82tbd1366pk` is already signed and covers the other half of this: it makes
`kotta contract brief` emit a CLI-owned rules section, so an agent launched by `contract execute`
receives the rules on the same deterministic channel as the intent. That fixes the **executing**
agent. It does not reach the **calling chat**, which never reads a brief.

For the calling chat, `AGENTS.md` is the only channel that is always in context. A skill is not:
skill bodies load when invoked, so a rules skill would be absent exactly when a rule is about to be
broken. That is why this contract writes a file rather than shipping another skill.

## Expected behaviour

- `kotta sync` writes `.kotta/rules.md`, containing the agent rules and the lifecycle table, marked
  as generated.
- `kotta init` writes an `AGENTS.md` that includes it with one line, and otherwise contains only the
  project's own section.
- An existing `AGENTS.md` is never rewritten. `sync` writes the rules file and reports whether the
  include line is present, leaving the edit to the human.
- `kotta status` reports when `.kotta/rules.md` differs from what this Kotta would generate, exactly
  as it already does for the skills.
- The rules text has one source in this repository, and both `AGENTS.md` and `.kotta/rules.md` are
  produced from it rather than maintained separately.

## Reproduction steps

1. Change a rule in this repository's `AGENTS.md`.
2. Open any downstream workspace and read its `AGENTS.md` — it still carries the old rule.
3. `grep -c "human only" */AGENTS.md` across workspaces before 2026-08-08 returned a non-zero count
   in four repositories whose rules had been copied from this one.

## Environment

Any repository using Kotta. Independent of host and agent: the defect is that the rules are
duplicated at copy time and never reconciled.

## Frequency

Every rule change, in every downstream repository. Four were stale from a single change.

## Impact

A rule that cannot propagate is a rule the product does not actually have. The one measured today —
approvals are asked for in chat rather than delegated to a terminal — was the change the operator
most wanted to feel, and it reached four repositories only because someone edited four files.

The failure is silent in both directions: a stale copy looks authoritative, and a repository with no
`AGENTS.md` at all gives an arriving agent no rules while appearing to be a normal Kotta workspace.

## Regression-test expectation

- A test asserts `sync` writes `.kotta/rules.md` containing the rules, and that a second run leaves
  it byte-identical.
- A test asserts `init` produces an `AGENTS.md` whose rules come from the include line rather than
  from inlined text.
- A test asserts `sync` does not modify an existing `AGENTS.md`, and reports the include line as
  missing when it is absent.
- A test asserts `status` reports a hand-edited `.kotta/rules.md` as drifted and does not repair it.
- A test asserts the rules text has a single source: the generated file and this repository's own
  `AGENTS.md` rules section are identical.
- All fail against the current implementation.

## Scope

1. Extract the agent rules and the lifecycle table into one module in `src/` — the single source
   both outputs are produced from.
2. Extend `syncSkills` — or a sibling in `src/commands/sync.ts` — to write `.kotta/rules.md` from
   that source, with a generated-file header naming `kotta sync` as the way to update it.
3. Report in `sync`'s output whether the repository's `AGENTS.md` includes the rules file, and name
   the one line to add when it does not. Never edit an existing `AGENTS.md`.
4. Have `init` write an `AGENTS.md` carrying the include line and a project section, rather than no
   file at all.
5. Extend the drift check already in `kotta status` to cover `.kotta/rules.md`.
6. Replace this repository's own inlined rules with the include line, so Kotta uses what it ships.
7. Add the regression tests above.

## Non-goals

- Editing any existing `AGENTS.md`, in this repository or downstream. The include line is reported,
  never inserted: an `AGENTS.md` is an authored file and Kotta does not get to rewrite it.
- The brief-side rules section. `T-01kz3kx1ex19tjw82tbd1366pk` owns that, and the two are
  complementary: brief for executing agents, `AGENTS.md` for the calling chat.
- Shipping the rules as a skill. Skill bodies load on invocation, so they are absent exactly when
  they are needed.
- Changing any rule's content. This contract moves the rules; it does not revise them.
- Enforcing that a repository has an `AGENTS.md`, or failing anything when it does not.
- Migrating downstream workspaces. They run `sync` and add one line.

## Acceptance

- `kotta sync` writes `.kotta/rules.md` containing the numbered agent rules and the lifecycle table,
  with a header stating it is generated and naming `kotta sync`.
- A second `sync` leaves that file byte-identical and reports no change.
- `sync` reports whether `AGENTS.md` includes the rules file, and never modifies it. A repository
  with no `AGENTS.md` is reported, not written to.
- `kotta init` produces an `AGENTS.md` whose rules arrive through the include line.
- `kotta status` names `.kotta/rules.md` when it differs from what this Kotta would generate, and
  does not repair it.
- This repository's `AGENTS.md` carries the include line instead of inlined rules, and the rules it
  resolves to are byte-identical to the generated file.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run` on the new rules-generation, idempotency, no-AGENTS-edit and drift tests, each
  against a temporary repository.
- `npx vitest run --exclude '.worktrees/**'` for the full suite.
- `npm run typecheck` and `npm run build`.
- Manual: run `kotta sync` in this repository, confirm `.kotta/rules.md` appears and `AGENTS.md`
  resolves to the same rules; hand-edit the generated file and confirm `kotta status` names it.
- Manual: run `kotta sync` in one downstream workspace, confirm the rules file is written and the
  missing include line is reported rather than inserted.

## Constraints

- `.kotta/rules.md` is generated; `AGENTS.md` is authored. The line between them is the same one the
  skills already follow, and no command may blur it.
- One source for the rules text. Two copies inside this repository would reproduce the defect at a
  smaller scale.
- `sync` stays idempotent and additive, and keeps writing nothing outside the repository apart from
  the skills it already installs.
- Report, never repair. `status` names drift; the human runs `sync`.

## Open decisions

None.

## Execution notes

- The include mechanism already exists in every one of these repositories: `CLAUDE.md` is a single
  line, `@AGENTS.md`. This contract uses the same mechanism one level down, so nothing new has to be
  learned or supported.
- `sync` reports the missing include line rather than inserting it. An `AGENTS.md` carries the
  project's own words, and a tool that edits it will eventually edit something it should not. The
  cost is one manual line per repository, once.
- Scope item 6 matters more than it looks: if this repository keeps its own inlined copy, the source
  and the shipped file drift, and the defect returns inside the tool that fixes it.
- The five hand edits made on 2026-08-08 stand. This contract stops the sixth.
