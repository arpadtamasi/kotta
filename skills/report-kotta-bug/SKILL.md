---
name: report-kotta-bug
description: Prepare and, after explicit approval, submit a defect report about Kotta itself as a GitHub Issue in arpadtamasi/kotta. Use when a user or agent hits a bug in the kotta CLI, skills, local board, or public site and wants to report it.
---

# Report a Kotta bug

Report defects in **Kotta itself** — the `kotta` CLI, the bundled skills, the local board,
or the public site. This never touches the user's own `.kotta` workspace: no task, no
observation, no decision is created locally by this skill. The destination is always
`arpadtamasi/kotta` on GitHub.

Issue form: `https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml`

Say which step you are in as you go: `investigating` → `awaiting-approval` → `submitting` →
`reported`, or `failed` with the draft intact. Never run two reports for the same defect at
once; if a draft already exists in this session, revise that draft instead of starting a new one.

## 1. Investigate (no approval needed)

Inspect only what you need to make the defect reproducible:

- The exact command or interaction and its observable output.
- The `kotta --version` output.
- The relevant Kotta source or skill file, if you already read it.

Separate **observed facts** from **impact hypotheses** and label them as such. Do not guess a
root cause and report it as an observation.

## 2. Check for duplicates

Search open issues before proposing a new one:

```bash
gh issue list --repo arpadtamasi/kotta --state open --search "<key words>"
```

Use the user's authenticated GitHub connector instead if one is available. If the search
cannot run, say so and continue. Report every likely duplicate with its number, title, and
URL, and ask whether to comment on the existing issue instead of creating a new one.

## 3. Sanitize the draft

The report is public. Before showing it to anyone:

- Replace absolute filesystem paths with repository-relative ones (`/Users/…/repo/src/x.ts` → `src/x.ts`).
- Remove tokens, credentials, `.env` values, environment variable values, and Git remote URLs.
- Remove repository contents, task bodies, log files, and the agent conversation.
- Remove user, host, organization, and project identifiers unless the user names them.
- Quote only the minimum output needed to recognize the defect, redacted.

If a required field cannot be filled safely, write `unknown` and explain why. Never block the
report on a missing field.

## 4. Outbound draft

Prepare exactly this structure — five required fields, no diagnostics:

```markdown
### Summary

<one sentence, observed>

### Reproduction steps

1. <step>
2. <step>
3. <step>

### Expected behaviour

<what should happen>

### Actual behaviour

<what happened, redacted>

### Kotta version

<output of `kotta --version`, or "unknown">
```

Optional diagnostics are **off by default**. Adding any of them needs a separate per-report
opt-in — general approval to file the issue is not consent. Enumerate the exact fields first:

- Node.js version and operating system.
- The failing command and its redacted output.
- The redacted `--json` error payload.

Add only the fields the user ticks, for this report only, appended under a
`### Diagnostics (opted in)` heading. Never infer consent, never carry it to the next report.

## 5. Ask for approval

Show the user, verbatim and before any external write:

- The destination repository: `arpadtamasi/kotta`.
- The exact issue title.
- The exact issue body that will be sent.
- The diagnostic fields included (`none` when the user opted out).
- Any duplicate candidates found.

Then ask for explicit approval to create the issue. If the user rejects or cancels: create no
issue, send nothing, and return the draft as copyable Markdown.

## 6. Submit (only after approval)

Prefer the user's already authenticated GitHub connector. Otherwise:

```bash
gh issue create --repo arpadtamasi/kotta --title "<title>" --body-file <draft.md>
```

Return the created issue URL. Never store, request, or read a GitHub token; Kotta itself
holds no credential.

## 7. When submission is not possible

If no authenticated GitHub capability exists, `gh` is not installed or not logged in, or the
submission fails, do not retry silently. Return:

1. The complete sanitized report as copyable Markdown.
2. The direct issue form URL: `https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml`.

Retry, if the user asks for one, reuses the same approved draft — never a re-sanitized or
re-expanded one. GitHub remains authoritative for final duplicate detection.

## 8. For Kotta maintainers only

An incoming GitHub Issue is evidence, not scheduled work. Capture it in the Kotta
maintainer workspace as a observation and keep the issue URL in the evidence:

```bash
kotta observation new --title "<issue title>" --type bug \
  --evidence "https://github.com/arpadtamasi/kotta/issues/<n> — <reported facts>"
```

The observation stays open until `kotta observation validate` and a human-approved
`kotta observation resolve --disposition <disposition> --approve`. A GitHub Issue never creates a
task by itself.
