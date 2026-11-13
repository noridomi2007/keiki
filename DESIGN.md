---
name: Keiki Ledger System
description: Editorial Ledger Precision design system for Vietnamese SME and household business bookkeeping under Circular 152/2025/TT-BTC.
colors:
  sovereign-indigo: "#2E2396"
  sovereign-indigo-deep: "#231978"
  emerald-stamp: "#0B6E54"
  cinnabar-red: "#B91C1C"
  amber-ochre: "#92400E"
  highlighter-yellow: "#FEF08A"
  ledger-paper: "#F6F8FB"
  specimen-sheet: "#FFFEF9"
  surface-white: "#FFFFFF"
  midnight-ink: "#111625"
  slate-muted: "#475569"
  slate-hairline: "#D5DCE8"
  indigo-tint: "#E8ECF6"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.sovereign-indigo}"
    textColor: "{colors.surface-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.sovereign-indigo-deep}"
  button-destructive:
    backgroundColor: "{colors.cinnabar-red}"
    textColor: "{colors.surface-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "36px"
  card-ledger:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  badge-stamp:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.emerald-stamp}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input-field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.midnight-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "36px"
---

# Design System: Keiki Ledger System

## Overview

**Creative North Star: "The Editorial Ledger Sanctuary"**

Keiki bridges traditional Vietnamese ruled-paper bookkeeping and deterministic Python accounting verification inside an unhurried, high-contrast web workspace. Inspired by fountain-pen ledger books stamped cleanly at shop counters, the interface foregrounds monetary figures, counterparty names, and Circular 152/2025/TT-BTC compliance tables without noisy dashboards or decorative clutter.

Every screen honors cognitive clarity for shop owners balancing counter rush on mobile (`390px`), counter tablet (`768px`), and desktop reconciliation (`1440px`). Rather than purple-gradient AI templates, deep Sovereign Indigo anchors primary actions, Cinnabar Red flags audit anomalies (`CROSS_DUPLICATE`, `PRICE_ANOMALY`), and Emerald Stamp seals verified entries.

**Key Characteristics:**
- Tactile ruled-ledger specimen aesthetic paired with flat hairline card architecture.
- Tabular monospace alignment (`tabular-nums`) for all VND totals, unit prices, and tax ratios.
- Vietnamese-first typography pairing (`Plus Jakarta Sans` + `Be Vietnam Pro` + `JetBrains Mono`) with full diacritic clarity.
- Offline-resilient bundled inline SVG iconography (`lucide-react` via `AppIcon`) with zero external icon webfont dependency.

## Colors

A disciplined editorial ledger palette grounded on cool archival paper (`#F6F8FB`) with high-contrast midnight ink and three deterministic accounting inks.

### Primary
- **Sovereign Indigo** (`#2E2396` / `oklch(31% 0.17 272)`): Primary CTA buttons, active workspace tab highlights, interactive ledger accent links, and focus outlines. Deepens to `#231978` on hover.

### Secondary
- **Emerald Stamp** (`#0B6E54` / `oklch(45% 0.11 163)`): Verified `"ĐÃ GHI SỔ"` official ledger stamp, positive cash inflow figures, and deterministic Python pass states.

### Tertiary
- **Cinnabar Red** (`#B91C1C` / `oklch(47% 0.19 25)`): Exception flags (`CROSS_DUPLICATE`), cash outflow totals, destructive confirmation actions, and wavy audit underlines.
- **Amber Ochre** (`#92400E` / `oklch(47% 0.12 65)`) & **Highlighter Yellow** (`#FEF08A` / `oklch(94% 0.14 98)`): Price shock alerts (`PRICE_ANOMALY`) and clarification question banners requiring shopkeeper sign-off.

### Neutral
- **Ledger Paper** (`#F6F8FB`): Application canvas and subtle banded table surfaces.
- **Specimen Sheet** (`#FFFEF9`): Ruled notebook surface with a crisp `1px` vertical margin line.
- **Surface White** (`#FFFFFF`): Elevated cards, inputs, dialogs, and mobile bottom bar.
- **Midnight Ink** (`#111625`): Primary body text, headings, and monetary amounts (`>= 14:1` on paper).
- **Slate Muted** (`#475569`): Secondary helper descriptions and column headers (`>= 7:1` contrast).
- **Slate Hairline** (`#D5DCE8`) & **Indigo Tint** (`#E8ECF6`): `1px` structural card borders, table dividers, and active tab surfaces.

