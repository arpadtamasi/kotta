# Modules and evidence

How Kotta finds the modules of a repository, places each node in one, checks the boundaries between
them, and reports which accepted promises the code keeps.

## Modules come from the manifests

There is no module list to keep. `kotta modules` reads the manifests in the working tree:

| Ecosystem | Manifest | A module is |
| --- | --- | --- |
| npm, pnpm | `package.json`, `pnpm-workspace.yaml` | each workspace package (`workspaces` or `packages` globs); without workspaces, the root package if it has a `name` |
| Python | `pyproject.toml` | each project with a `[project] name`, or each uv workspace member; a uv workspace root is not one |
| Dart | `pubspec.yaml` | each package with a `name`; a pub workspace root is not one |
| Rust | `Cargo.toml` | the root package and each workspace member |
| Go | `go.mod` | each `module` line |

One directory is one module; when two ecosystems claim it, the first in the order above wins. A file
belongs to the deepest module containing it; code outside every module belongs to `(root)`.

```text
$ kotta modules
1 module declared by manifests:
  magyar-kaszino  .  (node 0.1.0)
```

A module's **surface** is what other modules may rely on: `exports`, `main`, `types` or `typings` in
`package.json`; an `__init__.py`; a Dart `lib/`; a Rust `src/lib.rs`; a Go package that is not
`main`.

## A node's module is where its evidence is

A node has no `module:` field. Kotta finds every file that names its id — outside the excluded
sources below — and takes the modules those files are in:

- one module: that is the node's module;
- several: the node **straddles** them — a promise no single module keeps alone;
- none: the node is unplaced (it has no evidence yet). A node that only a copy of the specification
  names is unplaced too, never `(root)`.

The exception is an **interface** node: its `module:` names the module whose surface it states, and
an interface cited from several modules is the point, not a straddle.

## The four boundary checks

`kotta modules check` runs them on the working tree:

| Code | Severity | Finding |
| --- | --- | --- |
| `MODULE_INTERFACE_MISSING` | warning | a module has a surface and no interface node says `module: <it>` |
| `MODULE_STRADDLER` | warning | a non-interface node is kept in more than one module |
| `MODULE_CROSS_REFERENCE` | warning | a node of one module names another module's non-interface node |
| `MODULE_UNKNOWN` | error | an interface's `module:` names a module no manifest declares |

Only an error makes the command exit non-zero. `kotta validate` reports the same findings: the error
as an error, the rest as warnings.

## Other repositories: reference, do not copy

A consumer names another repository's promise with a `reference:` block on one of its own interface
nodes:

```yaml
reference:
  module: <package name>
  version: <semver or commit>
  resolve: file | package | git    # optional; omitted tries all three in this order
  id: <the foreign interface's id> # optional
  url: <git URL>                   # optional; for git when no dependency names one
```

| Resolve | Where Kotta looks |
| --- | --- |
| `file` | a `file:`, `link:` or path dependency on that module, up to the nearest directory with `.kotta/spec/` |
| `package` | `node_modules/<module>/kotta-spec/manifest.json`, written by `publish-spec` |
| `git` | a git dependency or `reference.url`, fetched into a cache |

`modules check` then reports:

| Code | Severity | Finding |
| --- | --- | --- |
| `MODULE_REFERENCE_INVALID` | error | the block names no module, pins no version, or has an unknown `resolve` |
| `MODULE_REFERENCE_UNRESOLVED` | warning | no method found the interface, or the pin cannot be compared |
| `MODULE_REFERENCE_STALE` | warning | the core changed since the pinned version: the resolved source declares another version, or a commit after the pinned one touched the interface |
| `MODULE_INTERFACE_COPY` | warning | an interface without a `reference:` is more than 80% the same text as a foreign one |

## Shipping a module's promises

```bash
kotta modules publish-spec <module>
```

