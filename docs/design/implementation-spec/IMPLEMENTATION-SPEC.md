# IMPLEMENTATION SPEC — Reformando.app

**Purpose:** This is the counterpart to the review package. The review package
*described* the current state and listed open questions. This document *answers*
those questions and tells the dev team exactly how to converge the current app
onto the modern design system, in order, with the conflicts resolved.

> **Source of truth:** `docs/design/modern-source/` (tokens.css, tokens.json,
> tailwind.config.js, galeria-pantallas.html, the component ZIPs).
> Where this spec and the source of truth ever disagree, the source of truth wins.

---

## 0. TL;DR for whoever has 60 seconds

The good news: your token **values** already match the design system (the palette
was copied correctly). The work that remains is **not** "repaint everything" — it's
four concrete things:

1. **Resolve two token *type* mismatches** (borders, focus ring) that currently
   block a clean drop-in.
2. **Pick ONE integration model** — semantic Tailwind config (recommended) — and
   stop mixing it with arbitrary `[var(--…)]` values.
3. **Wire the fonts** (Inter + Space Grotesk) in `layout.tsx`. Until this is done,
   the "display / numeric" typography intent is not actually rendering.
4. **Converge component geometry** (card radius, etc.) to the system values.

Everything else is mechanical follow-through once those four are decided.

The decisions in §2 are the ones the review package flagged as "pending human
decision." They are now made, with rationale, so implementation can start.

---

## 1. How the two sides line up today

| Layer | Source of truth (my design) | Current app | Status |
|---|---|---|---|
| Color values | `tokens.css` / `tailwind.config.js` | copied into `globals.css` | ✅ match |
| Color **token names** | `--primary-500`, `--bg-surface`, … | same **plus** a parallel `--ds-*` set | ⚠️ duplicated |
| Borders | `--border-subtle: 1px solid rgba(…)` (shorthand) | used as a **color** in `border-[var(--border-subtle)]` | ❌ type mismatch |
| Focus ring | `--focus-ring: 0 0 0 3px rgba(…)` (box-shadow) | used as a **color**; shadow lives in `--ds-focus-ring-shadow` | ❌ type mismatch |
| Card radius | `radius/lg` = **16px** | `rounded-2xl` (16px in TW default, but hard-coded) | ⚠️ drift / not tokenized |
| Typography | Inter (UI) + Space Grotesk (numbers), full scale | Geist / Geist Mono, scale not wired | ❌ not implemented |
| Integration model | semantic Tailwind (`bg-surface`, `text-content-primary`) | Tailwind v4 + arbitrary `[var(--…)]` values | ⚠️ two models in parallel |
| Components | 14 in ZIPs (TSX + Next/JSX) | 10 adapters in `src/components/ui/` | partial overlap |

The single most important takeaway: **the divergence is structural (names/types/wiring),
not chromatic.** Nobody needs to re-pick colors.

---

## 2. Decisions (these were the open questions — now resolved)

### Decision 1 — Integration model: **adopt the semantic Tailwind config**

**Resolved:** Move to the modern semantic model (`bg-surface`, `text-content-primary`,
`rounded-lg`, `text-overline`, …) and retire ad-hoc `bg-[var(--…)]` arbitrary values
over time.

**Why:** The component ZIPs are already authored against this model (e.g. `Card`
uses `rounded-lg`, `MetricCard` uses `text-overline` and `font-num`). Keeping the
arbitrary-var model means every imported component has to be rewritten to match the
app, which defeats the point of adopting the design. Adopting the config makes the
ZIP components drop in as-is.

**Migration path (non-breaking):** see §3. The config can be introduced alongside
the existing variables; the two coexist during migration, screen by screen. No
big-bang rewrite.

### Decision 2 — Typography: **wire Inter + Space Grotesk in `layout.tsx`**

**Resolved:** Replace Geist/Geist Mono with Inter (UI) and Space Grotesk (numbers
only), loaded via `next/font/google`, exposed as CSS variables, and consumed by the
Tailwind `fontFamily` config.

**Rule from the system:** Space Grotesk (`font-num`) is for **large numerals only**
(KPI values, amounts, the `display` size). Everything else is Inter. Do not set
Space Grotesk as a body font.

**Exact steps:** see §4. This is the highest-visual-impact change and the cheapest
to land — until it's done, "display/num" intent is invisible.

### Decision 3 — Component convergence: **replace, adapt, keep**

**Resolved**, per component, in §6. Short version: replace `MetricCard` with the
ZIP version (drop the accent-bar variant), keep `Card`/`Button`/`Badge` but fix
geometry + the `--ds-*` aliasing, and confirm `ListItem` against the modern
`ListItem` + `ListGroup` pattern (separators/densities).

