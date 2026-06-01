# Card/Badge modern adapter (safe, incremental)

Branch: `openclaw/ui-modern-card-badge-adapter`

## Scope
- Inspect modern components from:
  - `docs/design/modern-source/componentes-tsx-src.zip`
  - `docs/design/modern-source/componentes-next.zip`
- Compare with current:
  - `src/components/ui/Card.tsx`
  - `src/components/ui/Badge.tsx`
  - `src/components/ui/cn.ts`
- Apply **safe adapter** changes only if compatible and low/no visual impact.

## Files inspected (inside ZIPs)
From `componentes-tsx-src.zip`:
- `src/components/Card.tsx`
- `src/components/Badge.tsx`
- `src/cn.ts`
- `src/types.ts`
- `src/index.ts`

From `componentes-next.zip`:
- `components-next/src/components/Card.jsx`
- `components-next/src/components/Badge.jsx`
- `components-next/src/cn.js`
- `components-next/src/index.js`

## Comparison summary

### cn
- **Modern:** minimal `cn(...classes)` that filters falsy strings.
- **Current app:** more capable `cn` that supports arrays and `{class: boolean}` objects.

Decision:
- Keep current `cn` (it is a superset and helps compatibility).

### Card
- **Modern Card API**: `variant` (`surface|raised|active|dashed`), `padding` (`sm|md|lg`), `as`.
- **Current Card API**: `shadow` (`none|sm`), fixed padding `p-5`, fixed `div`, `rounded-2xl`, and uses CSS vars via Tailwind arbitrary values.

Adapter decision:
- Keep current default visuals (rounded, padding, border model, shadow default).
- Add **optional** props compatible with modern (`variant`, `padding`, `as`) *without breaking existing uses*.
- Use the new token layer (`--ds-*`) **as primary variables** with fallbacks to existing tokens so runtime remains stable.

### Badge
- **Modern Badge API**: `status` semantic + optional `dot`, `pill`, and typography `text-overline uppercase`.
- **Current Badge API**: `tone` (`neutral|success|warning|danger|info`) and a simpler text style.

Adapter decision:
- Keep current typography/shape by default to avoid a visual reset.
- Add optional `status` alias and `dot`/`pill` hooks (default keeps existing look).
- Use `--ds-*` variables with fallbacks.

## Token strategy (important)
- We **do not** switch to modern Tailwind semantic classes (e.g. `bg-bg-surface`) because the app is Tailwind v4 with `@theme inline` and existing patterns.
- We **do** use `var(--ds-*, var(--old-*)))` to avoid hard dependency on the modern layer.

## What we changed in code (if applied)
- `Card.tsx`:
  - Added `variant/padding/as` (optional)
  - Switched internal CSS vars to prefer `--ds-*` with fallback
  - Kept `shadow` prop and default visuals
- `Badge.tsx`:
  - Added `status` alias + optional `dot/pill`
  - Switched internal CSS vars to prefer `--ds-*` with fallback
  - Kept default typography and rounded-full

## What we explicitly did NOT do
- No copying of ZIP components.
- No changes to `MetricCard`.
- No Tailwind config changes.
- No layout/screen changes.
- No `globals.css` changes in this phase.
