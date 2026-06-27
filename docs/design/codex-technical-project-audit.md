# Codex technical project audit — Reformando.app

Date: 2026-06-02

Branch: `codex/technical-project-audit`

Base branch: `origin/main`

Base commit audited: `2f142bd` (`merge: audit codex rescue visual state`)

Update note: `origin/main` has advanced since the initial Codex audit. Current `main` includes `5237861` (`merge: add internal design reference route`), meaning `/design-reference` already exists safely and is no longer a future recommendation.

Rescue branch compared: `origin/rescue/codex-visual-state-20260602-192436`

## 1. Executive summary

Reformando.app is currently in a functionally stable but visually incomplete state. The main branch keeps the real home dashboard, project routes, budget routes, task route, AppShell and service/repository boundaries intact. The product is not replaced by the visual rescue gallery in main.

The principal risk is not a broken product today; it is an unsafe migration path. The rescue branch contains valuable visual language, but it achieved the look by replacing `/` with a static reference screen, bypassing AppShell on the home route, changing font strategy and adding dependencies without approval.

The main opportunity is that the project already has the right migration foundation: semantic Tailwind config, Inter + Space Grotesk wiring, shared UI components partly migrated, and a written design-system source of truth. The next step should be controlled extraction of visual rules into documentation/reference components, then incremental alignment of real screens without touching routes, data or app shell behavior.

Recommendation: do not merge rescue. Use it only as source material. First consolidate an isolated style reference and specs; then apply the visual language screen-by-screen over the real product.

## 2. Current main branch state

### Git state

Commands requested before audit:

```txt
git status --short
```

Result: clean working tree before creating this document.

```txt
git rev-parse --short HEAD
```

Result:

```txt
2f142bd
```

```txt
git log --oneline --decorate -5
```

Result:

```txt
5237861 (origin/main, origin/HEAD, main) merge: add internal design reference route
2f142bd merge: audit codex rescue visual state
2652aaa (origin/openclaw/ui-codex-visual-extraction-audit) docs(design): audit codex rescue visual state
be449b5 merge: migrate dashboard screen to semantic tokens
28fc726 (origin/openclaw/ui-dashboard-semantic-screen) refactor(ui): migrate dashboard screen to semantic tokens
6dbe049 merge: migrate shared components to semantic tokens
```

### Relevant branches

| Branch | Role | Status |
|---|---|---|
| `origin/main` | Stable product baseline | Initial audit at `2f142bd`; main now includes `5237861` (design reference route added safely) |
| `origin/rescue/codex-visual-state-20260602-192436` | Unsafe visual rescue | Reference only; do not merge |
| `origin/openclaw/ui-reference-style-library-safe` | Safe internal reference route implementation | Landed in main via `5237861` |
| `origin/openclaw/ui-codex-audit-consolidation` | Recent documentation consolidation branch | Review for overlap before duplicating docs |

### Validation status

At audit time, `node_modules` may be missing in the local audit checkout. The requested commands should still be attempted from this branch, but any failure caused by missing dependencies or unavailable package installation should be treated as environment validation, not a product regression.

The audit itself is docs-only and does not require runtime changes.

## 3. Product integrity audit

| Area | Classification | Evidence | Notes |
|---|---|---|---|
| Dashboard real `/` | OK | `src/app/page.tsx` imports `ReformistDashboardScreen` and `getDashboardSummary()` | Main keeps the real dashboard contract. Rescue replaces this; main does not. |
| Project list route `/projects` | OK | `src/app/projects/page.tsx` uses `getProjectCards()` | Functional path intact; visually still uses arbitrary `var(--token)` classes. |
| Project detail route `/projects/[id]` | Partial | `src/app/projects/[id]/page.tsx` uses `getProjectOverview(id)` and `ProjectOverviewScreen` | Data flow intact, but screen uses off-system `slate-*` classes. |
| Project tasks route `/projects/[id]/tasks` | Partial | `src/app/projects/[id]/tasks/page.tsx` uses `getProjectOverview()` and `getProjectTasks()`; client uses `updateTaskStatusAction()` | Functional route and mutation flow exist; UI still has light Tailwind classes and local optimistic state. |
| Budget list route `/budgets` | OK | `src/app/budgets/page.tsx` uses `getBudgetSummaries()` | Functional path intact; visual layer still partially legacy. |
| Budget detail route `/budgets/[id]` | Partial | `src/app/budgets/[id]/page.tsx` uses `getBudgetSummary(id)` and `BudgetSummaryScreen` | Data flow intact, but detail screen uses off-system `slate-*` cards. |
| AppShell | Partial | `src/components/layout/AppShell.tsx` remains server-compatible and wraps all routes | It is structurally intact, but still uses arbitrary `bg-[var(--token)]` / `text-[var(--token)]` classes and a hardcoded active nav item. |
| Root layout | OK | `src/app/layout.tsx` uses `next/font/google` for Inter and Space Grotesk and wraps children in `AppShell` | Correct foundation. Rescue removes this font wiring and should not be merged. |
| Supabase/data layer | OK, intentionally inactive | Services use mock repositories; Supabase repositories are explicit skeletons and not connected at runtime | Good separation: UI consumes services, not Supabase clients directly. Do not touch in visual work. |