copies the module's interface nodes, the rules and examples that name them, and the examples naming
those rules, into `<module>/kotta-spec/`, laid out like `.kotta/spec/` with the forms they use and a
`manifest.json` (`format`, `module`, `version`, `commit`, `nodes`). If the package lists its
`files`, add `kotta-spec` there. The command replaces only its own output: a `kotta-spec/` without a
manifest is refused (`PUBLISHED_SPEC_FOREIGN`), as is a module with no interface
(`MODULE_NO_INTERFACE`). A published `kotta-spec/` never counts as evidence.

## Evidence: `kotta gap`

`gap` reads committed bytes on the configured base branch — never the working tree — and reports
every accepted node at one level:

| Level | Meaning |
| --- | --- |
| `none` | no committed file outside the excluded sources names the id |
| `cited` | some such file names it |
| `bound` | a test's own name carries it |

A test binds when its name holds the id: `it(`, `test(`, `describe(`, Dart's `group(` and
`testWidgets(` with the id in the string; a Rust `#[test] fn` or a Python `def test_…` with the id in
identifier form (`BR-01ab…` as `br_01ab…`). `it.skip(`, `xit(` and `#[ignore]` do not bind. Each
evidence file is classified as `test`, `command` (under `bin/`, `cli/`, `commands/`, `scripts/`, a
`package.json`, a shell script) or `code`.

```text
# Implementation gap report

Base: main@f1dad45bebd5d9f02815bb10c781abe5ac6afa3a
Promises without evidence: 0 · structural: 0 · unexamined: 0 · unimplemented: 0 · Unspecified enforcement: 0
Evidence levels: bound 1 · cited 1 · none 0
```

A node with no evidence either admits its gap in its frontmatter, with one of three kinds, or the
report refuses (`UNADMITTED_PROMISE`, exit 1) and still prints in full:

```yaml
accepted:
  - "unimplemented: the exporter ships after the policy workshop; nothing implements this yet"
```

| Kind | Meaning |
| --- | --- |
| `structural` | many sites realise it and none could name it |
| `unexamined` | nobody has looked |
| `unimplemented` | someone looked, and it is not built |

An admission without a kind is refused as `UNKINDED_ADMISSION`. The report also lists **enforced
behavior with no specification trace**: an error `code: "…"` or a refusing `throw new Error(…)` in
source code with no node id in the four lines above it. That list does not refuse.

`kotta gap --module <name>` narrows the report to the nodes evidenced in that module and the
interfaces naming it. With more than one module, the report adds evidence by module and lists the
straddling promises.

### What is not evidence

Evidence is what keeps or checks a promise — code, a test, a command definition — never what states
or copies it. `gap`, `modules check` and the module derivation read through one filter that leaves
out six classes of source:

| Class | Path |
| --- | --- |
| `workspace` | `.kotta/` — the specification itself |
| `openspec-change` | `openspec/changes/<name>/` at the repository root |
| `openspec-archive` | `openspec/changes/archive/` — an archived change's `model/` and `approval.yaml` |
| `openspec-spec` | the rest of the root `openspec/` tree — the generated narrative specs |
| `published-spec` | any `kotta-spec/` a package publishes |
| `dependency` | anything under `node_modules/` |

The exclusion names the sources Kotta knows, not a directory name: a package's own `openspec/` below
the root is read, and a project's own `specs/` directory still counts as tests. A file in an excluded
source is never a test, whatever its path. The hint a refusal gives about uncommitted paths names only
paths the filter admits.

The report says what it did not count. Its head has one line, and `--json` the field `excluded`: per
class, how many files it holds and how many evidence-less nodes it names. Every node at level `none`
carries its own `excluded` list — the classes that mention it, its own file aside — so "why is this
node none?" is answered in the report:

```text
Evidence levels: bound 0 · cited 0 · none 184
Not counted as evidence, as copies of the specification or dependencies: workspace 208 files (names 92 nodes without evidence) · openspec-archive 197 files (names 184 nodes without evidence) · openspec-spec 7 files (names 131 nodes without evidence)
```

That is the casino repository: its code names no node id, so every node is `none` until the code
that keeps a promise names it. `modules check --json` carries the same head and a `none` list with
each node's `excluded`.
