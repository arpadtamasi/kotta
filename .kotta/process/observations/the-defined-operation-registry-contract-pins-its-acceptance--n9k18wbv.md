---
id: F-01m0ahnn050zz0zr7yn9k18wbv
title: >-
  The defined operation-registry contract pins its acceptance to counts that are
  wrong: 40 subcommands and 10 MCP tools against an actual 44 and 18
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-18'
disposition: amend-spec
resolved_at: '2026-08-22T22:40:47.299Z'
approved_by: cli
approved_at: '2026-08-22T22:40:47.299Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - BR-01m0nsyasfnjc9s4073r8zb33j
  - IF-01m0f0wn8994dzf9z1sdygxa04
  - IF-01m0f0wn89cq1pnnsta9q8wqx9
---
# F-01m0ahnn050zz0zr7yn9k18wbv — The defined operation-registry contract pins its acceptance to counts that are wrong: 40 subcommands and 10 MCP tools against an actual 44 and 18

## Observation

The defined operation-registry contract pins its acceptance to counts that are wrong: 40 subcommands and 10 MCP tools against an actual 44 and 18.

## Evidence

Measured on 2026-08-18 against src/cli/index.ts and src/commands/mcp.ts at d28170d, while walking .kotta/defined/one-operation-registry-derives-both-the-cli-and-the-mcp-surf-06fw8n0g.md (T-01kzda6nj9hd2z45tt06fw8n0g) as a contract-format exercise.

(1) CLI count. The contract states "src/cli/index.ts registers 40 subcommands" and makes the number an acceptance condition: "identical to the captured pre-change snapshot: same 40 subcommands". Actual: `grep -c 'command("' src/cli/index.ts` = 49, of which 5 are group declarations that are not invocable commands (contract at :233, observation at :343, decision at :374, batch at :398, claim at :464). 49 - 5 = 44 subcommands.

(2) MCP count. The contract states "src/commands/mcp.ts registers 10 tools" and makes it an acceptance condition: "same 10 tools, same names, same input schemas, same annotations". Actual: 10 direct registerTool call sites, plus two loops over ["contract","observation","decision","batch"] at src/commands/mcp.ts:68 and :83 registering `${entity}_list` and `${entity}_show` = 8 further tools. 10 + 8 = 18. The MCP tool listing exposed to this session confirms 18 kotta tools.

Both acceptance conditions are unsatisfiable as written: a pre-change snapshot of 40 subcommands or 10 tools cannot be captured, so the contract cannot be closed against its own text. The error is systematic, not a typo: the prose counted registration call sites rather than registered commands, and a call site inside a loop registers four.

Three further defects in the same contract, found by the same walk and bearing on the same remedy:

(3) "Open decisions: None." while four structural questions are unanswered. Writing the registry entry out as a type immediately contradicts the contract's own model of "each entry names the operation, its service function, and its exposure": (a) the CLI names an operation `contract review` while MCP names it `contract_submit_review` (src/cli/index.ts:292 vs src/commands/mcp.ts:172), and CLI `start --caller` and MCP `contract_start_caller` are one service behind a flag — so an entry's identity can be neither surface's name; (b) `${entity}_list`/`${entity}_show` derives 8 tools from one call site, leaving it undecided whether the registry holds operations or operation families; (c) `contract brief` (src/cli/index.ts:316) is not print(service(...)) — it writes the brief to stdout, a summary to stderr and honours --out, so either an entry carries a renderer or `brief` sits outside the registry and the totality test needs an exception; (d) humanize (src/cli/index.ts:58) special-cases three commands, and the contract's only words on this are "makes it visible as a per-operation formatting concern", which defers rather than decides.

(4) A durable decision sits in Execution notes instead of .kotta/decisions/: "MCP exposure is declared per operation with a required reason for omission, rather than defaulting to absent", together with its rationale ("the observed failure mode was silence") and its reversal cost. That is Decision / Context / Consequences in the wrong file, invisible to any later contract.

(5) The premise "nothing relates the two lists" is partly false. The entity array at src/commands/mcp.ts:68 already derives 8 of the 18 tools from a single declaration — a partial registry the contract does not account for, and which changes what "introduce a registry" has to mean.

The contract is in `defined` and unsigned, so the remedy is redefinition before signing, not a change to shipped behaviour.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
