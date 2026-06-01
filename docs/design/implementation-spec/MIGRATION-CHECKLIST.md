# MIGRATION CHECKLIST — Reformando.app → modern design system

Work top to bottom. Each phase is shippable on its own; nothing should look worse
after any phase.

## Phase 1 — Foundation (land together in one PR)
- [ ] Add the semantic Tailwind theme from `modern-source/tailwind.config.js`
      (colors, borderRadius, fontFamily, fontSize, boxShadow, borderColor, ringColor).
- [ ] Add missing `:root` tokens (TOKEN-MIGRATION.md §A).
- [ ] Add the `--ds-*` compatibility shim (TOKEN-MIGRATION.md §B).
- [ ] Wire fonts in `layout.tsx`: Inter + Space Grotesk via `next/font/google`,
      expose `--font-inter` / `--font-space-grotesk`, put `dark` + both vars on `<html>`.
- [ ] Point Tailwind `fontFamily.sans` → Inter var, `fontFamily.num` → Space Grotesk var.
- [ ] Remove Geist / Geist Mono imports.
- [ ] Smoke-test: app still renders, no console errors, fonts visibly Inter.

## Phase 2 — Shared UI components (`src/components/ui/`)
- [ ] `Card`: radius `rounded-2xl` → `rounded-lg`; drop `--ds-*` refs → semantic classes.
- [ ] `Button`: focus → `ring-focus`; verify `primary`=blue, `confirm`=green.
- [ ] `Badge`: remove `--ds-*` duplication; lock status set to info/success/warning/danger(+neutral).
- [ ] `MetricCard`: replace with ZIP `MetricCard` + `MetricCardGroup`; remove accent-bar (`before:h-2`).
- [ ] `ListItem`: align to modern `ListItem`/`ListGroup` (dividers, density, `rounded-[14px]`).
- [ ] `ProgressBar`: default tone blue; enforce amber=warning-only, green=done-only.
- [ ] `EmptyState`: dashed border → `border-dashed` token; radius → `rounded-lg`.
- [ ] `ErrorState` / `LoadingState`: retoken radius + borders.
- [ ] Import the not-yet-present ZIP components as needed: Avatar, Donut, GuildChip,
      SegmentedControl, TabBar, Timeline, Checkbox, Input.

## Phase 3 — Screens (one at a time)
- [ ] `ReformistDashboardScreen.tsx`: convert `bg-[var(--…)]` → semantic; map KPI badge
      enum → localized labels (`EN CURSO` / `AVISO` / `BLOQUEO`), not raw `info`/`warning`.
- [ ] `projects/page.tsx`: arbitrary-var → semantic; standardize focus ring.
- [ ] `budgets/page.tsx`: same.
- [ ] `projects/[id]/tasks/page.tsx`: retoken raw `slate-*` / `rose-*` (TOKEN-MIGRATION §D).
- [ ] `projects/[id]/tasks/ProjectTasksClient.tsx`: same.
- [ ] Sweep remaining screens for `slate-`, `rose-`, `[var(--ds-`, `border-[var(`.

## Phase 4 — Cleanup
- [ ] Grep for `--ds-` → 0 hits in code. Delete the shim from `globals.css`.
- [ ] Grep for `border-[var(--border` and `ring-[var(--focus` → 0 hits.
- [ ] Grep for `rounded-2xl` in components → should be `rounded-lg` where it meant a card.
- [ ] Confirm Space Grotesk appears ONLY on large numerals / `text-display`, not body.
- [ ] Visual diff against `galeria-pantallas.html` for each migrated screen.

## System invariants to verify at the end (from SISTEMA-DE-DISENO.md)
- [ ] Guild chips are neutral and `GuildChip` accepts no color prop.
- [ ] Green appears only for money / "done" / validation — never progress or selection.
- [ ] Exactly 4 semantic states exist: info, success, warning, danger.
- [ ] `SegmentedControl` scales read low→high (Aprendiz → Oficial 2ª → Oficial 1ª).
