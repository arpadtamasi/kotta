---
name: quality-scenarios
description: This skill should be used when the user asks to "define a quality attribute scenario", "make performance measurable", "specify reliability or security quality", "set an SLO", or replace vague non-functional requirements with verifiable measures.
---

# Quality scenarios

Turn a vague quality claim into an SEI-style scenario: source, stimulus, environment, artifact,
response, and measure. Persist the result as a `quality-attribute` node and connect it to a concrete
verification example.

## Recognize the form

Read `.kotta/spec/forms/quality-attribute.yaml` before drafting. Recognize the form when performance,
availability, security, accessibility, modifiability, or operability is discussed with a workload,
failure, environment, threshold, percentile, or error budget. Treat words such as “fast”, “secure”,
and “scalable” alone as prompts for clarification, not as complete requirements.

## Run the workshop

1. Name the source of the stimulus and the exact stimulus.
2. State the environment, including workload and degraded conditions that change the expectation.
3. Identify the artifact that must respond.
4. Describe the observable response without prescribing implementation.
5. Set a measure with units, aggregation or percentile, window, and permitted variance.
6. Attach an example that states who measures it and in which acceptance environment.

Ask which decision the number supports, what baseline exists, how representative data is prepared,
and what happens when the measure is missed. Draft a complete provisional scenario first and mark
unsupported values as assumptions. Never hand the user six empty quality-attribute fields.

Write the node under `.kotta/spec/quality-attributes/` with the registered identity and filename. Supply
verification through an example whose `subjects` contains the quality-attribute id. Keep tooling and
dashboard details in the example or prose; the canonical claim is the measured response.

## When not to use

Do not use a quality scenario for functional correctness already captured by an example, for an
unmeasurable aspiration, or to disguise an arbitrary target as user need. Do not choose a percentile
or workload without evidence; mark the gap explicitly instead.

## Worked example

`.kotta/spec/quality-attributes/candidate-search-latency-00000009.md`:

```markdown
---
id: QA-01m0aq00000000000000000009
form: quality-attribute
title: Candidate search latency
---

# Source

A staffing coordinator using the production search interface.

# Stimulus

Request qualified candidates for one approved staffing request.

# Environment

Normal business hours, 60,000 people in the competency catalog, 30 concurrent searches, with caches
warm but no result cached for the request.

# Artifact

Candidate matching and eligibility evaluation.

# Response

Return the complete eligible candidate set with competency and availability evidence.

# Measure

At least 95% of requests complete within 2 seconds and no request exceeds 5 seconds, measured at the
public interface over a 30-minute acceptance run.
```

The worked example `EX-01m0aq00000000000000000006` names this scenario in `subjects` and states the
acceptance environment's observed threshold.