### Named Rules
**The One Ink Priority Rule.** Primary Sovereign Indigo (`#2E2396`) occupies at most 10% of the viewport as primary CTAs and active state indicators; routine entries stay in Midnight Ink (`#111625`) on white or pale ledger paper so Cinnabar Red exceptions and Emerald Stamps demand immediate eye focus.

## Typography

**Display Font:** `'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif`
**Body Font:** `'Be Vietnam Pro', system-ui, sans-serif`
**Label/Mono Font:** `'JetBrains Mono', ui-monospace, monospace`

**Character:** Engineered geometric headlines paired with native Vietnamese diacritic clarity and strict tabular monospace numerals so multi-column VND spreadsheets never shimmer horizontally.

### Hierarchy
- **Display** (`800`, `clamp(2.25rem, 4vw, 3rem)`, `1.08`): Landing Hero headline (`text-wrap: balance`).
- **Headline** (`800`, `1.5rem–1.875rem`, `1.2`): Section headers (`h2`) and major page titles.
- **Title** (`700`, `1.125rem`, `1.35`): Card titles and review question headers.
- **Body** (`400–500`, `1rem` / `16px` base; `18.5px` in `large-text-mode`, `1.6`): Prose descriptions and extracted line items (`text-wrap: pretty`, readable measure `<= 68ch`).
- **Label** (`600–700`, `0.75rem` minimum floor `12px`, `1`): Status pills, stamps, and form field labels.
- **Mono** (`500–700`, `0.875rem`, `1.4`): VND currency amounts, ISO dates, tax rates, and book codes (`S1-HKD`, `S2-HKD`, `S3-HKD`) with `font-variant-numeric: tabular-nums`.

### Named Rules
**The 12px Floor Rule.** No user-facing text, badge, table header, or mobile tab label renders smaller than `12px` (`0.75rem`); an accessible `large-text-mode` toggle scales the root font size cleanly to `18.5px`.

## Layout

Desktop workspace splits into an asymmetric `12`-column ledger grid (`5` columns input intake on the left, `7` columns live ledger/review/reports on the right) constrained within `max-w-7xl` (`max-w-6xl` on editorial marketing sections). Mobile viewports (`< 1024px`) collapse into single-column flows with a fixed 4-column (`grid-cols-4`) bottom tab bar (`Thêm mới`, `Sổ kế toán`, `Cần hỏi lại`, `Báo cáo`), preventing horizontal scrolling (`overflow-x: clip`) across `390px`, `768px`, and `1440px`.

## Elevation & Depth

Surfaces rely primarily on sharp `1px solid #D5DCE8` borders and crisp tonal paper shifts (`#FFFFFF` cards over `#F6F8FB` canvas) rather than heavy drop shadows. Subtle ambient elevation appears only on hero specimen previews (`shadow-md`), hoverable surface lifts (`.surface-lift`), landing floating bottom dock (`FloatingNavPill`), and modal dialogs (`Dialog`).

### Shadow Vocabulary
- **Subtle Card Hairline** (`box-shadow: 0 1px 2px rgba(17, 22, 37, 0.04)`): Applied to resting KPI cards (`shadow-xs`).
- **Hero Specimen Depth** (`box-shadow: 0 4px 16px rgba(17, 22, 37, 0.08)`): Applied to the interactive Hero proof ledger card (`shadow-md`).
- **Landing Hero Atmosphere & Obsidian Dock:** Featherweight WebGL1 contour field (`HeroShaderCanvas`, subtle `#2E2396`/`#0B6E54` ink ripples over `#F6F8FB` paper) with an explicit `"Dừng nền" / "Chạy nền"` pause toggle plus automatic `IntersectionObserver` and `prefers-reduced-motion` suspension; desktop landing dock elevates in crisp `#111625/95` (`backdrop-blur-md`).

### Named Rules
**The Flat Ledger Rule.** Surfaces remain flat and un-nested at rest; internal groupings use `divide-y` hairlines or flat tinted bands (`#F6F8FB`) instead of boxed cards inside cards.

## Shapes

