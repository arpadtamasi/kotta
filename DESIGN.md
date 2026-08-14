---
name: Kotta Console v2
description: A hard-edged evidence ledger for repository-native human–AI work.
colors:
  signal-red: "#ec3013"
  signal-red-soft: "#fff2ef"
  signal-red-light: "#ff9783"
  signal-red-hover: "#dd2b0f"
  signal-red-text: "#ae1800"
  archive-paper: "#f3f2f2"
  record-surface: "#eae9e9"
  repository-ink: "#201e1d"
  muted-ink: "#605d5d"
  completion-green: "#53a77a"
  contract-stamp: "oklch(.45 .14 258)"
  observation-stamp: "oklch(.44 .12 66)"
  batch-stamp: "oklch(.42 .15 305)"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.25
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.1em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "0px"
  md: "0px"
  lg: "0px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.archive-paper}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "6.8px 12px"
  button-primary-hover:
    backgroundColor: "{colors.signal-red-hover}"
    textColor: "{colors.archive-paper}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "6.8px 12px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.repository-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "6.8px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.signal-red-text}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "6.8px 4px"
  input:
    backgroundColor: "{colors.record-surface}"
    textColor: "{colors.repository-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
    height: "36px"
  status-active:
    backgroundColor: "{colors.signal-red-text}"
    textColor: "{colors.archive-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  status-review:
    backgroundColor: "{colors.repository-ink}"
    textColor: "{colors.archive-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: Kotta Console v2

## Overview

**Creative North Star: "The Evidence Ledger"**

Kotta Console is a strict, precise, dense operational surface: a ledger where intent, provenance, execution state, and human decisions are made legible at a glance. Its modernist editorial order makes the repository feel inspectable rather than abstract; information and demonstrability always outrank ornament.

The interface is hard-edged, compact, and state-first. Archive-paper grounds, repository ink, strong rules, and a scarce signal red create an austere but purposeful field. A human-readable Archivo register explains the work while a monospace register exposes ids, paths, commands, counts, and timestamps as evidence.

The anti-references are a generic Kanban board, rounded “soft SaaS” furniture, and decorative dashboard or poster elements that compete with operational truth.

**Key Characteristics:**

- Visible modular grids and strong rules organize the screen.
- One warm signal color marks urgency, activity, and decisive emphasis.
- Square geometry, compact rows, and flush-left alignment keep the system exact.
- Human-readable hierarchy and machine-readable provenance remain visibly distinct.
- Empty, contradictory, active, review, and complete states each read without relying on color alone.

## Colors

The palette is near-monochrome: Archive Paper and Repository Ink carry the interface, while Signal Red is a scarce operational marker rather than decoration. Entity stamps add narrowly scoped blue, ochre, and violet identifiers; Completion Green appears only in completed-run state.

### Primary

- **Signal Red** (`signal-red`): active execution, urgency, primary emphasis, the Kotta mark, and structural alert rules.
- **Signal Red Soft** (`signal-red-soft`): error, warning, contradiction, and stale-state fields behind dark explanatory text.
- **Signal Red Light** (`signal-red-light`): legible accent detail on dark execution surfaces.
- **Signal Red Hover** (`signal-red-hover`): interactive hover treatment on solid primary actions.
- **Signal Red Text** (`signal-red-text`): accessible small red text and active fills that carry light labels.

### Secondary

- **Contract Stamp** (`contract-stamp`): contract identifiers and their underlines only.
- **Observation Stamp** (`observation-stamp`): observation identifiers and severity-adjacent provenance marks only.
- **Batch Stamp** (`batch-stamp`): batch identifiers only.
- **Completion Green** (`completion-green`): completed work inside the dark Run surface only.

### Neutral

- **Archive Paper** (`archive-paper`): the primary page ground and light text on dark fields.
- **Record Surface** (`record-surface`): filters, inactive states, inputs, code fragments, and grouped record areas.
- **Repository Ink** (`repository-ink`): primary text, the navigation rail, the Run surface, and decisive review states.
- **Muted Ink** (`muted-ink`): secondary explanations and metadata where contrast remains sufficient.

### Named Rules

**The Signal Is Scarce Rule.** Signal Red marks an active, urgent, or structurally important fact; it never becomes ambient decoration.

**The Contrast Carries Meaning Rule.** State is never communicated by tint alone: pair color with text, border style, position, or shape.

## Typography

**Display Font:** Archivo (with system-ui and sans-serif fallback)

**Body Font:** Archivo (with system-ui and sans-serif fallback)
**Label/Mono Font:** the platform UI monospace stack

**Character:** Archivo gives both hierarchy and body copy a blunt, workmanlike consistency. Monospace is not a stylistic flourish; it marks values that come from the repository or the execution environment.

### Hierarchy

- **Display** (800, 26px, 1.12): view titles and the largest operational headings.
- **Headline** (800, 19px, 1.1): workspace identity and prominent section subjects.
- **Title** (800, 15px, 1.25): batch names, panel titles, and high-priority row hierarchy.
- **Body** (400, 14px, 1.55): explanations, descriptions, and primary reading text.
- **Label** (800, 11px, 0.1em, uppercase): navigation, actions, states, section labels, and terse control language.
- **Mono** (400, 10.5px, 1.5): ids, commands, paths, timestamps, counts, branches, claims, and derived facts.

### Named Rules

**The Two-Register Rule.** Use Archivo to explain and prioritize; use monospace only to expose repository or runtime evidence.

**The Flush-Left Rule.** Headings, copy, row content, and labels inside wide controls align to the left edge rather than centering for decoration.

## Layout

The app is a full-viewport grid with a persistent dark rail (212px) and an overflow-contained content stage. The rail collapses to a 60px icon-and-step strip below 820px without removing accessible labels. The top status bar, running strip, filters, and stage views stack as strong horizontal records.

