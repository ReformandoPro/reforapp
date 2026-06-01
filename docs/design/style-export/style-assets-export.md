# Style assets export (for external review)

Branch: `openclaw/ui-style-assets-export`

## What this is

A documentation-only export/inventory of **all style/design/component artifacts** currently available in the repo, to enable an external visual specification review.

## What this is NOT

- No UI changes
- No runtime/token behavior changes
- No Supabase/data changes
- No deploy changes

## Entry points

- Modern artifacts index: `docs/design/modern-source/` (source of truth provided by design)
- Export index: `docs/design/style-export/README.md`
- Modern components inventory: `docs/design/style-export/modern-components-inventory.md`
- App components inventory: `docs/design/style-export/app-components-inventory.md`
- Screens inventory: `docs/design/style-export/screens-style-inventory.md`
- Token comparison: `docs/design/style-export/token-comparison.md`
- Dashboard audit (branch-based): `docs/design/style-export/current-dashboard-style-audit.md`

## Why recent iterations still may not match the modern spec

- The app uses Tailwind v4 + CSS variables with arbitrary values, while the modern system is authored for a semantic Tailwind config (different integration model).
- Some token **type mismatches** (border shorthand vs color, focus ring shadow vs color) prevent direct drop-in.
- Some base component geometry differs (e.g., Card rounding: current `rounded-2xl` vs modern `radius/lg` ~16px).
- Typography integration (Inter + Space Grotesk) is not fully wired (layout/fonts).

## Pending human decisions

- Adopt modern Tailwind semantic class model (requires config strategy) vs keep current arbitrary-var model.
- How/when to introduce Inter + Space Grotesk in `layout.tsx` (font loading + fallbacks).
- Whether to converge existing components to modern geometry (radius/padding/overline) globally vs screen-by-screen.
- Exact KPI/MetricCard visual language (accent bar vs active card vs group scrolling).

## Recommendation: what NOT to do next

- Avoid more ad-hoc per-screen patches without closing the integration strategy and typography decisions.
- Avoid copying ZIP components blindly (will clash with current Tailwind model).
- Avoid introducing new tokens with conflicting types under existing names.