Generous, trustworthy squircle corners (`--radius: 0.625rem` / `10px`) keep ledger UI approachable without feeling toy-like: `rounded-lg` (`8px`) for buttons and inputs, `rounded-xl` (`14px`) for cards and warning bands, `rounded-2xl` (`18px`) for hero panels, and `rounded-full` (`9999px`) for semantic status pills. Cards avoid thick (`> 1px`) colored left or right border accents.

## Components

Tactile, crisp-bordered accounting primitives backed by `shadcn/ui` and `@base-ui/react`, delivering instant visual feedback on press, hover, and focus.

### Buttons
- **Shape:** Squircle `8px` (`--radius-md`), minimum height `36px` (`h-9`), primary mobile camera CTA at full card width.
- **Primary:** `#2E2396` background, `#FFFFFF` `600` label, subtle `1px` active downward press (`active:translate-y-px`).
- **Hover / Focus:** `#231978` background on hover; `2px solid #2E2396` outline offset by `2px` on `:focus-visible`.
- **Secondary / Outline / Destructive:** Outline (`1px solid #D5DCE8` on `#FFFFFF`), Ghost (`#EEF1F7` hover), and Destructive Solid (`#B91C1C` for explicit rejection).

### Badges & Official Stamp
- **Style:** Minimum `32px` height (`min-h-8`), generous breathing room (`px-3.5 py-1.5`), uppercase/tabular semantic indicators (`#0B6E54` emerald outline/tint for `ĐÃ GHI SỔ`, `#B91C1C` red tint for `Cần hỏi lại`, `#92400E` amber for `PRICE_ANOMALY`).
- **Signature Stamp (`<Stamp />`):** Rotated `-6deg` monospace badge bordered in `#0B6E54/60` with `stampDrop` ink-stamp micro-animation (disabled automatically under `prefers-reduced-motion`).

### Cards / Containers
- **Corner Style:** `14px` (`rounded-xl`) built on `@/components/ui/card`.
- **Background:** `#FFFFFF` over `#F6F8FB` background.
- **Border:** Unified `1px solid #D5DCE8` around all four sides.
- **Internal Padding:** `16px–24px` (`p-4` to `p-6`) with `min-w-0` on grid tracks.

### Inputs / Fields
- **Style:** `#FFFFFF` fill, `1px solid #CBD5E1`, height `36px` (`h-9`), `8px` radius.
- **Focus:** `2px solid #2E2396` ring (`ring-3 ring-ring/20`) and crisp indigo caret (`caret-color: #2E2396`).

### Navigation
- **Desktop Top Bar:** Horizontal tab buttons (`Sổ kế toán`, `Cần hỏi lại` with red count badge, `Báo cáo & Xuất sổ`) on `#FFFFFF`.
- **Desktop Landing Floating Dock (`>= 1024px`):** Obsidian (`#111625/95`) bottom pill (`FloatingNavPill`) appearing after `scrollY > 420`, highlighting the active landing section via `IntersectionObserver` + shared `layoutId` pill highlight, alongside quick `Lên đầu trang` and `Mở sổ ngay` actions (hidden below `lg`, with `lg:pb-24` footer clearance).
- **Mobile Bottom Bar (`< 1024px`):** Fixed `grid-cols-4` bar dividing `390px` evenly (`95.5px` per tab) with bundled `lucide-react` SVG icons above truncated `12px` labels.

## Do's and Don'ts

### Do:
- **Do** align every currency amount, percentage, and invoice code using `font-mono tabular-nums` and right-align table amounts.
- **Do** bundle every UI icon locally via `AppIcon` (`lucide-react` SVGs) so icons never degrade into raw text strings offline.
- **Do** enforce `min-w-0` on CSS Grid and Flexbox columns and `overflow-x: clip` on `html, body` to guarantee zero horizontal overflow on `390px` screens.
- **Do** use generous pill padding (`min-h-8 px-3.5 py-1.5`) and `>= 12px` text across every control and stamp.

### Don't:
- **Don't** place unrequested pill eyebrows above section headings or numbered `01 / 02 / 03` kickers above cards.
- **Don't** nest bordered cards inside other bordered cards; use hairline `divide-y` lists or flat `#F6F8FB` tonal bands instead.
- **Don't** add thick (`> 1px`) left or right colored accent borders to cards or alert boxes.
- **Don't** weaken CSP headers or embed hardcoded demo credentials inside client bundles.
