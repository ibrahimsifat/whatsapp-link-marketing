---
version: alpha
name: whatsapp-link-marketing-design-system
description: WhatsApp Business Link Generator brand design language — a professional, communication-driven palette anchored by WhatsApp Emerald Green (#059669) as the primary CTA and brand mark, Deep Slate (#0F172A / #020617) for high-contrast typography, Crisp White and Soft Slate surfaces (#FFFFFF / #F8FAFC) for clean data density, Amber (#D97706) for pending contact states, Crimson (#DC2626) for unsent/failed states, and Sky Blue (#0284C7) for integration highlights.

colors:
  primary: "#059669"
  on-primary: "#FFFFFF"
  primary-active: "#047857"
  primary-neutral: "#10B981"
  primary-pale: "#ECFDF5"
  primary-border: "#A7F3D0"
  ink: "#0F172A"
  ink-deep: "#020617"
  body: "#334155"
  mute: "#64748B"
  mute-light: "#94A3B8"
  canvas: "#FFFFFF"
  canvas-soft: "#F8FAFC"
  canvas-subtle: "#F1F5F9"
  border: "#E2E8F0"
  border-muted: "#CBD5E1"
  positive: "#059669"
  positive-deep: "#047857"
  positive-bg: "#ECFDF5"
  positive-border: "#A7F3D0"
  warning: "#D97706"
  warning-deep: "#B45309"
  warning-content: "#92400E"
  warning-bg: "#FFFBEB"
  warning-border: "#FDE68A"
  negative: "#DC2626"
  negative-deep: "#B91C1C"
  negative-darkest: "#991B1B"
  negative-bg: "#FEF2F2"
  negative-border: "#FECACA"
  accent-sky: "#0284C7"
  accent-sky-bg: "#F0F9FF"
  accent-sky-border: "#BAE6FD"
  accent-emerald: "#10B981"

typography:
  display-xxl:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 32px
    fontWeight: 700
    lineHeight: 38.4px
    letterSpacing: -0.8px
  display-xl:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 28px
    fontWeight: 700
    lineHeight: 33.6px
    letterSpacing: -0.6px
  display-lg:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 31.2px
    letterSpacing: -0.48px
  display-md:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.3px
  display-sm:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 25.2px
  display-xs:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
  body-lg:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-md-strong:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  body-sm:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
  body-sm-strong:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 13px
    fontWeight: 600
    lineHeight: 18px
  caption:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  button-md:
    fontFamily: Inter, system-ui, -apple-system, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px

components:
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    typography: "{typography.body-md-strong}"
    padding: "{spacing.md} {spacing.xl}"
  nav-link:
    textColor: "{colors.body}"
    hoverTextColor: "{colors.primary}"
    typography: "{typography.body-md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    hoverBackgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.lg}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    hoverBackgroundColor: "{colors.canvas-subtle}"
    textColor: "{colors.body}"
    borderColor: "{colors.border}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.lg}"
  button-destructive:
    backgroundColor: "{colors.negative-bg}"
    hoverBackgroundColor: "{colors.negative}"
    textColor: "{colors.negative}"
    hoverTextColor: "{colors.on-primary}"
    borderColor: "{colors.negative-border}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.lg}"
  button-whatsapp:
    backgroundColor: "{colors.primary}"
    hoverBackgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs} {spacing.md}"
  button-icon-circular:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    focusBorderColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.md}"
  textarea-editor:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    focusBorderColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  card-content:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  card-contact:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  card-feature:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-deep}"
    borderColor: "{colors.border}"
    typography: "{typography.display-xxl}"
    padding: "{spacing.lg} {spacing.xl}"
  badge-sent:
    backgroundColor: "{colors.positive-bg}"
    textColor: "{colors.positive-deep}"
    borderColor: "{colors.positive-border}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xxs} {spacing.sm}"
  badge-pending:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-content}"
    borderColor: "{colors.warning-border}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xxs} {spacing.sm}"
  badge-not-sent:
    backgroundColor: "{colors.negative-bg}"
    textColor: "{colors.negative}"
    borderColor: "{colors.negative-border}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xxs} {spacing.sm}"
  badge-variable:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary-border}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xxs} {spacing.sm}"
  footer:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.mute}"
    borderColor: "{colors.border}"
    typography: "{typography.caption}"
    padding: "{spacing.2xl} {spacing.xl}"

  # ─── Examples (Illustrative) ───
  ex-contact-card-sent:
    description: "Contact list row for a contact with status 'sent'."
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.border}"
    badgeBackground: "{colors.positive-bg}"
    badgeTextColor: "{colors.positive-deep}"
    badgeBorder: "{colors.positive-border}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  ex-contact-card-pending:
    description: "Contact row pending dispatch."
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.border}"
    badgeBackground: "{colors.warning-bg}"
    badgeTextColor: "{colors.warning-content}"
    badgeBorder: "{colors.warning-border}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  ex-batch-sender-panel:
    description: "Real-time bulk dispatch status console."
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.border}"
    activeIndicator: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  ex-message-template-card:
    description: "Template picker card with variable highlights."
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.border}"
    highlightBackground: "{colors.primary-pale}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  ex-duplicate-detector-card:
    description: "Duplicate contact warning and merge panel."
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.border}"
    borderAccentLeft: "{colors.primary-neutral}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"