### Data flow summary

Current services are mock-backed by design:

- `src/lib/services/dashboard.ts` uses `createDashboardRepository({ dataSource: "mock" })`.
- `src/lib/services/projects.ts` uses `createProjectsRepository({ dataSource: "mock" })`.
- `src/lib/services/budgets.ts` uses `createBudgetsRepository({ dataSource: "mock" })`.
- `src/lib/services/tasks.ts` uses `createTasksRepository({ dataSource: "mock" })`.

Supabase code exists as a future repository path, but the factories explicitly keep runtime mock-backed or throw for unsupported Supabase paths. That is healthy for this stage and should not be mixed with visual migration.

## 4. Design system migration audit

### Tailwind configuration

`tailwind.config.js` is a healthy foundation:

- semantic `bg`, `content`, `primary`, `success`, `warning`, `danger`, `guild` color groups exist;
- Inter and Space Grotesk are mapped to `fontFamily.sans` and `fontFamily.num`;
- `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-label`, `text-caption`, `text-overline`, `text-num-md` exist;
- `borderColor.subtle`, `borderColor.DEFAULT`, `borderColor.strong` and `ringColor.focus` exist;
- radius scale is aligned with the modern design system.

Classification: OK.

### `globals.css`

`src/app/globals.css` is functional but transitional:

- canonical runtime tokens exist for surfaces, text, semantic colors, radius, spacing, shadows and typography;
- missing modern-source tokens have been added;
- a `--ds-*` compatibility layer exists;
- `@theme inline` includes Tailwind v4 hooks;
- border/focus mismatches are documented in comments.

Risk: partial. The file intentionally keeps compatibility shims and old token types because the codebase has not finished migrating away from arbitrary variable classes.

### `--ds-*` shim

`--ds-*` appears only in `src/app/globals.css` after the current component migrations. This is acceptable as a temporary shim, but it should not be expanded into product code.

The exact normalized grep result was:

```txt
src/app/globals.css:145..193 --ds-* aliases and border/focus/shadow compatibility tokens
src/app/globals.css:207..215 @theme inline --color-ds-* hooks
```

Classification: partial, intentional.

### Arbitrary `var(--token)` usage

Main still contains direct arbitrary variable classes in:

- `src/components/layout/AppShell.tsx`
- `src/app/projects/page.tsx`
- `src/app/budgets/page.tsx`

Examples:

```txt
bg-[var(--bg-base)]
text-[var(--text-primary)]
border-[var(--border-subtle)]
focus-visible:ring-[var(--primary-300)]
```

Classification: partial. These should be migrated in small, reviewable branches using semantic classes (`bg-bg-base`, `text-content-primary`, `border-subtle`, `ring-focus`).

### Fonts

`src/app/layout.tsx` correctly wires Inter and Space Grotesk using `next/font/google`:

- `--font-inter`
- `--font-space-grotesk`
- `dark` on `<html>`

Classification: OK.

Note: build environments without access to Google Fonts may need an approved strategy later, but rescue's unapproved switch to `@fontsource/*` is not acceptable by default.

### Shared UI components

Current code is ahead of some older inventories:

- `Card.tsx` uses semantic classes and `rounded-lg`.
- `Badge.tsx` uses semantic tone classes and supports `tone`/`status`.
- `Button.tsx` uses `ring-focus`, blue primary, semantic secondary/ghost.
- `ProgressBar.tsx` uses semantic tone fills.
- `ListItem.tsx` uses semantic colors but still has a left accent-bar pattern.
- `MetricCard.tsx` still has the legacy top accent-bar variant.

