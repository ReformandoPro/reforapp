# Modern design system intake (real sources)

> Branch: `openclaw/ui-modern-design-system-intake`
>
> Scope: **intake only** (no UI changes, no token changes, no component copy, no reverts).
>
> Sources live in: `docs/design/modern-source/`

## 1) Sources reviewed

Read (reference docs):
- `docs/design/modern-source/SISTEMA-DE-DISENO.md`
- `docs/design/modern-source/README.md`
- `docs/design/modern-source/tokens.css`
- `docs/design/modern-source/tokens.json`
- `docs/design/modern-source/tailwind.config.js`
- `docs/design/modern-source/galeria-pantallas.html`

ZIP inventories (listed via Python `zipfile` because `unzip` is not installed in this runtime):
- `docs/design/modern-source/componentes-next.zip`
- `docs/design/modern-source/componentes-tsx-src.zip`

## 2) Visual source of truth

**Primary source of truth:** `SISTEMA-DE-DISENO.md` + `tokens.css`/`tokens.json`.

The system is explicitly a **dark-mode base** (Tailwind `darkMode: "class"` and docs state “Tema base: dark mode”).

The gallery (`galeria-pantallas.html`) is a demo/visual validation artifact that uses the same token values.

## 3) Token model (what the modern system expects)

### 3.1 Dark surfaces
Tokens (CSS vars):
- `--bg-base`, `--bg-surface`, `--bg-surface-raised`, `--bg-overlay`

### 3.2 Text
- `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-disabled`

### 3.3 Semantic colors (minimal set)
The system enforces a strict semantic set:
- `primary` (info + action)
- `success` (money + confirmation)
- `warning` (pending)
- `danger` (error/destructive only)

### 3.4 Guild tokens (neutral, not a color family)
The modern system does **not** want a “guild color palette”. Guilds are neutralized:
- `--guild-chip-bg`
- `--guild-chip-text`
- `--guild-chip-border`

### 3.5 Borders are *shorthands* in the modern tokens
In `tokens.css`, borders are defined as *shorthand strings*:
- `--border-subtle: 1px solid rgba(...)`

This differs from the current app approach where `--border-subtle` is a **color** token (so we can write `border-[var(--border-subtle)]`).

This is a key compatibility mismatch to resolve later.

### 3.6 Elevation & focus ring
Modern tokens define:
- `--shadow-fab: 0 8px 24px rgba(45,127,249,0.35)`
- `--focus-ring: 0 0 0 3px rgba(45,127,249,0.45)`

Our app currently stores `--focus-ring` as a **color**, not a full ring box-shadow.

### 3.7 Typography
Modern system expects:
- UI font: Inter
- Numeric font: Space Grotesk

In `componentes-next.zip`, `fonts.js` uses `next/font` (Inter + Space Grotesk) and Tailwind config declares `fontFamily.sans` and `fontFamily.num`.

## 4) Tailwind usage model (modern system)

The provided `tailwind.config.js` replaces the Tailwind palette with semantic tokens like:
- `bg-surface`, `bg-raised`
- `text-content-primary`
- `bg-primary-500`, `text-success-300`, etc.
- `shadow-fab`, `shadow-focus`
- `ring-focus`

This is a different approach from the current app:
- Current app uses Tailwind v4 + CSS variables with arbitrary values, e.g. `bg-[var(--bg-surface)]`.
- There is no `tailwind.config.js` in the current app repo (Tailwind v4 is driven by `@import "tailwindcss";` + `@theme inline`).

## 5) Component libraries available (from ZIP inventories)

### 5.1 `componentes-next.zip` (JSX, Next App Router)
Contains:
- `components-next/src/components/*`:
  - `Card`, `Badge`, `Button`, `Input`, `Checkbox`, `ProgressBar`, `ListItem`, `Donut`, `SegmentedControl`, `TabBar`, `Timeline`, `MetricCard`, `Avatar`, `GuildChip`
- `components-next/src/cn.js`, `src/index.js`, `src/fonts.js`
- Example `app/` with `layout.jsx` + `globals.css` + `ejemplo-lista/`

