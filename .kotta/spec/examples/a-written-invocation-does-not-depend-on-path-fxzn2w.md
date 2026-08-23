---
id: EX-01m0qyxvz926gdbvzm4bfxzn2w
form: example
title: "A written invocation does not depend on PATH"
subjects:
  - BR-01m0qyxvz954ay2rbm00bazrd5
---

## Given

Kotta running from a Node installation that a non-interactive shell would not put on PATH — the ordinary result of installing it through a version manager.

## When

`kotta integrate` writes a host's tool configuration.

## Then

The recorded invocation names the interpreter and the absolute entry point that are running at that moment, so a host spawning it with an empty PATH still starts Kotta. Running integrate again against a configuration whose recorded invocation no longer resolves says so and names it, instead of reporting the host as already configured.