Classification: partial. Shared components are no longer the main blocker, but `MetricCard` and `ListItem` still need design review against the ZIP/source of truth.

### Dashboard semantic state

`ReformistDashboardScreen.tsx` is a useful current baseline:

- it uses real summary input;
- it maps KPI/status labels to Spanish labels (`EN CURSO`, `AVISO`, `BLOQUEO`);
- it composes KPI cards directly with `Card` and `Badge`, avoiding direct `MetricCard` usage;
- it uses semantic Tailwind classes heavily.

Remaining gap: it captures product integrity more than the reference atmosphere. It lacks the stronger visual depth, radial atmosphere and phone-like geometry from `galeria-pantallas.html`/rescue.

### Style-export docs accuracy

Some `docs/design/style-export/*` files are historical snapshots and no longer exactly match main. For example, `app-components-inventory.md` still reports older `rounded-2xl` and `--ds-*` component references that are no longer present in current `Card`, `Badge`, `Button` and `ProgressBar`.

Use those files as migration context, not as current-state truth. For current truth, inspect source.

## 5. Rescue branch audit

Comparison commands reviewed:

```txt
git diff --name-status origin/main..origin/rescue/codex-visual-state-20260602-192436
git diff --stat origin/main..origin/rescue/codex-visual-state-20260602-192436
```

Name-status result:

