# Migrating

What `kotta migrate` does in this release — move the changes an earlier release kept in OpenSpec's
folder into the workspace — and what happens to a workspace from before 1.0.

## What changed

Kotta 1.0 owns the technical specification and has no process layer. The tasks, claims, worktrees,
batches, review gates, observations and decision records of 0.x are gone, and so are the commands
that drove them (`task`, `batch`, `observation`, `decision`, `claim`, `status`, `sweep`) and every
`--approve` flag. The `a-team` binary alias is gone too. The one approval left is a change's
`approval.yaml`; see [The planning phase](planning-phase.md). The full list is in the
[changelog](../CHANGELOG.md).

Kotta finds a workspace only as `.kotta/` at the repository root. The pre-rename name `.a-team/` is
not looked for, and nothing renames it.

## A pre-1.0 workspace

This release carries no pre-1.0 migration. A workspace on a shape older than version 6, or one that
still holds a pre-1.0 `process/` directory, is refused by every command, `migrate` included, and the
refusal names the last release that migrates it:

```text
<root> uses a pre-1.0 Kotta workspace shape: … Migrate it with the last release that can:
'npx -y -p @arpadtamasi/kotta@1.0.0-alpha.4 kotta migrate', then run this Kotta again. …
```

So, from a 0.x workspace:

```bash
npx -y -p @arpadtamasi/kotta@1.0.0-alpha.4 kotta migrate --dry-run   # the plan; writes nothing
npx -y -p @arpadtamasi/kotta@1.0.0-alpha.4 kotta migrate             # the same plan, applied
```

then commit, and run the current Kotta. A workspace under `.a-team/` is renamed by that release too.
Its [documentation](https://github.com/arpadtamasi/kotta/blob/v1.0.0-alpha.4/docs/migration.md) says
what it carries and where.

A workspace that release already migrated may still hold the `legacy/` folder it wrote. Nothing in
Kotta reads or writes it now: it is a plain folder, kept or deleted as the project likes.

## Migrate

Up to 1.0.0-alpha.2 a Kotta change lived at `openspec/changes/<name>/`. `kotta migrate` moves those
changes into the workspace, and does nothing else:

```bash
kotta migrate --dry-run    # the complete plan; writes nothing
kotta migrate              # the same plan, applied
```

`--workspace <path>` points it at another repository root or workspace directory. The plan lists
each step as `move` or `rewrite`, and whether the result validates.

| What | Where it goes |
| --- | --- |
| `openspec/changes/<name>/` | `.kotta/changes/<name>/`: every open change, OpenSpec proposal or Kotta delta alike |
| `openspec/changes/archive/<dir>/` with a `model/`, `planning.md` or `approval.yaml` | `.kotta/changes/archive/<dir>/`; OpenSpec's own history (a proposal with no model) stays |
| `narrative:` unset, with specs under `openspec/specs/` | `narrative: generated`, so archive keeps regenerating them as it did before the default became `none` |
| `spec/` | byte-identical |

In a moved change that is not approved, provenance sources naming the old folder are rewritten to
the new one. An approved change moves byte-identical, because its receipt is a hash of its model, and
the report notes that its sources still name the old folder. To move one change by hand,
`kotta change list` prints the `git mv`. See also
[Kotta and OpenSpec](openspec.md#moving-changes-out-of-openspecchanges).

## Guarantees

- **The specification is untouched.** Nothing under `.kotta/spec/` is written, and no identifier
  changes.
- **Fail before write.** Every conflict — a target that already exists — is found before anything is
  written, and nothing is.
- **Idempotent.** A second run says there is nothing to migrate.
- **Forward only.** A workspace written by a newer Kotta is named as newer, with both versions, and
  answered by upgrading Kotta.
- **Reported, not repaired.** If the workspace does not validate after the move, the migration says
  so and lists the problems; the migration itself still completes.

## After migrating

1. Review the moves with `git status`.
2. Commit the migration, and merge it into the base branch. `kotta ui` and `kotta gap` read the base
   branch, so they keep showing the changes where they were until the commit lands there.
3. Run `kotta sync` to bring the skills and the rules file up to this release. A hand-edited rules
   file is reported and left alone; `kotta sync --replace-rules` takes Kotta's copy.

## The 0.x escape hatch

The last 0.x release stays installable. To work with the old process records as they were:

```bash
npx -y -p @arpadtamasi/kotta@0.11.x kotta --help
```

A plain `npm install --global @arpadtamasi/kotta` also still installs it, because 1.0 is published
under the `next` dist-tag.