---

## Overview

**WhatsApp Business Link Generator** (WhatsApp Link Marketing) is an outreach productivity platform designed for businesses, sales teams, and marketers. It facilitates bulk contact uploads, dynamic message templating, deduplication, and personalized WhatsApp link dispatch.

The design system uses a focused, trust-building communication palette anchored by five core color roles:

| Name | Token | Hex | Role |
|---|---|---|---|
| WhatsApp Emerald | `{colors.primary}` | `#059669` | Universal primary CTA, WhatsApp brand mark, active send states |
| Deep Slate | `{colors.ink}` | `#0F172A` | High-contrast heading typography, primary UI chrome |
| Slate Body | `{colors.body}` | `#334155` | Secondary text, field labels, metadata descriptions |
| Soft Amber | `{colors.warning}` | `#D97706` | Pending messages, warnings, awaiting-action badges |
| Alert Crimson | `{colors.negative}` | `#DC2626` | Not-sent status, destructive actions, duplicate removal |
| Clean Canvas | `{colors.canvas}` | `#FFFFFF` | Card surfaces, inputs, modals, high-density data sheets |
| Subtle Slate | `{colors.canvas-soft}` | `#F8FAFC` | Page background, table header contrast, structural depth |

The visual tone is clean, data-dense, and purposeful. Clean white card containers live on a calm `#F8FAFC` slate background, framed by subtle 1 px `#E2E8F0` hairline borders. High-contrast emerald accents ensure call-to-action clarity without visual fatigue.

**Key Characteristics:**
- **WhatsApp Emerald** `#059669` — Universal CTA color. Dispatches messages, initiates batch sends, and reinforces brand trust.
- **Deep Slate** `#0F172A` — Anchors primary headings, modal titles, and active selection rings.
- **Status Triad** — Clear, instant operational feedback:
  - **Sent**: Emerald tint (`#ECFDF5` fill, `#047857` text, `#A7F3D0` border).
  - **Pending**: Amber tint (`#FFFBEB` fill, `#92400E` text, `#FDE68A` border).
  - **Not Sent**: Crimson tint (`#FEF2F2` fill, `#DC2626` text, `#FECACA` border).
- **Subtle Radii** — `{rounded.sm}` (6 px) for buttons and inputs, `{rounded.md}` (8 px) for cards, and `{rounded.pill}` (9999 px) for status pills.
- **Hairline Depth** — Flat Level 1 borders (`1px solid #E2E8F0`) with zero intrusive shadows for crisp data presentation.

---

## Colors

### Brand & Accent
- **WhatsApp Emerald** (`{colors.primary}` — `#059669`): Primary brand color and universal CTA for all send operations and primary triggers.
- **Emerald Active** (`{colors.primary-active}` — `#047857`): Hover and pressed state for primary buttons.
- **Emerald Vibrant** (`{colors.primary-neutral}` — `#10B981`): Focus rings, progress meters, and dynamic indicator dots.
- **Emerald Pale** (`{colors.primary-pale}` — `#ECFDF5`): Soft container background for icon highlights, template variable chips, and positive badges.
- **Emerald Border** (`{colors.primary-border}` — `#A7F3D0`): Delicate stroke for positive pills and variable badges.
- **Sky Blue** (`{colors.accent-sky}` — `#0284C7`): Secondary accent for integrations (Google Sheets, URL link previews).
- **Sky Pale** (`{colors.accent-sky-bg}` — `#F0F9FF`): Background for Google Sheets import containers and data helper boxes.

