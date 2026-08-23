---
id: EX-01m0psa97ffhvt91tgbanbt8mz
form: example
title: "A surface name without a declaration fails the build"
subjects:
  - BR-01m0nsyasfnjc9s4073r8zb33j
---

## Given

Both surfaces are built from the operation declaration, and a developer adds a CLI command or an MCP tool directly to its surface without declaring the operation.

## When

The binary starts, or the tool server is constructed, and the totality test runs.

## Then

Construction refuses by name — the surface built something no operation declares — and the totality test fails as a set difference, in both directions: a declared exposure nobody built fails in the same way. Neither side is compared by count, so the assertion stays true as the surface grows.