### Decision 4 — KPI / dashboard language: **localized labels, semantic badges, no accent bar**

**Resolved:**
- KPI cards use `Card` + an **overline label** + a **large numeric value** (`font-num`).
- The status pill on a KPI uses a **localized Spanish label** (e.g. `EN CURSO`,
  `AVISO`, `BLOQUEO`), **not** the raw semantic key (`info` / `warning` / `danger`).
  The current dashboard renders `{kpi.tone}` as the badge text — that ships the
  internal enum to users and must be mapped to copy.
- The legacy `MetricCard` accent-bar visual is **dropped** (it isn't in the spec).

---

## 3. Token convergence — the precise fixes

This is the heart of the bundle. Hand `TOKEN-MIGRATION.md` to whoever owns
`globals.css`; the summary is here.

### 3.1 Kill the duplicate `--ds-*` layer

The app currently defines both `--primary-500` **and** `--ds-primary-500` (and the
same doubling for bg, content, danger, success, warning, borders, shadows). The
component code then reaches for whichever it remembers, which is why the dashboard
audit shows *both* `--ds-bg-base` and `--bg-base` referenced in the same file.

**Fix:** Pick the **unprefixed** names (they're the ones in the source of truth) as
canonical. Keep the `--ds-*` names *only* as temporary aliases pointing at the
canonical ones, so nothing breaks mid-migration:

```css
/* globals.css — temporary compatibility shim, delete once code is migrated */
--ds-bg-base:            var(--bg-base);
--ds-bg-surface:         var(--bg-surface);
--ds-bg-surface-raised:  var(--bg-surface-raised);
--ds-content-primary:    var(--text-primary);
--ds-content-secondary:  var(--text-secondary);
--ds-content-tertiary:   var(--text-tertiary);
--ds-content-disabled:   var(--text-disabled);
/* …same one-line aliasing for primary/success/warning/danger/border/shadow… */
```

Then migrate code from `--ds-x` → `--x` (or better, to semantic Tailwind classes),
and delete the shim. **Net token-name target = the source-of-truth set, period.**

### 3.2 Fix the border type mismatch

- **Design intent:** `--border-subtle` etc. are **full shorthands**
  (`1px solid rgba(255,255,255,0.06)`), meant to be used as `border: var(--border-subtle)`.
- **App usage today:** `border-[var(--border-subtle)]` — Tailwind expects a **color**
  there, so the shorthand is invalid in that position.

**Fix (aligns with the chosen semantic model):** stop passing borders as a color in
arbitrary values. Use the Tailwind `borderColor` keys the config already defines
(`subtle`, `DEFAULT`, `strong`) → `border border-subtle`, `border`, `border-strong`.
The raw color values live in `tailwind.config.js > theme.extend.borderColor` (already
present). If a non-Tailwind context truly needs the shorthand, expose a *separate*
`--border-subtle-shorthand` token rather than overloading the name.

### 3.3 Fix the focus-ring type mismatch

- **Design intent:** `--focus-ring` is a **box-shadow** (`0 0 0 3px rgba(45,127,249,0.45)`).
- **App usage today:** `--focus-ring` treated as a **color**, with the shadow split
  into `--ds-focus-ring-shadow`.

**Fix:** Standardize on the config's `ring` utilities. The config defines
`ringColor.focus` and `boxShadow.focus`. Use `focus-visible:ring-2
focus-visible:ring-focus` (already the pattern in `projects/page.tsx` and
`budgets/page.tsx`). Retire `--ds-focus-ring-shadow`; keep one focus treatment.

### 3.4 Add the tokens the app is missing

The current `:root` is missing several source-of-truth tokens. Add them so the
system is whole (and so the ZIP components find what they expect):

- **Spacing scale:** `--space-1…8` (4→32px) — currently absent.
- **Radius:** `--radius-full` (`9999px`) — absent (only sm/md/lg/xl exist).
- **Primary ramp:** `--primary-50`, `--primary-600`, `--primary-700` — absent.
- **Mid steps:** `--success-300`, `--success-700`, `--danger-700`, `--warning-700` — absent.
- **Border:** `--border-dashed` — absent.
- **Shadow:** `--shadow-sheet` — absent.
- **Typography tokens:** `--font-ui`, `--font-num`, the `--fs-*` / `--lh-*` scale,
  `--fw-*` weights — absent (this is the typography gap from Decision 2).

`TOKEN-MIGRATION.md` lists every one with its exact value, ready to paste.

---

## 4. Typography wiring — exact `layout.tsx` change

Replace the Geist setup with:

```tsx
// app/layout.tsx
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Then point the Tailwind families at those variables (matches `modern-source`):

```js
// tailwind.config.js
fontFamily: {
  sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
  num:  ["var(--font-space-grotesk)", "var(--font-inter)", "system-ui", "sans-serif"],
},
```

Usage rules:
- Body / UI: default (`font-sans`). Don't annotate every element.
- Large numerals only: `font-num` (KPI values, amounts, `text-display`).
- The `dark` class belongs on `<html>` (the system is dark-base). Conmutable
  light/dark, if ever wanted, toggles exactly here.

---

## 5. Integration model — coexistence during migration

You don't have to convert all screens at once. Recommended order:

1. Land the **config** (`tailwind.config.js` semantic theme) + the **`--ds-*` shim**
   (§3.1) + the **fonts** (§4). After this commit, nothing should look worse and the
   ZIP components become safe to import.
2. Migrate **shared `ui/` components** first (Card, Button, Badge, MetricCard,
   ListItem, ProgressBar, EmptyState) to semantic classes + correct geometry.
   Every screen benefits at once.
3. Migrate **screens** one at a time, converting `bg-[var(--…)]` → semantic classes.
   Start with `ReformistDashboardScreen.tsx` (most modernized already), then
   `projects`, `budgets`, then the `slate-*`/`rose-*` raw-Tailwind screens
   (`tasks/page.tsx`, `ProjectTasksClient.tsx`) which are currently **off-system**
   entirely (they use `text-slate-900`, `text-rose-600`, etc. — these must move to
   `content`/`danger` tokens).
4. Delete the `--ds-*` shim and any remaining arbitrary-var usages.

`MIGRATION-CHECKLIST.md` turns this into tickable items.

---

## 6. Component convergence table

| Component | Action | Notes |
|---|---|---|
| `Card` | **Adapt** | Fix radius to `rounded-lg` (16px) — currently hard-coded `rounded-2xl`. Drop `--ds-*` refs. |
| `Button` | **Keep + fix** | Already close. Move focus to `ring-focus`; ensure `confirm` variant = green (money/confirm), `primary` = blue. |
| `Badge` | **Keep + fix** | Remove `--ds-*` duplication. Confirm `status` set is exactly info/success/warning/danger (+neutral). Map enum → localized label at call sites, not inside Badge. |
| `MetricCard` | **Replace** | Adopt ZIP `MetricCard` + `MetricCardGroup`; drop the legacy accent-bar variant (`before:h-2`). Uses `font-num` + `text-overline`. |
| `ListItem` | **Confirm/align** | Match modern `ListItem` + `ListGroup` (dividers `divide-white/[0.06]`, density `px-4 py-3.5`, radius `rounded-[14px]`). |
| `ProgressBar` | **Keep + enforce rule** | Default `tone="primary"` (blue). Amber **only** for a real warning, green **only** for done/validated — never for ordinary progress. |
| `EmptyState` | **Keep + fix** | Move dashed border to `border-dashed` token; radius to `rounded-lg`. |
| `ErrorState` / `LoadingState` | **Keep** | Already danger/primary tokens; just retoken radius + borders. |
| `Avatar`, `Donut`, `GuildChip`, `SegmentedControl`, `TabBar`, `Timeline`, `Checkbox`, `Input` | **Add from ZIP** | Not yet in `ui/`. Import as-is once the config + fonts land. |

**Two system rules the code must keep enforcing:**
- **Guilds have no color.** `GuildChip` is the neutral chip and must not accept a
  color prop. (This is what de-reds "Calefacción".)
- **Green = money / validation only.** Never progress, never selection (those are blue).

---

## 7. What this bundle deliberately does NOT change

Same guardrails as the review package — so the team knows the scope:
- No runtime data / Supabase changes.
- No new tokens introduced under existing names with conflicting **types** (the whole
  point of §3 is to *remove* that situation, not add to it).
- No blind copying of ZIP components **before** the config + fonts land (step 1 first).
- No per-screen ad-hoc patching as a substitute for the migration order in §5.

---

## 8. File map of this bundle

- `IMPLEMENTATION-SPEC.md` — this document (the decisions + rationale).
- `TOKEN-MIGRATION.md` — every token to add/alias/rename, with exact values, ready to paste.
- `MIGRATION-CHECKLIST.md` — ordered, tickable tasks mirroring §3–§6.
- `decisions.json` — the four decisions in machine-readable form (for tracking/automation).
