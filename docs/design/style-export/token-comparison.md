# Token comparison (current app vs modern system)

## Sources

- Current: `src/app/globals.css`
- Modern: `docs/design/modern-source/tokens.css`

## Current app `:root` tokens (names)

```txt
--background
--bg
--bg-base
--bg-overlay
--bg-surface
--bg-surface-raised
--border-default
--border-strong
--border-subtle
--content
--danger
--danger-100
--danger-500
--danger-900
--ds-bg-base
--ds-bg-overlay
--ds-bg-surface
--ds-bg-surface-raised
--ds-border-dashed
--ds-border-default
--ds-border-strong
--ds-border-subtle
--ds-content-disabled
--ds-content-primary
--ds-content-secondary
--ds-content-tertiary
--ds-danger-100
--ds-danger-500
--ds-danger-900
--ds-focus-ring-shadow
--ds-guild-chip-bg
--ds-guild-chip-border
--ds-guild-chip-text
--ds-primary-100
--ds-primary-300
--ds-primary-500
--ds-primary-900
--ds-shadow-fab
--ds-shadow-sheet
--ds-success-100
--ds-success-500
--ds-success-900
--ds-warning-100
--ds-warning-500
--ds-warning-900
--focus-ring
--foreground
--guild
--primary
--primary-100
--primary-300
--primary-500
--primary-900
--radius-lg
--radius-md
--radius-sm
--radius-xl
--ring-focus
--shadow-fab
--success
--success-100
--success-500
--success-900
--text-disabled
--text-primary
--text-secondary
--text-tertiary
--warning
--warning-100
--warning-500
--warning-900
```
## Modern system `:root` tokens (names)

```txt
--bg-base
--bg-overlay
--bg-surface
--bg-surface-raised
--border-dashed
--border-default
--border-strong
--border-subtle
--danger-100
--danger-500
--danger-700
--danger-900
--focus-ring
--font-num
--font-ui
--fs-body
--fs-caption
--fs-display
--fs-h1
--fs-h2
--fs-h3
--fs-label
--fs-overline
--fw-bold
--fw-medium
--fw-regular
--fw-semibold
--guild-chip-bg
--guild-chip-border
--guild-chip-text
--primary-100
--primary-300
--primary-50
--primary-500
--primary-600
--primary-700
--primary-900
--radius-full
--radius-lg
--radius-md
--radius-sm
--radius-xl
--shadow-fab
--shadow-sheet
--space-1
--space-2
--space-3
--space-4
--space-5
--space-6
--space-8
--success-100
--success-300
--success-500
--success-700
--success-900
--text-disabled
--text-primary
--text-secondary
--text-tertiary
--warning-100
--warning-500
--warning-700
--warning-900
```
## Tokens used by current UI code (heuristic: `--*` mentions in ui + selected screens)

```txt
--bg-base
--bg-surface
--bg-surface-raised
--border-default
--border-strong
--border-subtle
--danger-100
--danger-500
--danger-900
--ds-bg-surface
--ds-bg-surface-raised
--ds-content-primary
--ds-content-secondary
--ds-content-tertiary
--ds-danger-100
--ds-danger-500
--ds-danger-900
--ds-primary-100
--ds-primary-300
--ds-primary-500
--ds-primary-900
--ds-success-100
--ds-success-500
--ds-success-900
--ds-warning-100
--ds-warning-500
--ds-warning-900
--focus-ring
--font-geist-mono
--font-geist-sans
--primary-100
--primary-300
--primary-500
--primary-900
--success-100
--success-500
--success-900
--text-primary
--text-secondary
--text-tertiary
--warning-100
--warning-500
--warning-900
```
## Known conflicts / type mismatches (high impact)

- **Borders:** modern uses shorthands like `1px solid rgba(...)`; current UI expects `--border-*` as **colors** (so it can do `border-[var(--border-subtle)]`).
- **Focus ring:** modern uses `--focus-ring` as a **box-shadow** ring; current app uses `--focus-ring` as a **color** and introduces `--ds-focus-ring-shadow` for the shadow form.

## Presence / mapping checks

- `--bg-base` in current globals: `True`; in modern tokens: `True`
- `--bg-surface` in current globals: `True`; in modern tokens: `True`
- `--bg-surface-raised` in current globals: `True`; in modern tokens: `True`
- `--text-primary` in current globals: `True`; in modern tokens: `True`
- `--primary-500` in current globals: `True`; in modern tokens: `True`
- `--success-500` in current globals: `True`; in modern tokens: `True`
- `--warning-500` in current globals: `True`; in modern tokens: `True`
- `--danger-500` in current globals: `True`; in modern tokens: `True`

## DS alias layer summary (current globals)

```txt
--ds-bg-base
--ds-bg-overlay
--ds-bg-surface
--ds-bg-surface-raised
--ds-border-dashed
--ds-border-default
--ds-border-strong
--ds-border-subtle
--ds-content-disabled
--ds-content-primary
--ds-content-secondary
--ds-content-tertiary
--ds-danger-100
--ds-danger-500
--ds-danger-900
--ds-focus-ring-shadow
--ds-guild-chip-bg
--ds-guild-chip-border
--ds-guild-chip-text
--ds-primary-100
--ds-primary-300
--ds-primary-500
--ds-primary-900
--ds-shadow-fab
--ds-shadow-sheet
--ds-success-100
--ds-success-500
--ds-success-900
--ds-warning-100
--ds-warning-500
--ds-warning-900
```
