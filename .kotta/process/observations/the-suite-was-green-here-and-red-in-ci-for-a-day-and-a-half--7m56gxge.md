---
id: F-01m17n3dt0nm04maay7m56gxge
title: >-
  The suite was green here and red in CI for a day and a half, and nothing here
  looked
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-29'
---
# F-01m17n3dt0nm04maay7m56gxge — The suite was green here and red in CI for a day and a half, and nothing here looked

## Observation

The suite was green here and red in CI for a day and a half, and nothing here looked.

## Evidence

The npm release for 0.11.0 failed at 'Test and build' (run 33273886825): tests/integration/batch.test.ts 'creates a backlog batch and keeps task membership in sync' died with 'Author identity unknown ... fatal: empty ident name'. That fixture never set git user.name/user.email, unlike every other fixture in the file. It did not matter until commitControlState was added to newBatch on 2026-08-28, after which 'batch new' commits and needs an identity. Reproduced locally by running the file with an empty HOME: fails without the fix, 7 passed with it. The GitHub Pages workflow gates deployment on the same 'npm test' and has failed on every push since 2026-08-28T09:21 (runs 154-160, seven consecutive failures), so the site has not deployed for a day and a half either. Across that period this session reported the suite green after every wave, from a machine that happens to carry a global git identity, and never once read a CI result. Local green was reported as if it were the verdict; CI is the verdict, and it was red the whole time.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
