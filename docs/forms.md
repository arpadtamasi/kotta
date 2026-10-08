# Forms

The eleven shapes a node can take, as the registry Kotta ships declares them. The tables below are
generated from `templates/workspace/spec/forms/*.yaml`; your workspace's copies live in
`.kotta/spec/forms/`.

## How a form works

A form is one YAML file. It declares:

- `id`, and the `directory` its nodes live in under `.kotta/spec/`;
- `identity.prefix`: a node's id is `<prefix>-<26-character lowercase Crockford ULID>`, and its file
  is `<slug>-<last 8 id characters>.md`. The ULID is time-sortable and random, so two branches
  never mint the same id. Wherever Kotta prints a short id, it is the prefix and those last eight
  characters (`BR-5bbq9esq`);
- `required_fields`: the frontmatter keys (`id`, `form`, `title` for every shipped form) and the
  `body_headings`, each a `##` section that must be present and not empty (a section holding only an
  HTML comment counts as empty);
- `required_edges`: each names the frontmatter `fields` that carry it, whether it is `outgoing` (this
  node names others) or `incoming` (others must name this one), the forms on each end, a `minimum`,
  and the `question` the validator prints when it is missing. An edge may also be `acyclic` (no node
  reaches itself through it), `waived_by` a frontmatter flag (a node with that flag set to `true`
  needs no such edge), and `on_accepted: warning` (missing on an accepted node it is a warning, in a
  change's model an error);
- `field_values`: the values a frontmatter field may take, when the node carries it;
- `normative_sections`: the sections one of which must say SHALL or MUST. Missing on an accepted
  node, that is a warning; in a change's model, an error;
- `recognition_signals`: when a conversation calls for this form. The skills read them.

`kotta spec new <form> --title "…"` mints a node with its id, a section per required heading, a
field per outgoing edge with the form's question beside it, and an empty `provenance` block. Add a
form by adding a YAML file: nothing is compiled in. `kotta sync` adds newly shipped forms and leaves
yours alone. The registry is part of the agreement: a form changes through a change, which carries
the new version under `model/forms/<form>.yaml`. Plan measures the change's nodes against it, the
approval fingerprints it with them, and archive lands it in the registry. `kotta validate` warns
when a registry form differs from the last commit and no change carries that version.

Any node may also carry `capability: <path>` (which narrative spec it is generated into),
`provenance` (see [Concepts](concepts.md#provenance)) and `accepted` (an admitted evidence gap, see
[Modules and evidence](modules-and-evidence.md)). An interface may carry `module:` and `reference:`; a use case may carry `reference:` too, to say
that another repository provides it (see [Modules and evidence](modules-and-evidence.md)).

### The use-case hierarchy

The forms Kotta ships draw a hierarchy after UML. A use case may `includes` other use cases (they are
part of its behaviour) and `extends` one (it adds optional behaviour to it); neither may form a cycle.
Its `level` is Cockburn's goal level: `summary`, `user-goal` or `subfunction`. It names the rules,
interfaces and quality attributes it relies on under `refines` (SysML «refine»), and the interfaces
it uses under `interfaces`; the requirement itself names no use case.

Every rule, interface and quality attribute needs a place: a use case that refines it, or
`overall: true` when it holds for the whole product. A requirement with neither is a warning on the
accepted model (`SPEC_NODE_NO_PLACE`) and an error in a change. `kotta spec impact <use case>` and
the board's Hierarchy view read the tree: dropping a use case takes with it the use cases it includes
(unless something outside also includes them) and those that extend it, and a requirement falls out
when every use case refining it goes; an overall requirement never falls out.

## The eleven forms

| Form | Prefix | Directory | Source | Required sections | Normative |
| --- | --- | --- | --- | --- | --- |
| `goal` | `G` | `goals/` | Impact Mapping | Outcome, Context, Baseline and target | — |
| `actor` | `A` | `actors/` | UML | Role, Goals, Responsibilities | — |
| `use-case` | `UC` | `use-cases/` | Jacobson | Intent, Preconditions, Main success scenario, Alternatives | — |
| `user-story` | `US` | `user-stories/` | XP / Cohn | Story, Value, Notes | — |
| `business-rule` | `BR` | `business-rules/` | Ross | Rule, Rationale, Scope | Rule |
| `example` | `EX` | `examples/` | Specification by Example / Gherkin | Given, When, Then | — |
| `entity` | `E` | `entities/` | ER / DDD | Meaning, Identity, Attributes, Invariants | — |
| `state-machine` | `SM` | `state-machines/` | UML / Harel | Governed lifecycle, States, Transitions | — |
| `interface` | `IF` | `interfaces/` | Design by Task | Purpose, Preconditions, Postconditions, Invariants, Failures | Postconditions, Invariants |
| `quality-attribute` | `QA` | `quality-attributes/` | SEI Quality Attribute Scenario | Source, Stimulus, Environment, Artifact, Response, Measure | Response |
| `glossary-term` | `GT` | `glossary-terms/` | DDD Ubiquitous Language | Definition, Usage, Non-examples | — |

### goal

A measurable outcome the product or initiative is intended to create.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| measurement | outgoing | `measured_by` | goal → example, quality-attribute | 1 | How will we know this goal was reached? |

Recognition signals:

- A desired business or user outcome is named.
- Success, impact, a baseline, or a target is discussed.
- A proposed feature is justified by the change it should produce.

### actor

A role outside the modeled system that pursues a goal through it.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| participation | incoming | `actor` | user-story, use-case → actor | 1 | What does this actor actually do? |

Recognition signals:

- A user, role, external system, or stakeholder interacts with the system.
- Different responsibilities or permissions are being separated.
- The conversation says who initiates or benefits from behavior.

### use-case

A goal-directed interaction between an actor and the system, including alternatives.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| actor | outgoing | `actor` | use-case → actor | 1 | Which actor owns this interaction? |
| goal | outgoing | `goal` | use-case → goal | 1 | Which goal does this use case serve? |
| evidence | incoming | `subjects` | example → use-case | 1 | What example proves this use case? |
| includes | outgoing, acyclic | `includes` | use-case → use-case | 0 | Which use cases does this one include as part of its own behaviour? |
| extends | outgoing, acyclic | `extends` | use-case → use-case | 0 | Which use case does this one extend with optional behaviour? |
| refines | outgoing | `refines` | use-case → business-rule, interface, quality-attribute | 0 | Which rules, interfaces and quality attributes does this use case rely on? |

`level`, when given, is `summary`, `user-goal` or `subfunction`.

Recognition signals:

- A multi-step interaction has a clear initiating actor and result.
- Preconditions, alternative paths, failures, or cancellation matter.
- Several stories describe one end-to-end user goal.

### user-story

A small capability expressed from an actor's point of view and proved by examples.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| actor | outgoing | `actor` | user-story → actor | 1 | Whose story is this? |
| evidence | incoming | `subjects` | example → user-story | 1 | What example proves this story? |

Recognition signals:

- A person wants a capability for a stated benefit.
- Work is being sliced into independently valuable behavior.
- Acceptance examples are being discussed around a small need.

### business-rule

A durable constraint or derivation that the business expects behavior to obey.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| evidence | incoming | `subjects` | example → business-rule | 1 | What would break if this rule were violated? |
| placement | incoming, waived by `overall` | `refines` | use-case → business-rule | 1 | Which use case relies on this rule, or does it hold for the whole product (overall)? |

Recognition signals:

- The conversation uses must, may only, never, always, eligible, or calculated as.
- A policy remains true across more than one interaction.
- An exception, threshold, classification, or derivation controls behavior.

### example

A concrete observable case that proves or falsifies one or more specification nodes.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| subjects | outgoing | `subjects` | example → user-story, use-case, business-rule, quality-attribute | 1 | What does this example prove? |

Recognition signals:

- A concrete input and observable outcome are stated.
- A counterexample, boundary case, or acceptance check settles ambiguity.
- The conversation can be restated as Given, When, Then without inventing facts.

### entity

A domain concept with stable identity, attributes, and invariants.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| use | outgoing | `used_by` | entity → user-story, use-case, business-rule, interface | 1 | Why does this entity exist? |

Recognition signals:

- Something keeps its identity while its attributes change.
- The team discusses records, aggregates, ownership, or invariants.
- Several behaviors read or change the same domain concept.

### state-machine

The allowed lifecycle states and transitions of one governed entity.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| governed-entity | outgoing | `entity` | state-machine → entity | 1 | Whose lifecycle is this? |

Recognition signals:

- Valid actions depend on the current status.
- Transitions, terminal states, retries, or cancellation are discussed.
- The same entity changes behavior over time.

### interface

A boundary whose obligations are stated as preconditions, postconditions, and invariants.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| reference | incoming | `interfaces` | use-case, entity → interface | 1 | Who uses this interface? |
| placement | incoming, waived by `overall` | `refines`, `interfaces` | use-case → interface | 1 | Which use case relies on this interface, or does it hold for the whole product (overall)? |

Recognition signals:

- Two components or organizations exchange data or calls.
- Inputs, outputs, errors, or caller and provider obligations need agreement.
- An API, event, file, command, or service boundary is being specified.

### quality-attribute

A measurable non-functional response under a stated stimulus and environment.

| Edge | Direction | Field | From → to | Min | The form's question |
| --- | --- | --- | --- | ---: | --- |
| verification | incoming | `subjects` | example → quality-attribute | 1 | Who measures this quality, and where? |
| placement | incoming, waived by `overall` | `refines` | use-case → quality-attribute | 1 | Which use case relies on this quality attribute, or does it hold for the whole product (overall)? |

Recognition signals:

- Performance, reliability, security, accessibility, or operability is quantified.
- A percentile, threshold, workload, environment, or failure budget is named.
- A vague quality word needs an observable response and measure.

### glossary-term

One agreed domain term with a precise meaning and usage boundary.

Edges: none required.

Recognition signals:

- The same concept is called by several names.
- A domain word is overloaded or repeatedly clarified.
- A term's inclusion and exclusion boundary affects behavior.

## Real nodes from the casino model

Excerpts: `…` marks what is left out. The casino model is written in Hungarian. Its rules predate the SHALL/MUST check, so
`kotta validate` there warns on 49 of them (`SPEC_NODE_NOT_NORMATIVE`) and refuses none.

An **example** proving a business rule through `subjects`:

```markdown
---
id: EX-01m37bpnhbth3anhys8h3gy5z0
form: example
title: A gépnek nincs ütése
subjects:
  - BR-01m37bp6dvqmq6nx1nva409y01
capability: computer-opponent
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "change/specs/computer-opponent/spec.md · Mindig szabályos gépi lépés / A gépnek nincs ütése"
  quote: …
---
# A gépnek nincs ütése

## Given

A gépi ellenfél sorra került.

## When

A gépnek nincs szabályos ütése.

## Then

A gép pontosan egy kézlapot helyez az asztalra.
```

(The computer's turn; it has no legal capture; it places exactly one card on the table.)

A **state machine** governing an entity, partly inferred, with what was supplied:

```markdown
---
id: SM-01m37bp1w1fvyjw9t4qeb0r85k
form: state-machine
title: A lecke állapotai
entity:
  - E-01m37bp08temth4vg48v04rm2z
capability: guided-learning
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources: …
  inferred: "A `Zárolt` állapotot a „elérhetővé teszi a következő tanulási lépést\" megfogalmazásból vezettem le; …"
---
…
## Transitions

- `Zárolt` → `Elérhető`: az előző tanulási lépés teljesítve.
- `Elérhető` → `Folyamatban`: a tanuló elindítja a leckét.
- `Folyamatban` → `Teljesítve`: minden kötelező lépés helyesen megtörtént; …
```

The board draws a state machine from the lines of its Transitions section that read as `A → B: why`.

A **glossary term** whose non-examples feed `kotta plan`'s glossary contrasts, approved from a
proposal in the conversation:

```markdown
---
id: GT-01m37bpe7pk7352vb0xdmmt58t
form: glossary-term
title: Káró 10
capability: hungarian-casino-gameplay
provenance:
  level: stated
  decided_by: agent-proposed-human-approved
  sources: …
  quote: "káró 10: 2 pont\" (ÁGENS, 2026-09-23T13:14), jóváhagyva: \"redben\" (EMBER, 2026-09-23T13:17)"
---
…
## Non-examples

- A pikk 2: az 1 pontot ér.
- A káró 10 mint ütőérték: az ütésvizsgálatban egyszerűen 10 értékű lap.
```

An **interface**'s obligations, as Postconditions and Invariants:

```markdown
## Postconditions

…
- A visszaadott nézet nem tartalmazza az ellenfél rejtett lapjait.
…
- A visszaadott nézet nem tartalmaz lapmemóriát: …

## Invariants

- A szűrés egyirányú: a nézetből nem állítható vissza a teljes állapot.
…
```

(The computer opponent's input: the view it receives holds neither the opponent's hidden cards nor
any card memory, and the full state cannot be rebuilt from it.) Written today, each of these lines
would need SHALL or MUST.
