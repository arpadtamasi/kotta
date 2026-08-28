---
id: D-01m13v4eqfhv5213paeqdn4tbm
title: 'Integrating with a project''s own AGENTS.md is a judgement, not an append'
date: '2026-08-28'
approved_by: cli
approved_at: '2026-08-28T09:27:37.966Z'
approval_basis: 'CLI --approve: decision.create'
---
# D-01m13v4eqfhv5213paeqdn4tbm — Integrating with a project's own AGENTS.md is a judgement, not an append

## Decision

Where a project has no AGENTS.md, Kotta creates it with the reference to its rules, without asking:
there is nothing to protect, and rules nobody reads are not installed.

Where a project has one, the reference is placed by an agent that has read the file - where it
belongs in that document, in its own voice, shown as a diff and applied on the human's yes. The CLI
keeps a deterministic path for environments with no agent, so a Kotta installed from a terminal or
from CI still reaches the agents that will work there; that path is the crude one by admission, not
the intended one, and it writes a sentence saying what the reference is rather than a bare line.

## Context

`kotta init` in a fresh repository wrote `.kotta/AGENTS.md` and deliberately left the project's own
AGENTS.md alone, per the rule that Kotta never owns a project's conventions file. The operator hit
this while starting a project on 2026-08-27: the rules existed and nothing pointed at them, because
the file the protection exists for did not exist yet. With an existing file, `--link-agents`
appends the bare line `@.kotta/AGENTS.md` after whatever the document happened to end with - a
naked reference with no sentence saying what it is or why it is there.

The operator's requirement, in their words: where an AGENTS.md exists, it has to be written into
sensibly, with an LLM, not deterministically.

## Consequences

The split follows Kotta's own: the CLI does what is deterministic, and judgement lives where
judgement lives - in the calling agent, through `setup-kotta`. An empty project is set up by one
command with nothing left dangling. An existing conventions file is joined by an agent that read
it, so the reference arrives as part of the document rather than after it. The deterministic
fallback stays because a rule that only installs where an agent is present is not installed
anywhere it is needed most; it is documented as the lesser path, and its output stops being a bare
line.