```txt
D docs/design/codex-visual-state-audit.md
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

Diff stat:

```txt
18 files changed, 1611 insertions(+), 328 deletions(-)
```

### File classification table

| Archivo | Tipo de cambio | Valor visual | Riesgo técnico | Acción recomendada |
|---|---|---:|---:|---|
| `docs/design/codex-visual-state-audit.md` | Deleted in rescue relative to current main | None | Medium: removes accepted audit doc | NO TOCAR |
| `docs/design/visual-direction-audit.md` | New documentation | Medium | Low | REVISAR MANUALMENTE |
| `package.json` | Adds `@fontsource/inter`, `@fontsource/space-grotesk`, `lucide-react` | Low-medium | High: dependency changes without approval | DESCARTAR |
| `package-lock.json` | Lockfile churn for new dependencies | Low | High | DESCARTAR |
| `src/app/page.tsx` | Replaces real dashboard with `DesignReferenceScreen` | High as visual demo | Critical: product route replacement | DESCARTAR |
| `src/components/layout/AppShell.tsx` | Converts to client, uses `usePathname`, bypasses shell on `/` | Low-medium | Critical: layout/routing behavior changed for demo | DESCARTAR |
| `src/app/layout.tsx` | Removes `next/font/google` variables from `<html>` | Low | High: breaks agreed font integration model | DESCARTAR |
| `src/app/globals.css` | Small font-family fallback adjustment | Low | Medium: tied to removed font wiring | REVISAR MANUALMENTE |
| `src/components/screens/DesignReferenceScreen.tsx` | New static visual gallery | High | High if mounted as product; low if isolated internal reference | EXTRAER COMO REFERENCIA |
| `src/components/screens/DesignReferenceScreen.module.css` | Large CSS module with reference visual system | Very high | Medium if copied globally; low if mined into tokens/specs | EXTRAER COMO REFERENCIA |
| `src/app/projects/page.tsx` | Migrates arbitrary vars to semantic classes | Medium | Low-medium: appears structural-safe but must be reviewed independently | REIMPLEMENTAR SOBRE PRODUCTO REAL |
| `src/app/budgets/page.tsx` | Migrates arbitrary vars to semantic classes | Medium | Low-medium | REIMPLEMENTAR SOBRE PRODUCTO REAL |
| `src/app/projects/[id]/page.tsx` | Retokens navigation links | Low-medium | Low | REIMPLEMENTAR SOBRE PRODUCTO REAL |
| `src/app/projects/[id]/tasks/page.tsx` | Retokens headings/back links | Medium | Low | REIMPLEMENTAR SOBRE PRODUCTO REAL |
| `src/app/projects/[id]/tasks/ProjectTasksClient.tsx` | Retokens slate/rose classes to semantic classes | Medium | Low-medium: client mutation flow must be regression-tested | REIMPLEMENTAR SOBRE PRODUCTO REAL |
| `src/app/budgets/[id]/page.tsx` | Retokens back link | Low | Low | REIMPLEMENTAR SOBRE PRODUCTO REAL |
| `src/components/screens/ProjectOverviewScreen.tsx` | Replaces light slate cards with semantic dark cards | Medium-high | Low-medium: visual-only if data props preserved | REIMPLEMENTAR SOBRE PRODUCTO REAL |
| `src/components/screens/BudgetSummaryScreen.tsx` | Replaces light slate cards with semantic dark cards | Medium-high | Low-medium: visual-only if data props preserved | REIMPLEMENTAR SOBRE PRODUCTO REAL |

### Rescue value summary

The reference files are visually valuable, but the route/layout/dependency changes are unsafe. The safe subset is not "merge these files"; it is "extract these visual decisions":

- atmosphere;
- surface depth;
- card geometry;
- typography hierarchy;
- neutral guild chips;
- blue CTA treatment;
- green reserved for money/validation;
- timeline/progress patterns;
- dense mobile phone compositions.

## 6. What must never be merged from rescue

Do not merge these rescue changes as-is:

- replacing `/` with a static gallery;
- rendering `DesignReferenceScreen` from `src/app/page.tsx`;
- bypassing `AppShell` on `/`;
- converting AppShell to client solely to support a reference screen;
- removing `next/font/google` wiring from `src/app/layout.tsx`;
- adding `@fontsource/inter`, `@fontsource/space-grotesk` or `lucide-react` without explicit approval;
- changing `package.json` or `package-lock.json` as part of visual extraction;
- changing real routes in bulk without one-route scope and review;
- disconnecting service/repository calls from real screens;
- introducing static product mockups in place of real screens;
- touching Supabase or data source selection during visual migration.

## 7. What should be extracted from rescue

Extract the following as reference, tokens or controlled component specs:

- dark atmospheric page background with subtle blue/green radial glows;
- elevated phone/mock containers for internal reference and design QA;
- surface stack: base, surface, raised, overlay;
- subtle borders and high-contrast inner cards;
- larger numeric hierarchy with Space Grotesk;
- blue CTAs with controlled shadow;
- secondary buttons on raised surfaces;
- neutral guild chips;
- inputs with raised surface, subtle border, 12px radius;
- progress bars using blue for progress and green only for done/money/validation;
- timeline dots: green for completed, blue for current;
- sticky footers and tab bars as mobile/PWA references;
- spacing rhythm around 12/16/18/20/24px;
- border radius vocabulary: 12px buttons/inputs, 16px cards, 30px phone shell;
- card shadows only for genuinely floating layers.

Extraction forms allowed:

- internal reference documentation;
- isolated reference route only when explicitly authorized;
- reusable design tokens;
- shared component variants;
- screen-specific visual specs;
- controlled reimplementation over existing real screens.

Extraction forms not allowed:

- replacing production routes;
- global CSS changes that alter all screens without a dedicated reviewed branch;
- dependency additions without approval;
- static mock screens pretending to be product.

## 8. Recommended division of work: Codex vs Openclaw

### Codex should own

- deep diff analysis between main/rescue and current implementation branches;
- documentation of visual decisions, risks and migration sequence;
- extraction of visual rules from `galeria-pantallas.html` and `DesignReferenceScreen.module.css`;
- screen-by-screen visual specs before implementation;
- QA checklists for route/data integrity;
- visual smoke test plans and acceptance criteria;
- comparing implemented screens against `docs/design/modern-source/galeria-pantallas.html`;
- identifying where implementation would require dependency or layout decisions.

### Openclaw should own

- small implementation branches from clean `origin/main`;
- one scope per branch: reference route, shared component, dashboard, budgets, projects, tasks;
- incremental application of semantic classes to real product screens;
- lint/build/test execution after each branch;
- controlled commits and pushes;
- no product replacement, no route rewiring, no Supabase/data changes outside explicit scope;
- stopping when implementation requires product/design approval.

### Practical boundary

Codex should audit and specify. Openclaw should execute narrow, reversible implementation tasks. If Openclaw sees that a task needs route changes, dependency changes, AppShell changes or Supabase changes, it should stop and request approval.

## 9. Recommended next branches

1. `openclaw/ui-reference-style-library-safe`
   - Purpose: create an isolated internal visual reference only when authorized.
   - Scope: documentation; `/design-reference` route is already available in main as a safe internal reference.
   - Constraints: no `/`, no AppShell bypass, no `package.json`, no `package-lock.json`, no Supabase.

2. `codex/ui-visual-spec-dashboard`
   - Purpose: produce a dashboard visual spec against the real dashboard contract.
   - Scope: docs only.
   - Output: component mapping, spacing, cards, hero, KPIs, alerts, QA checklist.

3. `openclaw/ui-dashboard-visual-alignment`
   - Purpose: apply dashboard visual alignment to `ReformistDashboardScreen` only.
   - Scope: keep `getDashboardSummary()` and route `/` intact.
   - Constraints: no AppShell/layout/dependency/data changes.

4. `codex/ui-visual-spec-budgets`
   - Purpose: produce visual spec for budget list/detail.
   - Scope: docs only.

5. `openclaw/ui-budgets-visual-alignment`
   - Purpose: apply budget list/detail visual alignment to real routes.
   - Scope: `src/app/budgets/*` and `BudgetSummaryScreen` only, if approved.
   - Constraints: preserve `getBudgetSummaries()` and `getBudgetSummary(id)`.

6. `codex/ui-visual-spec-projects-tasks`
   - Purpose: produce visual spec for project list/detail/tasks.
   - Scope: docs only.

7. `openclaw/ui-projects-tasks-visual-alignment`
   - Purpose: retoken projects and tasks over real screens.
   - Scope: route files and screen/client components only, one subroute at a time if needed.
   - Constraints: preserve `getProjectCards()`, `getProjectOverview()`, `getProjectTasks()` and `updateTaskStatusAction()`.

8. `codex/ui-visual-regression-checklist`
   - Purpose: create visual and functional regression checklist.
   - Scope: docs/tests plan only.

## 10. Immediate recommendation

Next action:

1. Keep this audit as the technical decision baseline.
2. Ask Openclaw to consolidate documentation and, already completed: `/design-reference` exists safely in main (commit `5237861`).
3. Have Codex write the dashboard visual spec before any dashboard implementation.
4. Apply dashboard styles over the real `ReformistDashboardScreen` in a narrow Openclaw branch.

What I would not do next:

1. I would not merge rescue.
2. I would not change `/`.
3. I would not change `AppShell` to support a reference screen.
4. I would not touch `layout.tsx` or the font strategy.
5. I would not add `lucide-react` or `@fontsource/*`.
6. I would not touch Supabase, data repositories or service source selection.
7. I would not visually align all routes in one branch.
8. I would not use static screenshots/mockups as product screens.

## Appendix A. Required source files reviewed

Documentation reviewed:

- `docs/design/codex-visual-state-audit.md`
- `docs/design/implementation-spec/IMPLEMENTATION-SPEC.md`
- `docs/design/implementation-spec/TOKEN-MIGRATION.md`
- `docs/design/implementation-spec/MIGRATION-CHECKLIST.md`
- `docs/design/implementation-spec/DECISIONS-SUMMARY.md`
- `docs/design/implementation-spec/FOUNDATION-APPLIED.md`
- `docs/design/implementation-spec/SHARED-COMPONENTS-SEMANTIC.md`
- `docs/design/modern-source/SISTEMA-DE-DISENO.md`
- `docs/design/modern-source/galeria-pantallas.html`
- `docs/design/style-export/style-assets-export.md`
- `docs/design/style-export/token-comparison.md`
- `docs/design/style-export/app-components-inventory.md`
- `docs/design/style-export/screens-style-inventory.md`
- `docs/design/style-export/current-dashboard-style-audit.md`

Application files reviewed:

- `package.json`
- `package-lock.json`
- `tailwind.config.js`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/screens/ReformistDashboardScreen.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/ProgressBar.tsx`
- `src/components/ui/ListItem.tsx`
- `src/components/ui/MetricCard.tsx`
- `src/app/projects/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/app/projects/[id]/tasks/page.tsx`
- `src/app/projects/[id]/tasks/ProjectTasksClient.tsx`
- `src/app/budgets/page.tsx`
- `src/app/budgets/[id]/page.tsx`
- `src/components/screens/ProjectOverviewScreen.tsx`
- `src/components/screens/BudgetSummaryScreen.tsx`

## Appendix B. Required pattern checks

Pattern checks confirmed:

- `var(--` remains in AppShell, project list and budget list, plus globals.
- `--ds-*` is currently limited to `src/app/globals.css`.
- `bg-[var(--token)]`, `text-[var(--token)]`, `border-[var(--token)]` remain in AppShell, project list and budget list.
- `MetricCard` exists but is not used by current app routes/screens in the grep scope.
- `lucide-react`, `@fontsource/*` and `DesignReferenceScreen` are not present in package/source code on main; they are only mentioned in audit documentation.