### Surface & Background
- **Canvas** (`{colors.canvas}` — `#FFFFFF`): Pure white interior for cards, dialog surfaces, inputs, and popovers.
- **Canvas Soft** (`{colors.canvas-soft}` — `#F8FAFC`): Default page background ensuring pleasant contrast against white cards.
- **Canvas Subtle** (`{colors.canvas-subtle}` — `#F1F5F9`): Divider lines, hover state for table rows, and secondary button backgrounds.
- **Border** (`{colors.border}` — `#E2E8F0`): Default hairline stroke across all cards, containers, and inputs.
- **Border Muted** (`{colors.border-muted}` — `#CBD5E1`): Separator lines and active input boundaries.

### Text & Ink
- **Ink Deep** (`{colors.ink-deep}` — `#020617`): Display titles and hero header text.
- **Ink** (`{colors.ink}` — `#0F172A`): Section headings, card titles, and contact names.
- **Body** (`{colors.body}` — `#334155`): Default body text, form labels, and descriptive paragraphs.
- **Mute** (`{colors.mute}` — `#64748B`): Secondary text, timestamps, item counts, and column subtitles.
- **Mute Light** (`{colors.mute-light}` — `#94A3B8`): Input placeholders and disabled elements.
- **On Primary** (`{colors.on-primary}` — `#FFFFFF`): White text on emerald CTA buttons.

### Semantic Status Colors
- **Positive / Sent** (`{colors.positive}` — `#059669`):
  - Badge fill: `#ECFDF5` (`{colors.positive-bg}`)
  - Text: `#047857` (`{colors.positive-deep}`)
  - Stroke: `#A7F3D0` (`{colors.positive-border}`)
  - Meaning: Message sent successfully, valid phone number, connection established.
- **Warning / Pending** (`{colors.warning}` — `#D97706`):
  - Badge fill: `#FFFBEB` (`{colors.warning-bg}`)
  - Text: `#92400E` (`{colors.warning-content}`)
  - Stroke: `#FDE68A` (`{colors.warning-border}`)
  - Meaning: Contact awaiting message dispatch, incomplete custom variable, unsaved draft.
- **Negative / Not Sent** (`{colors.negative}` — `#DC2626`):
  - Badge fill: `#FEF2F2` (`{colors.negative-bg}`)
  - Text: `#DC2626` (`{colors.negative}`)
  - Stroke: `#FECACA` (`{colors.negative-border}`)
  - Meaning: Unsent contact, failed dispatch, invalid phone format, destructive delete action.

---

## Typography

