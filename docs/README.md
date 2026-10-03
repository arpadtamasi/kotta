# Kotta documentation

Kotta keeps the technical model of a product — its rules, examples, entities, state machines, use
cases, stories and interfaces — beside the changes that propose it and the code, as the accepted truth.
These pages describe 1.0.0-alpha.6.

## Start here

- [Getting started](getting-started.md) — install, set up a repository, and carry one change from
  prose to the model in ten minutes.
- [Concepts](concepts.md) — the four layers, where a change lives, provenance, the one human gate, evidence by citation,
  and the measurements behind them.

## Guides

- [The planning phase](planning-phase.md) — opening a change, its layout, what `plan`, `approve` and
  `archive` check and refuse, and what `archive` generates.
- [Kotta and OpenSpec](openspec.md) — OpenSpec as an optional companion: importing an OpenSpec
  repository, a generated or authored narrative with its `<!-- kotta: ID -->` binding, and moving
  changes out of `openspec/changes/`.
- [The distilled conversation](narrative.md) — `kotta narrative` and `conversation.md`.
- [Modules and evidence](modules-and-evidence.md) — modules from manifests, boundary checks,
  cross-repository references, and `kotta gap`.
- [The board](board.md) — `kotta ui`: the views, the provenance badges and the filter.
- [Migrating](migration.md) — `kotta migrate`, which moves changes out of `openspec/changes/`, and
  what to do with a workspace from before 1.0.

## Reference

- [CLI reference](cli.md) — every command and option.
- [Forms](forms.md) — the eleven forms: sections, edges, normative sections.
- [Configuration](configuration.md) — `.kotta/config.yaml` and the environment.
- [Agents and skills](agents.md) — the rules file, the skills, the MCP tools.

## The example

The excerpts and screenshots come from a Hungarian card-game PWA ("Kaszinó") whose first change —
184 nodes — went through the planning phase and the gate on 2026-09-25. Its model is in Hungarian;
the pages translate where it matters.