Notable note (README): interactive components include `"use client"` per-file; pure visuals remain Server Components.

### 5.2 `componentes-tsx-src.zip` (TSX source)
Contains a similar set plus `EmptyState.tsx`:
- `src/components/*`:
  - `Card`, `Badge`, `Button`, `Input`, `Checkbox`, `ProgressBar`, `ListItem`, `Donut`, `SegmentedControl`, `TabBar`, `Timeline`, `MetricCard`, `Avatar`, `GuildChip`, `EmptyState`
- `src/cn.ts`, `src/fonts.ts`, `src/types.ts`, `src/index.ts`

## 6) Differences vs current app UI

### 6.1 Token parity (good news)
Current app `src/app/globals.css` already matches most *color* values from the modern tokens for:
- bg surfaces
- text
- primary/success/warning/danger scales (at least 100/500/900 and some mid shades)

### 6.2 Token type mismatch (important)
Modern tokens treat:
- `border/*` as **shorthand** values
- `focus-ring` as **box-shadow ring**

Current app uses:
- `border-*` as **colors**
- `--focus-ring` as **color**

So direct copy of `tokens.css` into `src/app/globals.css` would break many existing classes.

### 6.3 Tailwind config mismatch
Modern system expects a full Tailwind config defining semantic `colors`, `shadow`, `ringColor`, etc.

Current app is Tailwind v4 without a Tailwind config file, and styles are written using CSS vars + arbitrary values.

## 7) Differences vs recent MetricCard changes

Current app `MetricCard` (recent work) uses:
- Card container + a top accent `before:h-2`
- accent color driven by `tone`

Modern system guidance for KPI cards in the doc:
- KPI card is mostly about: surface level + label (overline/caption) + value typography.
- It mentions an “active” KPI card could use a primary-filled background, but **only one active per group**.

Assessment:
- The new accent bar is not mentioned explicitly in the modern doc. It is not necessarily wrong, but it may be redundant once we adopt the modern components.
- The tone semantics we applied (`warning` for delayed, `danger` for blocked) align with the doc’s semantic color rules (good).

Recommendation (for later decision phase):
- **Keep** the semantic tone mapping in the dashboard (it is useful and consistent).
- Re-evaluate whether the accent bar remains once we integrate the modern `MetricCard` component or its exact visual language.

## 8) What to keep / adjust / revert (recommendation)

### Keep
- Dashboard metrics tone mapping (semantic meaning): delayed→warning, blocked→danger, etc.
- The idea of a compatibility layer, but we must align it with the modern token *types*.

### Adjust (likely)
- `--shadow-fab` placeholder in our current `globals.css` should match modern: `0 8px 24px rgba(45,127,249,0.35)`.
- `--guild` placeholder should not exist as a “guild color family”. The modern system uses `guild-chip-*` neutrals.
- `--focus-ring` should be treated as ring style (box-shadow) if we adopt the modern model; currently we treat it as a color.

### Revert (not now; only if we decide)
- If we adopt the modern `MetricCard`, we may revert the accent bar customization to converge.

## 9) Proposed incremental plan (small branches)

1) **Doc-only + alignment plan (this branch)**
   - Done by this intake.

2) **Token alignment branch (careful, minimal risk)**
   - Introduce `--guild-chip-*` tokens (if missing) without removing existing tokens.
   - Align `--shadow-fab` value to modern.
   - Decide how to represent borders: keep current color tokens for existing UI; add new vars for shorthand borders if needed (`--border-subtle-css`, etc.).

3) **Component-by-component adoption**
   - Start with non-interactive components: `Card`, `Badge`, `GuildChip`, `ProgressBar`.
   - Keep Server/Client boundaries as in the ZIP.

4) **MetricCard convergence decision**
   - Compare the ZIP `MetricCard` to our current one and decide whether to:
     - replace,
     - wrap,
     - or keep current with minor edits.

## 10) Notes / blockers

- This runtime does not have `unzip`, so ZIP listings were produced via Python’s `zipfile` module.
- We should avoid merging `tailwind.config.js` from the modern system directly until we decide whether to adopt that Tailwind model; our current app is Tailwind v4 with `@theme inline`.
