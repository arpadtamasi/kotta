---
id: F-01m120k6vp17wv04gfxv5b9q5p
title: >-
  The site tells a visitor to install the skills with a pinned third-party
  command, when one Kotta command does that and more
status: new
origin: human
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-27'
---
# F-01m120k6vp17wv04gfxv5b9q5p — The site tells a visitor to install the skills with a pinned third-party command, when one Kotta command does that and more

## Observation

The site tells a visitor to install the skills with a pinned third-party command, when one Kotta command does that and more.

## Evidence

site/index.html:196-199 shows two setup commands: npm install --global @arpadtamasi/kotta@0.10.0, then npx skills@1.5.20 add arpadtamasi/kotta. README.md:135-145 already states the alternative and why it is better: kotta sync installs the same skills and also writes the workspace rules file, and kotta init does both, so a new project needs one command rather than two. The site therefore shows the weaker path as the verified setup: it pins a third-party installer at 1.5.20, and it leaves out the rules file that every agent in the project reads. The operator noticed it reading the site's own install block on 2026-08-26 and asked whether the second command is needed at all. It is not.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
