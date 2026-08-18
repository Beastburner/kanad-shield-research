# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** CrimeGPT
**Generated:** 2026-08-19 00:02:59
**Category:** Legal Services
**Design Dials:** Variance 4/10 (Balanced / Modern) | Motion 3/10 (Subtle) | Density 8/10 (Dense / Dashboard)

---

## AS IMPLEMENTED — authoritative

> The "Global Rules" section below is the raw generator output. Where the two
> disagree, **this section wins** — it documents the tokens actually shipped in
> `crimegpt/frontend/src/theme.ts`.
>
> Two deliberate divergences from the generator:
> 1. **Palette.** The generator is non-deterministic across the several
>    government palettes in its database (it emitted "Authority navy + trust
>    gold" here and "High contrast navy + blue" on a prior run). The shipped
>    palette is **Government/Public Service** — navy + blue, no gold.
> 2. **Fonts.** EB Garamond and Lato have no Devanagari or Gujarati coverage,
>    and this app ships `hi` and `gu` locales. Both are paired with Noto faces
>    so Indic text keeps a matched optical size.

### Implementation

MUI v9 `colorSchemes` with `cssVariables` enabled. Light is the default; a
toggle in the header persists the choice to `localStorage['mui-mode']`, and a
pre-paint script in `index.html` applies it to
`document.documentElement[data-mui-color-scheme]` to avoid a flash on reload.

**Components must reference semantic roles, never raw hex** — `background.paper`,
`text.secondary`, `divider`, `success.main`. For tinted fills use the generated
channel tokens, which resolve per scheme:

```jsx
bgcolor: 'rgba(var(--mui-palette-success-mainChannel) / 0.12)'
```

### Colour roles

| Role | Light | Dark | Contrast (light) |
|------|-------|------|------------------|
| `primary.main` (CTA) | `#0369A1` | `#38BDF8` | 5.9:1 on white |
| `secondary.main` (authority navy) | `#0F172A` | `#CBD8E8` | 16.8:1 on bg |
| `background.default` | `#F8FAFC` | `#0B1220` | — |
| `background.paper` | `#FFFFFF` | `#131C2E` | — |
| `text.primary` | `#020617` | `#E8EEF7` | 19.6:1 |
| `text.secondary` | `#64748B` | `#9FB0C7` | 4.8:1 on white |
| `divider` | `#E2E8F0` | `rgba(148,163,184,.18)` | — |
| `success.main` | `#15803D` | `#4ADE80` | 5.0:1 on white |
| `warning.main` | `#B45309` | `#FBBF24` | 5.0:1 on white |
| `error.main` | `#DC2626` | `#F87171` | 4.8:1 on white |

Every light-mode pair above clears WCAG AA (4.5:1) for body text.

### Typography

- **Headings h1–h4:** `"EB Garamond", "Noto Serif Devanagari", "Noto Serif Gujarati", Georgia, serif`
- **Body + h5/h6, tabs, tables, buttons:** `"Lato", "Noto Sans Devanagari", "Noto Sans Gujarati", "Segoe UI", system-ui, sans-serif`
- **Case numbers, SHA-256 hashes:** `"IBM Plex Mono", ui-monospace, Menlo, monospace` (exported as `MONO_FONT`)

Serif is reserved for page and section titles, where it reads as institutional.
Anything meant to be scanned stays on the sans face.

### Non-negotiables in this codebase

- Radius `6px`; no glow shadows, no gradient fills, no card hover-lift.
- Transitions 150–300ms (theme uses 180ms); a global `prefers-reduced-motion`
  block disables them.
- Buttons `min-height: 44px`; icon buttons `44×44`.
- Visible `:focus-visible` ring on every interactive element.
- Status is always **label + colour**, never colour alone.
- Small controls may *look* compact but their hit area must clear 44px.

### Gotcha: `theme.vars`, not `theme.palette`, inside `sx`

With `cssVariables` enabled, `theme.palette.*` inside an `sx` callback returns the
**light scheme's literal values**, not a CSS variable. Using it inside
`theme.applyStyles('dark', ...)` bakes light colours into the dark rule — this
painted the header bar pure white in dark mode with near-white text (1.1:1).

```jsx
// WRONG — resolves to the light scheme's #FFFFFF
...theme.applyStyles('dark', { backgroundColor: theme.palette.background.paper })
// RIGHT — emits var(--mui-palette-background-paper)
...theme.applyStyles('dark', { backgroundColor: theme.vars.palette.background.paper })
```

Literal hex inside `applyStyles` is fine and sometimes correct (the document
viewer deliberately uses its own neutrals, since the .docx sheet is always white).

### Two more traps this codebase already hit

- **Inline `sx` beats `styleOverrides`.** The audit table kept `color:
  'text.secondary'` inline, so the theme's contrast-corrected table-head tone
  never applied. Prefer removing the inline colour over re-specifying it.
- **Text on a tint of its own colour.** A 12% tint lifts the background enough to
  drop an otherwise-passing colour under 4.5:1. `success`/`warning` were darkened
  so they clear AA on white *and* on their own tint; chips that only needed a
  muted tone dropped the fill instead.

### Verified

Checked in Chromium at 375 / 768 / 1024 / 1440px, in both schemes, across the
Dashboard, New Case, and all seven Case Workspace tabs (API mocked):
no horizontal overflow, no sub-44px hit areas, no unnamed controls, no
unlabelled inputs, and no contrast failures.

One reported item was deliberately **not** changed: the disabled "Lookup" button
sits at 1.85:1 (light) / 2.51:1 (dark). WCAG 1.4.3 explicitly exempts inactive
controls, and these are MUI's default disabled tokens — overriding them has a
wide blast radius for no conformance gain.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1E3A8A` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#1E40AF` | `--color-secondary` |
| Accent/CTA | `#B45309` | `--color-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Muted | `#E9EEF5` | `--color-muted` |
| Border | `#CBD5E1` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#1E3A8A` | `--color-ring` |

**Color Notes:** Authority navy + trust gold

### Typography

- **Heading Font:** EB Garamond
- **Body Font:** Lato
- **Mood:** legal, professional, traditional, trustworthy, formal, authoritative
- **Google Fonts:** [EB Garamond + Lato](https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap');
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #B45309;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #1E3A8A;
  border: 2px solid #1E3A8A;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #1E3A8A;
  outline: none;
  box-shadow: 0 0 0 3px #1E3A8A20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Trust & Authority

**Keywords:** Certificates/badges displayed, expert credentials, case studies with metrics, before/after comparisons, industry recognition, security badges

**Best For:** Healthcare/medical landing pages, financial services, enterprise software, premium/luxury products, legal services

**Key Effects:** Badge hover effects, metric pulse animations, certificate carousel, smooth stat reveal

### Page Pattern

**Pattern Name:** Trust & Authority + Conversion

- **Conversion Strategy:** Security badges. Case studies. Transparent pricing. Low-friction form.
- **CTA Placement:** Contact Sales / Get Quote (primary) + Nav
- **Section Order:** 1. Hero (mission/credibility), 2. Proof (logos, certs, stats), 3. Solution overview, 4. Clear CTA path

---

## Motion

**Scroll Reveal** (Subtle) — Trigger: scroll (viewport enter) | Duration: 300-400ms | Easing: `power1.out`

```js
gsap.from(el, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
```

**Framework notes:** Requires the ScrollTrigger plugin registered once via gsap.registerPlugin(ScrollTrigger)

- ✅ Keep the y offset small (8-16px) so it reads as a fade, not a slide
- ❌ Don't reveal below-the-fold content needed for SEO/crawlers as invisible-by-default without a no-JS fallback
- ⚡ toggleActions 'play none none reverse' avoids re-triggering on every scroll direction change

---

## Anti-Patterns (Do NOT Use)

- ❌ Outdated design
- ❌ Hidden credentials
- ❌ AI purple/pink gradients

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
