# Component library intake — `componentes-tsx-src.zip` (compatibility)

> **Branch:** `openclaw/ui-design-system-intake`
>
> **Goal:** technical compatibility intake only. No component copying, no token changes, no UI changes.
>
> **Important:** the ZIP file itself is not present in this repo checkout, so this intake is based on the provided inventory + Hermes notes about token dependencies. If we need to verify exact classnames/imports from the ZIP, the file must be re-uploaded / re-mounted.

## 1) ZIP inventory (provided)

Files/components reportedly included in `componentes-tsx-src.zip`:

- `Avatar.tsx`
- `Badge.tsx`
- `Button.tsx`
- `Card.tsx`
- `Checkbox.tsx`
- `Donut.tsx`
- `EmptyState.tsx`
- `GuildChip.tsx`
- `Input.tsx`
- `ListItem.tsx`
- `MetricCard.tsx`
- `ProgressBar.tsx`
- `SegmentedControl.tsx`
- `TabBar.tsx`
- `Timeline.tsx`
- `cn.ts`
- `fonts.ts`
- `types.ts`
- `index.ts`
- `README.md`

Hermes recommended first adoption targets (once compatible):
1) `Card`
2) `Badge`
3) `Button`

## 2) Equivalent / overlapping components in the current app

Current app UI primitives already exist in `src/components/ui/`:

- `Card.tsx` (token-based via CSS vars)
- `Badge.tsx` (tone-based, token-based)
- `Button.tsx` (variants, token-based)
- `EmptyState.tsx`, `ErrorState.tsx`, `LoadingState.tsx`
- **Already adopted from the design direction:**
  - `MetricCard.tsx`
  - `ListItem.tsx`
  - `ProgressBar.tsx`

Implication:
- The ZIP versions of `Card/Badge/Button` would likely **conflict** with the existing ones by name.
- We should not copy them directly into `src/components/ui/` without a plan (naming, diff strategy, and token alignment).

## 3) Tokens the ZIP components are expected to require (per Hermes/README notes)

The ZIP README is reported to depend on Tailwind tokens like:

- Colors/semantic tokens: `primary`, `success`, `warning`, `danger`, `guild`, `bg`, `content`
- Radius tokens: `radius` / radios
- Fonts: `font-sans`, `font-num`
- Effects: `shadow-fab`, `ring-focus`

## 4) Tokens already present in the current app

Current runtime tokens live in `src/app/globals.css` as CSS variables and are used via Tailwind arbitrary values, e.g. `bg-[var(--bg-surface)]`.

Present (not exhaustive):

- Background: `--bg-base`, `--bg-surface`, `--bg-surface-raised`, `--bg-overlay`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-disabled`
- Border: `--border-subtle`, `--border-default`, `--border-strong`
- Primary scale: `--primary-100`, `--primary-300`, `--primary-500`, `--primary-900`
- Success: `--success-100`, `--success-500`, `--success-900`
- Warning: `--warning-100`, `--warning-500`, `--warning-900`
- Danger: `--danger-100`, `--danger-500`, `--danger-900`
- Focus: `--focus-ring`

Also:
- Tailwind v4 `@theme inline` defines `--font-sans` mapped to Geist Sans.

## 5) Tokens likely missing (gap analysis vs ZIP requirements)

Based on the reported ZIP requirements, we likely **do not** have these as first-class tokens today:

- `guild` (semantic color family)
- `content` (semantic token family; we currently use `--text-*`)
- `bg` (semantic family; we use `--bg-*`)
- `font-num` (numeric font stack)
- `shadow-fab` (specific shadow token)
- `ring-focus` (focus ring token as named Tailwind utility; we use `--focus-ring`)
- explicit `radius` tokens (we hardcode `rounded-xl/2xl` in classNames)

**Key risk:** if ZIP components rely on Tailwind *named* colors like `bg-primary` / `text-content`, they will not match our current approach (CSS vars + arbitrary values) unless we add a compatibility layer.

## 6) Risks of copying ZIP components directly

- **Naming collisions:** `Card/Button/Badge` already exist.
- **Token mismatch:** ZIP may assume Tailwind theme keys (e.g. `primary`, `content`) and custom utilities (`shadow-fab`, `ring-focus`).
- **Font assumptions:** ZIP may require `font-num` and custom font wiring.
- **Visual drift:** we already adopted `MetricCard/ListItem/ProgressBar` as token-based primitives; overwriting them could regress.
- **Maintenance:** copying a design system wholesale without mapping tokens creates a second styling language.

> This analysis is based on the ZIP file manifest. Final validation of `className`, exact token dependencies, and any micro-adjustments will be done during the implementation of each component.

## 7) Proposed incremental adoption (3 small branches)

### Branch 1 (recommended first): Token compatibility layer only (minimal)
**Goal:** add the smallest set of missing semantic tokens/utilities so ZIP components can compile (still without copying any component).

Scope candidate:
- Introduce CSS vars aliases (document-first) that map our existing vars to the ZIP semantic names.
  - Example: map `bg/content` concepts onto `--bg-*` and `--text-*`.
- Add `--ring-focus` as alias of `--focus-ring` (or vice versa).
- Decide how to represent `shadow-fab` (as a CSS var or Tailwind utility) without changing visuals.

Deliverable:
- A short doc + a minimal token mapping proposal.

### Branch 2: Adopt `Card` + `Badge` (or only one)
**Goal:** introduce ZIP `Card/Badge` under new names (e.g. `DesignCard`, `DesignBadge`) or diff against existing components.

Constraints:
- No broad refactor.
- Swap usage in only one controlled screen (dashboard) if needed.

### Branch 3: Adopt `Button`, then re-evaluate already adopted primitives
**Goal:** bring `Button` in, then decide whether to refactor `MetricCard/ListItem/ProgressBar` to converge.

## 8) First mini-branch recommended (exact scope)

**Recommendation:** start with **Branch 1 (token compatibility mapping only)**, but still keep it tiny:

- Create a doc enumerating the mapping:
  - `primary/success/warning/danger` map to existing `--primary-*`, `--success-*`, etc.
  - `ring-focus` maps to `--focus-ring`
  - define what `bg` and `content` mean in our current token taxonomy
- Optionally add *non-breaking* alias CSS vars in `globals.css` **only if we decide it is safe**, otherwise keep as doc-only.

(We will not do this in the current intake branch.)

## 9) Visual checklist for beta (when we do implement)

When we start adopting ZIP components, validate in beta:

- Dashboard (home) does not regress:
  - Metric cards spacing/tones
  - Alert list readability
  - Progress bar colors and contrast
- `/projects` and `/budgets` cards hover/focus states still readable
- Focus ring visible on keyboard navigation
- Disabled button states remain clear

---

## Appendix A — Current component styling approach

The current app favors:
- CSS variables defined in `src/app/globals.css`
- Tailwind v4 arbitrary values like `bg-[var(--bg-surface)]`

This differs from a design system that expects Tailwind theme keys (`bg-primary`, `text-content`). Any adoption should converge on one approach (recommended: keep CSS var tokens as the source of truth and expose compatibility aliases if needed).
