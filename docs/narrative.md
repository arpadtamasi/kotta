# The distilled conversation

`kotta narrative` keeps who decided what: it turns an agent session log into the change's
`conversation.md`, which provenance cites and the board opens.

## The command

```bash
kotta narrative <change> --from <log or directory> [--since <ISO 8601 time>]
```

- `<change>` must exist under `openspec/changes/`.
- `--from` is one `.jsonl` log, or a directory: every `.jsonl` under it is read, in name order, and
  files that are neither format are listed as skipped.
- `--since` keeps only messages at or after that time. Use it when one session shaped several
  changes.

Two log formats are recognised, from their content, not their path:

| Host | Where its logs are | What is read |
| --- | --- | --- |
| Claude Code | `~/.claude/projects/<project>/*.jsonl` | entries of `type: user` and `type: assistant` |
| Codex | `~/.codex/sessions/**/rollout-*.jsonl` | `response_item` entries whose payload is a `message` |

Only what the human and the agent said is kept. Tool calls and results, sub-agent threads, the
host's reminders, skill loads, command echoes, interruptions, image-only messages and human pastes
longer than 4000 characters are counted as skipped, by reason.

## What `conversation.md` contains

A run on a five-message session:

```text
Distilled 5 messages from 1 session log into openspec/changes/add-pause/conversation.md.
Intent: 1. Proposals approved: 1. Turned down: 1. Questions answered: 0. Unpaired: 0.
Filtered before writing: e-mail 1.
```

The file has frontmatter (`change`, `generated_by: kotta narrative`, `generated_at`, `since` when
given, and a `digest` of the body) and these sections. In 1.0.0-alpha.1 the headings and labels are
written in Hungarian:

| Section | Items | What it holds |
| --- | --- | --- |
| `## Szándék` (intent) | `SZ1`, `SZ2`, … | the human's messages that answered no proposal or question, verbatim |
| `## Javaslatok és válaszok` (proposals and answers) | `J1`, … | an agent proposal and the human's yes, or the option the human picked |
| `## Elvetett utak` (paths turned down) | `E1`, … | an agent proposal the human declined, or an option picked other than the one the agent recommended |
| `## Kérdések és válaszok` (questions and answers) | `K1`, … | an agent question and the human's answer |
| `## Párosítatlan` (unpaired) | `P1`, … | a reply to a proposal that is neither a yes, a no nor a pick, and a bare yes to a report: a human reads the decision |
| `## Nyers forrás` (raw source) | | each log, its format, the message counts and what was skipped, and the time span |
| `### Szűrés` (filtering) | | what the filter removed, by kind |

Every item heading carries its id and its UTC time to the minute (`### J1 · 2026-09-25 10:02 UTC`).
The human's words are quoted verbatim; the agent's are shortened from the front to about 900
characters, so a proposal and its question stay.

Pairing is a heuristic, and it says so: a human message answers only the agent message directly
before it, and is paired only when that message proposes or asks something. Anything else goes to
the unpaired section rather than being forced into a decision.

## Filtering

Before anything is written, the text passes a filter that replaces, with a visible marker such as
`[e-mail eltávolítva]`, and counts: API keys (`sk-…`), GitHub tokens, AWS keys, JWTs, secret values
after names like `password:` or `token=`, e-mail addresses, phone numbers and home-directory paths.

## Hand edits are kept

`narrative` replaces a `conversation.md` only if it wrote it and nobody changed it since (the
`digest` still matches). Otherwise it refuses (`NARRATIVE_EDITED`) and leaves the file alone; move
it aside to distil again. A log with nothing left to distil is refused as `NARRATIVE_EMPTY`.

## How `plan` and the board use it

A node's provenance cites an item by the repository-relative path and the item id:

```yaml
provenance:
  level: stated
  decided_by: agent-proposed-human-approved
  sources: ["openspec/changes/add-pause/conversation.md · J1"]
```

`openspec/changes/add-pause/conversation.md#J1` works too. The `plan-change` skill cites a `J` item
as `agent-proposed-human-approved`, an `SZ` item as `human`, an `E` item only for what the human chose
instead, and never cites a `P` item as an approval.

- `kotta plan` counts the citations in section (f) and lists each one that does not resolve: a
  path other than the change's own `conversation.md`, a change with no `conversation.md`, a citation
  naming no item, or an item no heading names.
- The board opens the cited exchange from the node's drawer, through its read-only
  `/api/narrative` endpoint. See [The board](board.md).

The casino change has no `conversation.md`: its nodes quote the conversation directly, with the
speaker and time in the quote (`(EMBER, 2026-09-23T13:03)`).
