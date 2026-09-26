# Migrating from 0.x

Carry a 0.x workspace to 1.0 with one command, and know what stays, what moves and what is gone.

## What changed

Kotta 1.0 owns the technical specification and has no process layer. The tasks, claims, worktrees,
batches, review gates, observations and decision records of 0.x are gone, and so are the commands
that drove them (`task`, `batch`, `observation`, `decision`, `claim`, `status`, `sweep`) and every
`--approve` flag. The `a-team` binary alias is gone too. The one approval left is a change's
`approval.yaml`; see [The planning phase](planning-phase.md). The full list is in the
[changelog](../CHANGELOG.md).

There is no compatibility layer. On a workspace of an older shape — versions 1 to 5, under `.kotta/`
or the pre-rename `.a-team/` — every command except `init` and `migrate` refuses, names the
migration, and does nothing else:

```text
<root> uses a pre-1.0 Kotta workspace shape: … Run 'kotta migrate --dry-run' to see exactly what
would change, then 'kotta migrate': …
```

## Migrate

```bash
kotta migrate --dry-run    # the complete plan; writes nothing
kotta migrate              # the same plan, applied
```

`--workspace <path>` points it at another repository root or workspace directory. The plan lists
each change as `move`, `create`, `remove`, `rewrite` or `leave out`, the number of identifiers (all unchanged),
and whether the result validates.

In one run, from any older shape:

| What | Where it goes |
| --- | --- |
| `.a-team/` | renamed to `.kotta/`, when only the old directory exists |
| `process/` — tasks, observations, batches, claims, events, decisions, profiles, the generated index | `legacy/process/`, moved with `git mv` where Git tracks it, untouched |
| a v1–v4 shape (state directories, `findings/`, `packages/`, the old field names) | carried to the v5 shape on its way into the archive, so every archive reads alike |
| `config.yaml` | version 6: `project`, `git.base_branch`, `git.protected_branches`, `validation.strict`; every other key dropped and named in the plan |
| `.kotta/README.md`, `.kotta/AGENTS.md` | this Kotta's copies; a hand-edited rules file is reported and left alone |
| `.gitattributes` | the generated index's merge attribute removed; the file deleted when that was all it held |
| `spec/` | byte-identical, and the command proves it after writing; a workspace with no registry at all gets the bundled one |

Operating-system metadata in an older-shape directory is not part of the workspace. A fixed list —
`.DS_Store`, `._*`, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `Thumbs.db`, `ehthumbs.db`,
`desktop.ini` — is left out of the archive, deleted with the old directory it sat in, and named in the
plan as `leave out` (`omit` in `--json`). It is the only thing the migration deletes without carrying
it over; any other entry it does not know stops the migration, named, with nothing written.

`legacy/README.md` says what the archive is and which shape wrote it. Nothing in Kotta 1.0 reads or
writes `legacy/`.

## Guarantees

- **No identifier moves.** The command compares the id set before and after and fails if one is
  lost.
- **Fail before write.** Every conflict — both `.a-team/` and `.kotta/` present, an archive already
  there, a directory it cannot classify — is found before anything is written, and the message ends
  with "Nothing was written."
- **Idempotent.** A second run reports that the workspace is already on the current shape.
- **Forward only.** A workspace written by a newer Kotta is named as newer, with both versions, and
  answered by upgrading Kotta.
- **Reported, not repaired.** If the carried specification does not validate, the migration says so
  and lists the problems; the migration itself still completes.

## After migrating

1. Review the moves with `git status`.
2. Commit the migration, and merge it into the base branch. `kotta ui` and `kotta gap` read the base
   branch, so they keep showing the pre-migration workspace until the commit lands there.
3. Run `kotta sync` to install the 1.0 skills. It removes the 0.x skills it installed
   (`start-task`, `execute-task`, `execute-batch`, `submit-review`, `close-task`,
   `validate-observation`, `define-task`).
4. If your rules file was hand-edited and left alone, `kotta sync --replace-rules` takes Kotta's
   copy.

## The 0.x escape hatch

The last 0.x release stays installable. To work with the archived records as they were:

```bash
npx -y -p @arpadtamasi/kotta@0.11 kotta --help
```

A plain `npm install --global @arpadtamasi/kotta` also still installs it, because 1.0 is published
under the `next` dist-tag.
