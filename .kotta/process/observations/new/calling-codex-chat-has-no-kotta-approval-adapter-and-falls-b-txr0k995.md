---
id: F-01kz9dmjb3m6jczvwbtxr0k995
title: Calling Codex chat has no Kotta approval adapter and falls back to terminal
status: new
origin: agent
observation_type: blocker
confidence: high
severity: medium
discovered_during: T-01kz8tk2t53jbax6mrseka50v9
created_at: '2026-08-05'
---
# F-01kz9dmjb3m6jczvwbtxr0k995 — Calling Codex chat has no Kotta approval adapter and falls back to terminal

## Observation

Calling Codex chat has no Kotta approval adapter and falls back to terminal.

## Evidence

A user asked an agent in the calling Codex chat to implement work. Although Kotta 0.4 provides chat-first approvals inside kotta ui, the caller chat had no Kotta tool or approval bridge. The agent therefore reported no active contract and instructed the human to run kotta contract new and later sign --approve in a terminal. This violates the user goal that the primary approval surface is the chat they are already using.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