Typography is set in **Inter / system-ui** across all components. High legibility and precise numeric alignment are critical for phone numbers, contact counts, and message previews.

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.display-xxl}` | 32px | 700 | 38.4px | App header master title (`WhatsApp Business Link Generator`). |
| `{typography.display-xl}` | 28px | 700 | 33.6px | Documentation / major landing section headers. |
| `{typography.display-lg}` | 24px | 600 | 31.2px | Section headers (`Upload Contacts`, `Message Editor`). |
| `{typography.display-md}` | 20px | 600 | 28px | Card headings and statistics totals. |
| `{typography.display-sm}` | 18px | 600 | 25.2px | Sub-panel titles (`Instructions`, `Duplicate Detection`). |
| `{typography.display-xs}` | 16px | 600 | 24px | Contact company name, template title. |
| `{typography.body-lg}` | 16px | 400 | 24px | Sub-header explanations and lead copy. |
| `{typography.body-md}` | 14px | 400 | 20px | Default body copy, table cell content, input values. |
| `{typography.body-md-strong}` | 14px | 600 | 20px | Bold inline highlights, phone numbers, action labels. |
| `{typography.body-sm}` | 13px | 400 | 18px | Secondary contact metadata (industry category, website). |
| `{typography.body-sm-strong}` | 13px | 600 | 18px | Status badge text, category pills. |
| `{typography.caption}` | 12px | 400 | 16px | Timestamp, row counts, helper footnotes, tooltips. |
| `{typography.button-md}` | 14px | 500 | 20px | Interactive button labels. |

---

## Layout

### Spacing System
- **Base grid unit**: 4 px.
- `{spacing.xxs}` 2 px · `{spacing.xs}` 4 px · `{spacing.sm}` 8 px · `{spacing.md}` 12 px · `{spacing.lg}` 16 px · `{spacing.xl}` 24 px · `{spacing.2xl}` 32 px · `{spacing.3xl}` 48 px.
- Card padding: Standard `{spacing.lg}` (16 px) for mobile; `{spacing.xl}` (24 px) for desktop containers.
- Form field vertical stack: `{spacing.md}` (12 px).
- Section vertical gap: `{spacing.xl}` (24 px) to `{spacing.2xl}` (32 px).

### Responsive Breakpoints

| Breakpoint | Viewport | Adaptations |
|---|---|---|
| Mobile | `< 640px` | Single-column contact list, full-width send buttons, collapsed header nav. |
| Tablet | `640px – 1023px` | 2-column contact cards, side-by-side action bars, condensed statistics bar. |
| Desktop | `≥ 1024px` | Full multi-column dashboard grid, persistent side panels, detailed analytics view. |

---

## Elevation & Depth

To preserve the utility and speed of an enterprise tool, elevation avoids heavy diffuse drop shadows in favor of crisp border separation:

| Level | Treatment | Use Case |
|---|---|---|
| Level 0 — Flat | Pure background color (`#F8FAFC`), no border, no shadow. | Main page layout canvas. |
| Level 1 — Hairline Card | White background (`#FFFFFF`), `1px solid #E2E8F0`, no shadow. | Default contact cards, message editor, feature containers. |
| Level 2 — Focus / Active | `1px solid #E2E8F0` + `2px solid #0F172A` ring or `#10B981` ring. | Selected contacts, active input focus state. |
| Level 3 — Floating Dialog | White background, `1px solid #E2E8F0`, shadow `0 10px 25px -5px rgba(0, 0, 0, 0.08)`. | Modals, Google Sheets import drawer, confirmation popups. |

---

## Shapes & Radii

| Token | Value | Applied To |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed section dividers. |
| `{rounded.xs}` | 4px | Micro-badges, inline code indicators (`{companyName}`). |
| `{rounded.sm}` | 6px | Action buttons (`button-primary`, `button-secondary`), form inputs. |
| `{rounded.md}` | 8px | Standard container cards, message template boxes, dialogs. |
| `{rounded.lg}` | 12px | Outer app containers, statistics summary panel. |
| `{rounded.pill}` | 9999px | Status badges (`Sent`, `Pending`, `Not Sent`), contact count chips. |
| `{rounded.full}` | 9999px | Circular icon containers, avatar initials. |

---

## Components

### Buttons

**`button-primary`** — WhatsApp Emerald CTA.
- Background: `{colors.primary}` (`#059669`), hover `{colors.primary-active}` (`#047857`), text `{colors.on-primary}` (`#FFFFFF`).
- Typography: `{typography.button-md}`, shape `{rounded.sm}` (6 px), padding `{spacing.sm} {spacing.lg}`.
- Used for: "Start Batch Sending", "Save Contacts", "Generate Link", "Load Saved".

**`button-secondary`** — Clean Outline Neutral.
- Background: `{colors.canvas}` (`#FFFFFF`), hover `{colors.canvas-subtle}` (`#F1F5F9`), text `{colors.body}` (`#334155`), border `1px solid {colors.border}` (`#E2E8F0`).
- Typography: `{typography.button-md}`, shape `{rounded.sm}`.
- Used for: "Export Contacts", "Documentation", "Clear Selection".

**`button-whatsapp`** — Direct Message Launcher.
- Background: `{colors.primary}` (`#059669`), text white, compact padding `{spacing.xs} {spacing.md}`, shape `{rounded.sm}`.
- Directly opens `https://web.whatsapp.com/send?phone=...&text=...` in a new tab.

**`button-destructive`** — Negative Action Button.
- Background: `{colors.negative-bg}` (`#FEF2F2`), text `{colors.negative}` (`#DC2626`), border `1px solid {colors.negative-border}` (`#FECACA`).
- Hover: Background `{colors.negative}` (`#DC2626`), text white.
- Used for: "Delete Contact", "Clear All Database", "Discard Template".

