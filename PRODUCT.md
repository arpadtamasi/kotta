# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a developer or technical lead working locally with one or more coding agents. They turn product intent into bounded work, monitor what agents are doing, and make explicit decisions about whether evidence-backed outcomes are acceptable.

Coding agents are a secondary audience. They consume the same repository record as the human operator and must be able to derive the same scope, state, constraints, and next legal action.

## Product Purpose

Kotta is a repository-native operating system for human–AI development teams. It turns intent into executable contracts, coordinates related work in batches, isolates agent execution with Git, and keeps completion tied to reproducible evidence and human acceptance.

Success means a human can safely direct work larger than they can continuously observe without losing control of scope, execution state, provenance, or acceptance.

## Positioning

Kotta provides the control layer between human intent and agent execution. Its durable plain-file contracts, validated lifecycle gates, claims, Git-isolated worktrees, evidence mapping, and explicit human approvals bind the workflow to the repository itself.

It complements rather than replaces agent chats, issue trackers, and agent runtimes: those systems may communicate, organize, or execute work, while Kotta keeps the canonical agreement and verifies the legal transitions around it.

## Operating Context

Kotta runs inside an existing Git repository. Humans interact through a calling chat backed by Kotta's MCP tools or through the CLI fallback; agents execute from bounded briefs in isolated branches and worktrees. A local, read-only web board projects the canonical state and history without becoming a second mutation surface.

The working rhythm is short and frequent: inspect what needs human attention, see what agents are doing, dispatch ready work, leave execution running, then return to review evidence and decide. The repository remains the shared record across chat sessions, agents, branches, worktrees, and restarts.

The core lifecycle is `backlog → defined → active → review → done`. Observations capture possible work without automatically becoming contracts; contracts define executable outcomes and verification; batches coordinate dependency-aware execution; claims connect active work to one agent, branch, and worktree.

## Capabilities and Constraints

- Canonical state is stored as Markdown, YAML, JSON, and Git history under `.kotta/`; the CLI and MCP services validate every mutation.
- Human approval is required for consequential lifecycle decisions. Agents may investigate and execute, but do not invent product intent or accepted trade-offs.
- The board is a read-only local projection. Actions happen through calling-chat tools or the CLI.
- Execution is isolated by claim, feature branch, and worktree. Parallel work uses separate worktrees.
- Acceptance conditions must map to concrete, reproducible evidence before completion.
- Kotta is local-first, MIT licensed, and requires no hosted account, database, or hidden state.
- The published npm package is `@arpadtamasi/kotta`; the `kotta` binary is the primary interface and `a-team` remains a compatibility alias.
- Node.js 20 or newer and Git are required. Codex is the currently verified guided host; the CLI remains the portable recovery and automation surface.
- The existing `.a-team/` workspace shape and pre-rename terminology remain supported through explicit compatibility and migration paths rather than silent rewriting.

## Brand Commitments

The product name is **Kotta**. The voice is direct, precise, operational, and evidence-led. It emphasizes human control without portraying agents as untrusted or adversarial.

Official brand assets live in `assets/brand/`. Existing public materials use the claims “Repository-native control for human–AI teams” and “Humans own intent. Agents investigate and execute. Git isolates the work. The repository keeps the shared truth.”

## Evidence on Hand

- `README.md` documents the public product model, installation path, lifecycle, safety rules, compatibility guarantees, and release process.
- `site/index.html` contains the current public positioning, workflow explanation, trust claims, and verified quickstart copy.
- `ui/src/App.tsx` implements the local read-only board; `ui/spec-assets/v2-*.png` capture representative shipped states.
- `ui/UX-SPEC.md` preserves product and workflow reasoning, while explicitly deferring current board layout and wording to the shipped Console v2 implementation.
- `assets/brand/` contains the official Kotta mark and favicon assets.
- Unit, integration, UI, and Playwright suites cover lifecycle behavior, board behavior, responsive marketing layouts, keyboard access, and automated accessibility checks.

There are no confirmed testimonials, customer logos, pricing claims, or hosted-service metrics in the repository; future work must not fabricate them.

## Product Principles

1. Human intent and acceptance remain explicit authority.
2. The repository is the canonical truth; chat and UI are views of it.
3. Completion is demonstrated with evidence, not merely reported.
4. Agent execution stays bounded, isolated, and attributable.
5. Kotta integrates with the surrounding development stack instead of replacing it.

## Accessibility & Inclusion

Web interfaces must remain keyboard-usable, expose clear semantic structure and accessible names, preserve visible focus, respect reduced-motion preferences, and avoid serious or critical automated accessibility violations across supported layouts.
