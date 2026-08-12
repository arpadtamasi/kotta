@.kotta/AGENTS.md

## This repository

Kotta's own source, running on the rules it ships. The line above points at
[.kotta/AGENTS.md](.kotta/AGENTS.md), which `kotta sync` writes from
[templates/AGENTS.md](templates/AGENTS.md) — edit the template, not the generated file. This section
is the part that is only true here; in another project it is where that project's own instructions
go, and Kotta never touches it.

```bash
npm test            # builds, then runs the vitest suite (unit, integration, ui)
npm run typecheck
npm run build       # cli + board + site
npm run test:site   # separate Playwright suite for site/
kotta ui            # the local board, served from Git, not the working tree
```

Node 20+. The published surface is the `kotta` binary; `a-team` is a kept alias of the same
entrypoint, and a pre-rename `.a-team/` workspace is still discovered as-is. See
[README.md](README.md) for the migration path and the release process.
