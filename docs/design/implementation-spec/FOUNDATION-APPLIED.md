# Foundation applied (semantic Tailwind + fonts) — WIP

Branch: `openclaw/ui-foundation-semantic-tailwind`

This branch starts Phase 1 (Foundation) from `docs/design/implementation-spec/MIGRATION-CHECKLIST.md`.

What landed here:
- Added `tailwind.config.js` based on `docs/design/modern-source/tailwind.config.js` (semantic tokens).
- Wired Inter + Space Grotesk in `src/app/layout.tsx` via `next/font/google`, and set `dark` on `<html>`.
- Updated `src/app/globals.css` token values to match `modern-source` and added missing tokens listed in `TOKEN-MIGRATION.md`.

What is intentionally NOT done yet:
- No screen rebuilds.
- No `MetricCard` replacement.
- No tasks/budgets retokening.

Note on border/focus type mismatches:
- The semantic Tailwind config introduces `borderColor` + `ringColor.focus` to enable the target model.
- Code migration away from `border-[var(--border-*)]` and towards `border-subtle` etc. will happen in Phase 2/3.
