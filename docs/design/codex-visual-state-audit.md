# Codex visual state audit (rescue) — 2026-06-02

## Context

Codex generated a **visually aligned** state, preserved as:

- Rescue branch: `origin/rescue/codex-visual-state-20260602-192436`
- Visual commit: `3b5c4cc`
- Stable base to compare against: `origin/main` = `be449b5`

**Rule:** do **not** merge the rescue branch to `main`. Use it only as a reference to extract reusable visual rules.

## 1) Executive summary

The rescue state achieves the look largely by introducing a **static design reference screen** and routing the app’s home page (`/`) to it. This is visually effective but **product-dangerous**.

Main risks:
- `/` is no longer the real dashboard.
- Layout behavior is altered to bypass the shell on `/`.
- Font loading model is changed away from the agreed `next/font/google` setup.
- New dependencies are introduced without review (`lucide-react`, `@fontsource/*`).

Main value:
- A large, high-signal CSS module captures the reference look (atmosphere, elevation, hierarchy, chips, buttons, inputs) and can be mined for **portable visual rules**.

## 2) Diff inventory (exact)

### `be449b5..3b5c4cc` (name-status)

```
A docs/design/visual-direction-audit.md
M package-lock.json
M package.json
M src/app/budgets/[id]/page.tsx
M src/app/budgets/page.tsx
M src/app/globals.css
M src/app/layout.tsx
M src/app/page.tsx
M src/app/projects/[id]/page.tsx
M src/app/projects/[id]/tasks/ProjectTasksClient.tsx
M src/app/projects/[id]/tasks/page.tsx
M src/app/projects/page.tsx
M src/components/layout/AppShell.tsx
M src/components/screens/BudgetSummaryScreen.tsx
A src/components/screens/DesignReferenceScreen.module.css
A src/components/screens/DesignReferenceScreen.tsx
M src/components/screens/ProjectOverviewScreen.tsx
```

### Impact snapshot
- 17 files changed
- ~1611 insertions / 138 deletions
- Biggest payload: `DesignReferenceScreen.module.css` (~834 lines)

## 3) Classification (per file)

### A) Product-dangerous (DO NOT SHIP as-is)

1) `src/app/page.tsx`
- **Category:** routing + product replacement
- **What happened:** `/` now renders `DesignReferenceScreen` and removes `getDashboardSummary()` + `ReformistDashboardScreen`.
- **Risk:** replaces real product with static mock.

2) `src/components/layout/AppShell.tsx`
- **Category:** structural + routing behavior
- **What happened:** becomes a client component (`"use client"`), uses `usePathname()`, and **disables the shell on `/`**.
- **Risk:** changes server/client boundaries + bypasses real navigation chrome to support the static mock.

3) `src/app/layout.tsx`
- **Category:** structural / typography integration
- **What happened:** removes the agreed `next/font/google` wiring for Inter + Space Grotesk.
- **Risk:** breaks the chosen integration model; creates a second font-loading strategy.

### B) Dependency risk (requires human approval)

4) `package.json`, `package-lock.json`
- **Category:** new dependencies
- **Added:**
  - `lucide-react`
  - `@fontsource/inter`
  - `@fontsource/space-grotesk`
- **Risk:** bundle size + lock churn; icon library added mainly to support the static reference.

### C) High-value visual reference (keep only as internal reference)

5) `src/components/screens/DesignReferenceScreen.tsx`
- **Category:** static reference screen
- **Value:** showcases intended composition and component feel.
- **Rule:** keep only behind an internal route (e.g. `/design-reference`), never as `/`.

6) `src/components/screens/DesignReferenceScreen.module.css`
- **Category:** visual/styling (extractable)
- **Portable rules to mine:**
  - atmospheric background (radial glows)
  - elevation/shadow recipes
  - spacing rhythm and card geometry
  - chip/badge shape, weight, and contrast
  - input/button treatments aligned to reference

### D) Needs deeper review (could be safe styling OR could hide mock/data changes)

7) Real pages/screens:
- `src/app/projects/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/app/projects/[id]/tasks/page.tsx`
- `src/app/projects/[id]/tasks/ProjectTasksClient.tsx`
- `src/app/budgets/page.tsx`
- `src/app/budgets/[id]/page.tsx`
- `src/components/screens/ProjectOverviewScreen.tsx`
- `src/components/screens/BudgetSummaryScreen.tsx`

**Audit questions for each file:**
- Is any real data replaced by hardcoded placeholders?
- Are service/repository calls removed?
- Are route params and navigation intact?
- Are any functional components/imports deleted?

## 4) Determinations (requested)

### 4.1 Is `/` replaced by a static gallery?
**Yes.** (via `src/app/page.tsx`).

### 4.2 Do real routes still respond?
Local smoke checks returned HTTP 200 for:
- `/`
- `/projects`
- `/budgets`
- `/projects/project_obra_centro/tasks`

But `/` is not the real dashboard in rescue.

### 4.3 Do mocks/real data flows remain connected?
- For `/`: **No** (dashboard service removed from home).
- For projects/budgets/tasks: **unknown until per-file diff audit is completed**.

### 4.4 Were dependencies added just for the reference look?
**Yes** (icons + CSS font packages).

## 5) What to preserve vs what to revert

### Preserve (as reference / extract)
- The *visual rules* encoded in `DesignReferenceScreen.module.css`.
- Any safe typography/spacing/shadow patterns that can be expressed in semantic Tailwind.

### Revert / never ship
- `src/app/page.tsx` pointing `/` to the reference.
- `AppShell` pathname-gating on `/`.
- Font loading via `@fontsource/*` unless the team explicitly decides to switch away from `next/font/google`.
- New dependencies unless explicitly approved.

## 6) Correct integration plan (safe)

1) **Keep reference internal**
- Mount it at `/design-reference` (or behind a dev-only flag).
- Restore `/` to the real dashboard.

2) **Extract visual direction into reusable primitives**
- Background atmosphere: decide a canonical approach (layout wrapper vs global css).
- Elevation: clarify when to use border vs raised surface vs shadow.
- Badge: enforce reference contrast and typographic treatment.
- Typography hierarchy: ensure KPI values use `font-num` + `text-display`.

3) **Apply to real components and screens**
- Prefer controlled PRs that:
  - update real components (`Card`, `Badge`, `Button`, etc.)
  - then adjust the dashboard and other screens
  - without touching routes/data.

4) **Dependencies approval gate**
- Decide icons: keep `lucide-react` or choose a different strategy.
- Decide fonts: stay on `next/font/google` (recommended) vs `@fontsource/*`.

---

## Appendix — exact risky diffs (high-signal)

### `/` replaced
`src/app/page.tsx`:
- removes `getDashboardSummary()` and `ReformistDashboardScreen`
- renders `<DesignReferenceScreen />`

### Layout font wiring removed
`src/app/layout.tsx`:
- removes `Inter` / `Space_Grotesk` from `next/font/google`
- removes CSS variables on `<html>`

### Shell bypass on `/`
`src/components/layout/AppShell.tsx`:
- adds `"use client"`, `usePathname()`
- returns `{children}` when `pathname === "/"`
