# Removed

Nodes that promise only behaviour of the 0.x process engine, which the 1.0.0-alpha.1 release
removed. Each leaves with the reason; no kept node names any of them.

- BR-01m0nsyasfnjc9s4073r8zb33j — One operation, one declaration: the operation declaration (`core/operations`) left with the process modules; the CLI and the read-only MCP tools are registered on their own.
- EX-01m0psa97ffhvt91tgbanbt8mz — A surface name without a declaration fails the build: illustrates the declaration above, which no longer exists.
- SM-01m0f0wn89gjy6dbk1j6fjpv6j — Task lifecycle: every transition was a `kotta task` command, all removed.
- EX-01m0mzvcvdvxzpr59p8v7387n3 — A captured task is drafted in place: `kotta task define --draft` is removed.
- BR-01m0m33yxt2vqxb3jvqc186ssy — A declared check is run, not transcribed: review submission and its evidence table are removed.
- EX-01m0m33yxvyppm683xrd5tk8f3 — A failing declared check refuses the review: illustrates the rule above, through `kotta task review`.
- BR-01m0xt48tjhkd5pxv30p6c7a46 — A disposition asks what the specification should have said: observations and their dispositions are removed.
- EX-01m0xt48tj8p7jm88vp8n22hjh — A remedy that adds a capability amends the specification: illustrates the disposition rule above.
- GT-01m0f0wn89ep8038fwn1nf1kkc — Disposition: names the outcome of observation triage, which no longer exists.
- SM-01m0f0wn892ntx934by9gwednb — Observation lifecycle: `kotta observation` is removed.
- BR-01m0vqr9k6r571egp3z8qwnpkj — An approval carries only the payload its action needs: the `approval_request` tool and its actions are removed.
- EX-01m0vqr9k6781kw70g9h722qk7 — A retirement without its supersession never reaches the human: task cancel and its approval request are removed.
- BR-01m0vqr9k64ht9h70fpjy6rky9 — An approval is decided once, and its outcome is durable: approval phases (applied, rejected, cancelled, failed) belonged to the removed approval requests.
- EX-01m0vqr9k6w5923nksb536e3j2 — A yes that could not be applied is recorded as a failure, not a transition: illustrates the approval phases above, through task close.
- BR-01m0vqr9k5ypcztw4v0ns2qa6a — One entity carries one undecided approval: pending approval requests on entities are removed.
- EX-01m0vqr9k6c4d77g48rw7akt6c — A second question about the same task is refused: illustrates the rule above, on a task.
- EX-01m0pw5bc7qdenh5j2pefb13ed — Retired work is not shown as delivered: task resolutions and batch reports are removed.
