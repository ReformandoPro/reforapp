# Modern token layer (Tailwind v4 + @theme inline)

Branch: `openclaw/ui-modern-token-layer`

## Goal
Add a **modern design system token layer** to the current app architecture (Tailwind v4 + `@theme inline` + CSS variables in `src/app/globals.css`) **without changing the UI**.

## Sources of truth
- `docs/design/modern-design-system-intake.md`
- `docs/design/modern-source/SISTEMA-DE-DISENO.md`
- `docs/design/modern-source/tokens.css`
- `docs/design/modern-source/tokens.json`
- `docs/design/modern-source/tailwind.config.js`

## What changed
- Added `--ds-*` variables in `src/app/globals.css` that map modern tokens to existing runtime tokens (additive).
- Added `--color-ds-*` hooks in `@theme inline` (additive, not used by any component yet).

## Conflict handling (explicit)
### Borders
Modern system defines borders as **shorthands** like `1px solid rgba(...)`.

The current app uses `--border-*` as **colors** (consumed by classes like `border-[var(--border-subtle)]`).

Decision:
- Keep `--border-*` untouched.
- Add `--ds-border-*` for shorthand borders.

### Focus ring
Modern system defines focus ring as a **box-shadow** token.

The current app uses `--focus-ring` as a **color**.

Decision:
- Keep `--focus-ring` untouched.
- Add `--ds-focus-ring-shadow` for the modern box-shadow ring.

## Acceptance
- No UI/components/layout/screens changed.
- The app should look identical or practically identical.
- This is a preparation layer only (a token dictionary), not a visual migration.
