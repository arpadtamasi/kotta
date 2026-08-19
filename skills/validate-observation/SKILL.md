---
name: validate-observation
description: Investigate and disposition a Kotta observation without silently turning it into scheduled work. Use when a user asks to validate, triage, deduplicate, resolve, or convert an agent- or human-discovered observation.
---

# Validate a observation

Treat a observation as evidence awaiting disposition, not as a contract. Use the `kotta` CLI for all observation mutations.

1. Read the observation and inspect the cited files, tests, logs, or reproduction.
2. Search new and resolved observations, contracts, and decisions for outcome-equivalent duplicates or related work.
3. State the concrete observation separately from predicted impact. Calibrate confidence and severity to the available evidence.
4. Recommend the smallest suitable disposition: create contract, attach to existing contract, investigate, accept risk, reject, or merge duplicate.
5. Run `kotta observation validate <observation-id>` and present its result.
6. Obtain the required human decision before creating scheduled work or accepting a trade-off.
   Record an explicitly approved durable trade-off with `kotta decision create --from <draft.md> --approve`; never hand-edit `.kotta/process/decisions/`.
7. For the chat surface's available create-contract and reject dispositions, prepare the exact
   action there and let the human approve it. For another supported disposition, or as recovery,
   give the human the CLI fallback: `kotta observation resolve <observation-id> --disposition
   <disposition> --approve` with any command-required references.

Never silently expand the contract during which the issue was discovered. A created contract begins in backlog unless an explicit, separately validated defined transition is authorized.
