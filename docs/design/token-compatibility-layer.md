# Token compatibility layer (design system ZIP)

> Branch: `openclaw/ui-token-compatibility-layer`
>
> Purpose: add a **minimal, additive** set of token aliases so the external
> component ZIP can be integrated later with less risk.
>
> This branch intentionally:
> - does **not** copy ZIP components
> - does **not** modify production UI/screens
> - does **not** change runtime behavior (only adds unused CSS variables)

## What changed

### `src/app/globals.css`

Added CSS variable aliases (no renames/removals):

- Semantic color aliases:
  - `--primary` → `--primary-500`
  - `--success` → `--success-500`
  - `--warning` → `--warning-500`
  - `--danger` → `--danger-500`

- Semantic families (ZIP vocabulary):
  - `--bg` → `--bg-base`
  - `--content` → `--text-primary`

- Effects:
  - `--ring-focus` → `--focus-ring`
  - `--shadow-fab` → `0 16px 32px rgba(0,0,0,.35)` (placeholder)

- `guild` placeholder:
  - `--guild` → `--primary-500` (to be revisited once ZIP classes are validated)

- Radius scale:
  - `--radius-sm/md/lg/xl`

- Numeric font alias:
  - `@theme inline --font-num` → `var(--font-geist-mono)` (placeholder)

## Why this is safe

- No existing token is removed or renamed.
- No component was modified to use the new aliases.
- If the ZIP uses different token names or expects Tailwind theme keys instead of
  CSS variables, we will adjust during the component-by-component integration.

## Pending validation

When the ZIP is available in the repo/runtime again, we should validate:
- exact `className` usage (Tailwind theme keys vs CSS vars)
- exact token names (e.g. `ring-focus` meaning class vs CSS var)
- whether `guild` is a color family with multiple shades
- whether `shadow-fab` is a named shadow in Tailwind config
- whether `font-num` needs a real font file/stack