### Cards & Surfaces

**`card-content`** — Core Container.
- Background: `{colors.canvas}` (`#FFFFFF`), border `1px solid {colors.border}` (`#E2E8F0`), shape `{rounded.md}` (8 px), padding `{spacing.xl}`.

**`card-contact`** — Contact List Item.
- Background: `{colors.canvas}`, border `1px solid {colors.border}`, padding `{spacing.md} {spacing.lg}`.
- Selected state: `ring-2 ring-slate-900 bg-slate-50`.
- Displays company name, phone number, category pill, website link, status badge, and WhatsApp dispatch button.

**`card-feature`** — Trust & Value Callouts.
- Background: `{colors.canvas}`, border `1px solid {colors.border}`, padding `{spacing.md}`.
- Pairs an icon wrapped in `{colors.primary-pale}` (`#ECFDF5`) with bold text and sub-caption.
- Used for: "Secure & Private", "Lightning Fast", "Contact Tools".

### Navigation & Header

**`nav-bar`** — Top Sticky Navigation.
- Background: `{colors.canvas}` (`#FFFFFF`), border-bottom `1px solid {colors.border}` (`#E2E8F0`), height 64 px.
- Displays brand icon (`MessageCircle` in `#059669`), application title, and navigation links.

**`app-header`** — Workspace Action Header.
- Clean white banner with emerald icon avatar, application title, active database count badge, documentation link, and "Load Saved" action button.

### Form Inputs & Message Editor

**`text-input`** — Data Input Field.
- Background: `{colors.canvas}`, border `1px solid {colors.border}`, focus ring `2px solid {colors.primary}`.
- Text: `{colors.ink}` with placeholder in `{colors.mute-light}`.

**`textarea-editor`** — Dynamic WhatsApp Message Box.
- Height: Minimum 120 px, monospace or sans-serif formatting, counter for character count and dynamic variable detection (`{companyName}`, `{companyCategory}`, `{website}`).

**`badge-variable`** — Template Insert Pill.
- Background: `{colors.primary-pale}` (`#ECFDF5`), text `{colors.primary}` (`#059669`), border `1px solid {colors.primary-border}` (`#A7F3D0`), shape `{rounded.sm}`.
- Clickable chip to insert variable into active cursor position in the message box.

### Status Indicators

**`badge-sent`** (Delivered / Completed)
- Background: `#ECFDF5` · Text: `#047857` · Border: `1px solid #A7F3D0` · Shape: `{rounded.pill}`.

**`badge-pending`** (Awaiting Send)
- Background: `#FFFBEB` · Text: `#92400E` · Border: `1px solid #FDE68A` · Shape: `{rounded.pill}`.

**`badge-not-sent`** (Failed / Unsent)
- Background: `#FEF2F2` · Text: `#DC2626` · Border: `1px solid #FECACA` · Shape: `{rounded.pill}`.

---

## Do's and Don'ts

### Do
- Use **WhatsApp Emerald** (`#059669`) consistently for primary dispatch actions, brand marks, and completed send confirmations.
- Always pair white card containers (`#FFFFFF`) with the soft slate canvas (`#F8FAFC`) to preserve visual hierarchy.
- Use subtle rounded corners (`6px` for controls, `8px` for cards) to preserve clean enterprise density.
- Maintain the strict semantic meaning of the Status Triad: Emerald (Sent), Amber (Pending), Crimson (Not Sent).
- Ensure phone numbers and WhatsApp launch buttons have immediate visibility and accessible touch targets (min 36 px height).
- Keep variable tags visually distinct with `{colors.primary-pale}` so users understand dynamic templating.

### Don't
- Don't replace WhatsApp Emerald with arbitrary neon greens, yellow greens, or unrelated accent colors.
- Don't apply heavy drop shadows or floating 3D effects to contact cards; readability and scan-speed come first.
- Don't use red for pending or non-critical states; red is reserved exclusively for unsent/failed or destructive operations.
- Don't set buttons to fully pill-shaped (`9999px`) — pills are strictly reserved for status badges and counter tags.
- Don't use dark backgrounds for full data cards; dark backgrounds reduce readability during heavy bulk review.
