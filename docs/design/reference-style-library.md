# Reference style library (internal)

This folder documents and hosts an **internal-only** visual reference route.

## Purpose

We have a rescue branch (`origin/rescue/codex-visual-state-20260602-192436`) that captures a visually aligned direction, but it cannot be merged because it contains product-dangerous changes (home replacement, shell bypass, layout/font changes, and unapproved dependencies).

This branch (`openclaw/ui-reference-style-library-safe`) extracts only the safe reference artifacts so the team can review the intended look in the running app **without** replacing real routes or data.

## Route

- Internal route: `/design-reference`
- File: `src/app/design-reference/page.tsx`
- Screen: `src/components/screens/DesignReferenceScreen.tsx`
- Styles: `src/components/screens/DesignReferenceScreen.module.css`

## What was extracted from Codex

- The **static** reference screen structure (phone frames / composition).
- The large CSS module containing the reference look (atmosphere, depth, chips, CTAs, typography).

## What was NOT extracted (and must never be merged from rescue)

- `src/app/page.tsx` routing `/` to the reference screen.
- `src/components/layout/AppShell.tsx` bypass logic for `/`.
- `src/app/layout.tsx` removal of `next/font/google`.
- `package.json` / `package-lock.json` dependency additions (`lucide-react`, `@fontsource/*`).
- Any real-route edits under `/projects`, `/budgets`, `/tasks` without individual review.

## Dependency policy (strict)

The original reference used `lucide-react` and `@fontsource/*`. In this safe extraction branch:

- We do **not** add dependencies.
- Icons are replaced by lightweight placeholders (`IconPlaceholder`) so the screen compiles.
- Fonts continue to come from the existing foundation.

## How to use this route

- Use `/design-reference` to validate the **intended visual direction** (depth, hierarchy, color semantics).
- Do **not** treat this as product UI.
- Real migration must be done screen-by-screen on real routes using real components and data.