The home view uses three equal minimum-width bands separated by 2px rules; it becomes two columns below 1280px and one below 900px. Contract data uses dense five-column rows and folds to labeled single-column records below 1080px. Batch cards fill an auto-fitting grid with a 330px minimum. Drawers attach to the right edge at up to 680px; sheets center at up to 620px.

Spacing follows a compact 4px base rhythm with established steps at 4, 8, 12, 16, 24, and 32px. Major regions use visible 2px dividers, row structure uses 1px rules, and wide content scrolls inside its own container rather than forcing the page sideways. The dark Run view changes its dependency graph from horizontal waves to a vertical sequence below 900px.

**The Grid Must Be Seen Rule.** Major structure is expressed with equal cells and strong 2px rules; whitespace supports the grid but never replaces it.

## Elevation & Depth

The system is flat and structural by default. Depth comes from tonal fields, strong rules, attached drawers, scrims, and the full-screen dark Run context—not from floating card stacks. Soft ink-tinted shadow tokens exist for exceptional elevation, while the board itself mainly uses inset red edges to mark active or selected records.

### Shadow Vocabulary

- **Ink Tint Small** (`0 1px 2px color-mix(in srgb, #2d2b2b 14%, transparent)`): reserved for the smallest exceptional lifted state.
- **Ink Tint Medium** (`0 3px 10px color-mix(in srgb, #2d2b2b 16%, transparent)`): reserved for a system-level overlay that needs separation beyond a structural border.
- **Ink Tint Large** (`0 12px 32px color-mix(in srgb, #2d2b2b 22%, transparent)`): reserved for top-level modal elevation, not cards or ordinary panels.

### Named Rules

**The Flat-by-Default Rule.** If a border, tonal field, or attached edge can express hierarchy, use it before a shadow.

## Shapes

The form language is rectangular and architectural. Small, medium, and large radius tokens are all deliberately zero; buttons, fields, tags, cards, drawers, sheets, and status marks stay square. Borders and inset edge bars create silhouettes. Circular geometry is reserved for tiny agent-presence dots, never for containers or primary controls.

**The Zero Radius Rule.** Do not round corners anywhere in the product interface; square edges are part of the product’s identity and information density.

## Components

Components are **hard-edged, compact, state-first**: every control and container first communicates state, provenance, or the next meaningful reading.

### Buttons

- **Shape:** square, flush-left, and compact (0px radius; 6.8px × 12px default padding).
- **Primary:** Signal Red with Archive Paper text; hover and active states step darker through the established red ramp.
- **Hover / Focus:** every interactive element receives a themed hover and a 2px Signal Red visible-focus outline with 2px offset.
- **Secondary / Ghost:** secondary actions use an ink divider; ghost actions use deep red text and a light red hover field.

### Chips

- **Style:** uppercase compact labels with square edges. Neutral chips use a pale neutral field and rule; outlined chips use deep red text and border.
- **State:** lifecycle chips pair text with a distinct fill or border treatment. Blocked and unknown states use both warning fill and visible border.

### Cards / Containers

- **Corner Style:** square (0px radius).
- **Background:** transparent, Archive Paper, or Record Surface according to grouping and state.
- **Shadow Strategy:** flat by default; active records may use a narrow inset Signal Red edge.
- **Border:** 1px row rules within a region and 2px rules between major regions.
- **Internal Padding:** compact combinations of the 8, 12, 16, and 24px spacing steps.

### Inputs / Fields

- **Style:** Record Surface fill, ink text, 1px divider, square corners, and a 36px minimum height.
- **Focus:** the border shifts to Signal Red and the global visible-focus outline remains explicit.
- **Error / Disabled:** errors use a soft red field plus deep red text; disabled actions retain their shape and drop to 45% opacity.

### Navigation

The navigation rail is a permanent Repository Ink field. Items use uppercase Archivo labels, monospace step numbers and counts, strong separators, and a deep red active fill. Below 820px the rail compresses but retains semantic labels in the accessibility tree.

### Entity Stamps

Contracts, observations, and batches use small monospace identifiers with narrowly scoped blue, ochre, and violet treatments. The stamp identifies entity kind; lifecycle state remains a separate label.

### Derivation Panel

The provenance chain uses a Record Surface container, strong section rules, centered monospace arrows, and a Signal Red inset edge on the current entity. It reads as a trace through repository facts rather than a decorative flowchart.

### Run Cards

Run cards live on Repository Ink, use compact monospace metadata, and encode state with a labeled chip plus a left-edge treatment. Active, blocked, review, inconsistent, and complete states remain distinguishable by wording and border behavior as well as color.

**The State-First Rule.** Every component must make its current state or provenance legible before it expresses personality.

## Do's and Don'ts

### Do:

- **Do** use the existing color, type, spacing, radius, and shadow tokens instead of hard-coding parallel values.
- **Do** expose the modular grid with 2px major rules and compact 1px row separators.
- **Do** reserve Signal Red for active, urgent, or decisive information.
- **Do** pair Archivo hierarchy with monospace repository evidence.
- **Do** preserve visible keyboard focus, semantic labels, and reduced-motion behavior.
- **Do** keep state readable through wording and structure, not color alone.

### Don't:

- **Don't** round corners or introduce pill-shaped containers.
- **Don't** turn the board into a generic Kanban or a collection of floating cards.
- **Don't** center wide button labels, primary copy, or operational tables.
- **Don't** soften major rules into whitespace-only separation or ornamental shadows.
- **Don't** add decorative dashboard, poster, gradient, glow, or glass effects.
- **Don't** use entity stamp colors as general-purpose accents.
