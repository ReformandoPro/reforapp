# SHARED COMPONENTS — Semantic Tailwind (Phase 2)

## Goal

Migrate shared UI components under `src/components/ui/` to the **semantic Tailwind
model** defined in `tailwind.config.js`, eliminating legacy arbitrary token
classes:

- `bg-[var(--bg-surface)]` (and similar)
- `text-[var(--text-primary)]` (and similar)
- `border-[var(--border-subtle)]` (and similar)
- `focus-visible:outline-[var(--focus-ring)]`
- new usages of `--ds-*`

**Out of scope (Phase 2):** rebuilding screens (dashboard, budgets, projects),
changing routes/data, Supabase integration, or business logic.

## Source of truth

- `docs/design/implementation-spec/IMPLEMENTATION-SPEC.md`
- `docs/design/implementation-spec/TOKEN-MIGRATION.md`
- `docs/design/implementation-spec/MIGRATION-CHECKLIST.md`
- `docs/design/implementation-spec/decisions.json`
- `docs/design/modern-source/SISTEMA-DE-DISENO.md`
- `docs/design/modern-source/componentes-tsx-src.zip`
- `tailwind.config.js`

## Tailwind semantic tokens used

From `tailwind.config.js`:

- Surfaces
  - `bg-bg-base`
  - `bg-bg-surface`
  - `bg-bg-raised`
- Content
  - `text-content-primary`
  - `text-content-secondary`
  - `text-content-tertiary`
- Borders
  - `border-subtle`
  - `border` (default)
  - `border-strong`
- Focus
  - `focus-visible:ring-2 focus-visible:ring-focus`

## Notes / constraints

### MetricCard

`src/components/ui/MetricCard.tsx` was **not replaced** by the ZIP `MetricCard`.
Only obvious legacy token usage was removed while preserving the current API and
structure.

### Screens still contain legacy classes

Pages and screens (e.g. `src/components/screens/ReformistDashboardScreen.tsx`,
`src/app/projects/*`, `src/app/budgets/*`) still contain legacy `bg-[var(--bg-surface)]` (and similar)
/ `text-[var(--text-primary)]` (and similar) / `border-[var(--border-subtle)]` (and similar) by design; those migrations belong
to later phases.
