# Decisions summary — modern UI migration

This is the short, high-signal summary of what was decided.

## Key decisions

1) **Adopt semantic Tailwind**
- Move to the semantic Tailwind model aligned with `docs/design/modern-source/tailwind.config.js`.
- Stop expanding the app via ad-hoc `bg-[var(--…)]` patches as the primary strategy.

2) **Wire typography in `layout.tsx`**
- Replace Geist/Geist Mono with **Inter** (UI) + **Space Grotesk** (numerals).
- Use `font-num` **only for large numerals** (KPI values, amounts, display-like sizes), not for body text.

3) **MetricCard convergence**
- **Replace `MetricCard` with the ZIP `MetricCard`** and remove the legacy accent bar.
- KPI badges must show **localized Spanish labels** (e.g. `EN CURSO / AVISO / BLOQUEO`), not raw semantic enums.

4) **`--ds-*` becomes a temporary shim**
- Canonical token names are the **unprefixed** names from `modern-source`.
- Keep `--ds-*` only as a temporary alias layer during migration, then delete it.

5) **Fix the two token type mismatches**
- **Borders:** stop using shorthand tokens as colors in `border-[var(--…)]`; move to semantic border utilities.
- **Focus ring:** standardize on ring utilities (`ring-focus`) and retire the split shadow/color approach.

6) **Process discipline**
- No more ad-hoc visual patching outside the migration order.
- Land foundation first (semantic Tailwind + tokens + fonts), then shared components, then screens.
