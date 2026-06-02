# Dashboard visual alignment spec

Date: 2026-06-02

Branch: `codex/ui-visual-spec-dashboard`

Target future implementation branch: `openclaw/ui-dashboard-visual-alignment`

Scope: visual specification only. No product code changes in this branch.

## 1. Current real dashboard state

Current real dashboard file:

- `src/components/screens/ReformistDashboardScreen.tsx`

Current route flow:

- `/` remains `src/app/page.tsx`.
- `/` calls `getDashboardSummary()`.
- `/` renders `<ReformistDashboardScreen summary={dashboardSummary} />`.
- The dashboard receives a `DashboardSummary` prop and must continue to render from that prop.

Current dashboard structure:

1. Hero card
   - `Card variant="raised" padding="lg"`.
   - Badge: `Dashboard operativo`.
   - Heading: `Reformando.app`.
   - Copy describing the operational dashboard.
   - Two compact cards for pending budgets and open incidents.

2. KPI grid
   - Four metric cards:
     - `Obras activas`
     - `Tareas retrasadas`
     - `Bloqueos`
     - `Aprobaciones`
   - Uses `font-num text-display` for numbers.
   - Uses localized badge labels (`EN CURSO`, `AVISO`, `BLOQUEO`, `INFO`).

3. Main two-column area
   - Left: active projects list.
   - Right: pending budgets and operational alerts.

4. Data behavior
   - Uses real dashboard summary shape.
   - Uses helper functions for status label formatting, alert tone mapping and project health progress.
   - Does not import static reference data.

Current strengths:

- Product route and data contract are intact.
- AppShell remains intact.
- Dashboard already uses semantic Tailwind classes heavily.
- Metrics avoid the legacy `MetricCard` accent-bar component.
- Space Grotesk is already used for large numeric KPI values.
- Semantic colors are already mostly respected.

Current visual gaps:

- The dashboard is visually correct but not atmospheric enough compared with `/design-reference`.
- The hero card reads like a standard admin panel rather than a command center.
- Cards have correct tokens but lack the reference depth, inner glow and hierarchy.
- Section headers are plain and under-specified.
- The KPI grid is functional but less refined than the reference profit/metric treatment.
- Project/budget/alert lists are dense but not visually staged as operational modules.
- Primary/secondary actions are present, but there is no strong blue CTA moment.
- The dashboard does not use the radial background atmosphere shown in the reference.

## 2. Differences versus `/design-reference`

| Area | Real dashboard today | `/design-reference` direction | Dashboard target |
|---|---|---|---|
| Background | AppShell base background, mostly flat | Radial blue/green glows over near-black base | Add local atmospheric layer inside dashboard section without changing AppShell/global CSS |
| Hero | Generic raised card with text + two counters | Strong framed composition with high-contrast hero modules | Convert hero into command-center panel with larger hierarchy and inner modules |
| Metrics | Four simple cards | Numeric hero blocks, overlines, strong surface contrast | Keep real KPI data, increase visual hierarchy and card depth |
| Cards | `Card` variants, clean but flat | Subtle borders, raised surfaces, inner panels, 16px radius | Use existing `Card` plus targeted classes; no new component dependency |
| Badges | Correct semantic colors, rounded pill | Smaller, denser chips; neutral chips for non-status | Keep semantic badges; use `dot`/`pill={false}` where useful |
| Buttons | Secondary `Ver todas` only | Blue CTAs with controlled shadow | Add/adjust CTA treatment only if action already exists; do not invent workflows |
| Spacing | `gap-8`, `gap-6`, `p-6` | More deliberate 12/16/18/22/24 rhythm | Tighten internal card spacing; preserve responsive layout |
| Radius | `rounded-lg` from Card | 12px buttons, 16px cards, 30px phone shell | Keep 16px cards; do not introduce phone frame into product dashboard |
| Shadows | Mostly `shadow-none` | Floating phone shadow and CTA shadow | Use shadow sparingly: CTA/hero accents only, not every card |
| Typography | Good base; some generic `text-lg`/`text-sm` | Overlines, `font-num`, high-contrast numbers | Use `text-overline`, `text-h*`, `font-num text-display` consistently |
| Progress | Health bars use semantic tones | Default progress blue; green only done/money | Consider blue default for health/readiness; warning/danger only when status truly requires |

## 3. Visual patterns to extract

### Background

Pattern to extract:

```css
radial-gradient(circle at 20% 10%, rgba(45, 127, 249, 0.08), transparent 45%),
radial-gradient(circle at 85% 90%, rgba(29, 158, 117, 0.06), transparent 40%),
#05080f
```

Dashboard implementation guidance:

- Do not modify `AppShell`.
- Do not modify global `body`.
- Apply atmosphere only to the dashboard root or first inner wrapper.
- Use Tailwind arbitrary background only inside `ReformistDashboardScreen.tsx`, or introduce a local CSS module only if explicitly approved.
- Keep readability: the AppShell already provides padding and max width, so the background treatment should not fight the shell.

Recommended implementation shape:

- Change the dashboard root section from a plain layout wrapper to a local atmospheric canvas:
  - `relative isolate`
  - `overflow-hidden`
  - `rounded-xl` only if the dashboard should appear as a contained surface inside AppShell.
  - pseudo-layer equivalent via absolute `div` children if not using CSS module.

Do not:

- Set global `body` background.
- Bypass AppShell to get full-screen reference behavior.
- Move `/design-reference` styling into `globals.css`.

### Hierarchy

Pattern to extract:

- `captionType`/`overline`: small uppercase blue/secondary labels.
- `profitAmount`: large `font-num`, high-contrast values.
- Hero modules with one dominant number and secondary split metrics.

Dashboard target:

- Hero should state the operational purpose more directly:
  - overline: `CENTRO DE MANDO`
  - h1: `Panel operativo`
  - copy: daily operational control over obras, equipo and cliente.
- Keep product name visible but avoid making `Reformando.app` the only hero title.
- Use one dominant top-level operational signal. Candidate:
  - active works count;
  - open incidents count when `> 0`;
  - pending approvals count.

Data constraint:

- Use only fields already available on `summary`.
- Do not add fake profitability/margin values unless the dashboard summary contract already contains them.

### Cards

Pattern to extract:

- 16px radius.
- `bg-surface` cards on near-black base.
- `bg-surface-raised` for nested cards/inputs.
- subtle borders, no heavy generic shadows.
- occasional soft glow inside hero cards.

Dashboard target:

- Hero card: `bg-bg-surface` or `bg-bg-raised`, `border border-subtle`, `overflow-hidden`, `relative`.
- Nested quick-status cards: `bg-bg-base/70` or `bg-bg-surface`, `border border-subtle`, `rounded-lg`, `p-4`.
- Project cards: keep compact, but improve structure with stronger overlines and numeric row.
- Pending budgets/alerts: keep list structure; make each item feel like a contained operational record.

Do not:

- Create static phone frames in the real dashboard.
- Replace `Card` with custom divs everywhere.
- Add a new card system in this dashboard branch unless Openclaw first creates an approved shared component branch.

### Badges

Pattern to extract:

- semantic status badges only:
  - blue/info for active/current;
  - green/success only for done/money/validation;
  - amber/warning for pending/delayed;
  - red/danger only for blockers/errors/destructive.
- neutral chips for non-status metadata.

Dashboard target:

- Keep localized labels:
  - `EN CURSO`
  - `AVISO`
  - `BLOQUEO`
  - `AL DIA`
  - `INFO`
- Prefer `dot` badges for high-level dashboard signals.
- Use `pill={false}` for compact module labels when the badge is acting like a dense tag.

Do not:

- Render raw enum strings (`info`, `warning`, `danger`) to users.
- Use green for generic progress.
- Use red for non-error categories.

### Buttons

Pattern to extract:

- Blue primary CTA with controlled shadow:
  - `bg-primary-500`
  - hover `bg-primary-600`
  - `shadow-fab` only when the action is visually primary.
- Secondary buttons on raised surface.

Dashboard target:

- If the existing `Ver todas` remains, style it as a secondary action.
- If a primary CTA is added later, it must point to an existing route/action. Candidate only if already valid:
  - `Ver obras` or `Revisar obras`.
- Do not invent `Nueva obra`, `Nuevo presupuesto` or workflow actions unless product has approved those flows.

### Spacing

Pattern to extract:

- page/section gap: 24-32px.
- card padding: 16/20/24px.
- nested module gap: 11/12/14px.
- list rhythm: 9/12px between records.

Dashboard target:

- Keep outer vertical rhythm around `gap-6`/`gap-8`.
- Hero internal gap should be 24px on desktop, 18px on mobile.
- KPI cards should use `p-5` or `p-6`; nested lists `p-4`.
- Avoid excessive whitespace; the dashboard is operational and data-dense.

### Radius

Pattern to extract:

- cards: 16px (`rounded-lg` in current config).
- buttons/inputs: 12px (`rounded-md` or `rounded-xl` depending existing primitive).
- small chips: 7-8px.
- phone shell 30px is reference-only.

Dashboard target:

- Keep `Card` `rounded-lg`.
- Use `rounded-md` or `pill={false}` for dense badges if needed.
- Do not introduce 30px phone-style containers in product dashboard.

### Shadows

Pattern to extract:

- heavy shadow only for floating mock phone frames.
- CTA shadow: `0 8px 24px rgba(45,127,249,0.35)`.
- hero glow via pseudo/radial layer, not blanket card shadows.

Dashboard target:

- Keep most cards `shadow-none`.
- Use subtle internal gradient/glow in hero.
- Use `shadow-fab` only on a true primary CTA.

### Typography

Pattern to extract:

- Inter for UI.
- Space Grotesk only for large numerals.
- `overline` for labels.
- Larger numeric hierarchy than current secondary cards.

Dashboard target:

- Hero title: `text-h1` or responsive `text-3xl`.
- Section headings: `text-h3` or `text-lg font-semibold`.
- KPI values: `font-num text-display`.
- Secondary numeric values: `font-num text-h2` or `text-num-md`.
- Labels: `text-overline text-content-tertiary`.

Do not:

- Use Space Grotesk for body text.
- Add font dependencies.
- Remove existing `next/font/google` setup.

### Metrics

Pattern to extract:

- Reference `ProfitPhone` uses:
  - one dominant hero metric;
  - secondary split metrics;
  - compact category rows;
  - progress/donut blue by default;
  - green only for benefit/money.

Dashboard target:

- KPI cards should read as operational command tiles:
  - overline label;
  - semantic badge;
  - large number;
  - one-line helper.
- The hero could summarize:
  - active projects;
  - open incidents;
  - pending budgets;
  - pending approvals.
- Do not show financial/margin metrics until `DashboardSummary` exposes them.

## 4. What must not be done

Never do the following in the dashboard visual implementation:

- Do not replace `src/app/page.tsx`.
- Do not substitute `/` with `DesignReferenceScreen`.
- Do not import `DesignReferenceScreen` into the real dashboard.
- Do not bypass or modify `AppShell`.
- Do not change `src/app/layout.tsx`.
- Do not add `lucide-react`, `@fontsource/*` or any dependency.
- Do not change `package.json` or `package-lock.json`.
- Do not touch Supabase clients, repositories, factories or environment variables.
- Do not change service data source selection.
- Do not replace `summary` data with static mock values.
- Do not invent dashboard data that is not present on `DashboardSummary`.
- Do not deploy beta.
- Do not visually align `/projects`, `/budgets` or task routes in this dashboard branch.

## 5. Proposed future changes by file

This section describes a future implementation branch. This spec branch does not implement these changes.

### `src/components/screens/ReformistDashboardScreen.tsx`

Recommended scope: primary implementation file.

Allowed changes:

- Adjust layout classes and composition.
- Add local helper arrays/functions if they only derive display from `summary`.
- Add non-data visual wrappers using existing Tailwind tokens.
- Keep existing imports from UI primitives.
- Keep all current data derived from `summary`.

Recommended changes:

1. Root dashboard canvas
   - Add a local atmospheric container using absolute radial layers.
   - Keep `mx-auto`, `max-w-6xl`, responsive padding and AppShell context.

2. Hero command-center panel
   - Convert current hero to a more intentional command panel.
   - Add an overline such as `CENTRO DE MANDO`.
   - Use a clearer dashboard title such as `Panel operativo`.
   - Keep or move current descriptive copy.
   - Add nested quick-status cards using real `summary` values.

3. KPI grid
   - Keep the four current metrics.
   - Increase card polish:
     - `Card padding="md" shadow="none"`;
     - `relative overflow-hidden`;
     - subtle top/right glow for info cards if desired;
     - label as `text-overline`;
     - number as `font-num text-display`;
     - compact badge with `pill={false}` if visually better.

4. Active projects module
   - Keep `summary.activeProjects`.
   - Do not change list item identity or project status mapping.
   - Improve module header with overline + section heading.
   - Keep `Ver todas` secondary action.
   - Preserve progress calculation unless product changes it later.

5. Pending budgets module
   - Keep `summary.pendingBudgets`.
   - Use a denser nested-card style similar to reference category rows.
   - Use `font-num` for sale amounts.

6. Operational alerts module
   - Keep `summary.operationalAlerts`.
   - Keep alert mapping functions.
   - Consider replacing `ListItem` visual accent usage only if done locally and safely; otherwise leave component as-is.

### `src/components/ui/Card.tsx`

Recommended scope: no change for dashboard branch unless a minimal variant is approved.

Current component is sufficient:

- `rounded-lg`;
- semantic surfaces;
- `padding` scale;
- `shadow` options.

Potential later component improvement:

- add a `className`-only usage pattern in dashboard rather than changing `Card`.
- do not add a new `glow` or `hero` variant unless multiple screens need it.

### `src/components/ui/Badge.tsx`

Recommended scope: no required change.

Existing API supports:

- `tone`;
- `status`;
- `dot`;
- `pill`.

Use these existing props before editing the component.

### `src/components/ui/Button.tsx`

Recommended scope: no required change.

Existing primary/secondary/ghost variants are enough. If a CTA needs the reference shadow, apply `className="shadow-fab"` to the existing button only where it is the true primary dashboard action.

### `src/components/ui/ProgressBar.tsx`

Recommended scope: no required change.

Use existing tone behavior carefully:

- `info` for normal progress if the dashboard expresses progress as neutral/informational.
- `warning` only when the derived state is delayed/at risk.
- `danger` only when blocked/critical.
- `success` only when genuinely complete/healthy.

### `tailwind.config.js`

Recommended scope: no change.

Current semantic tokens are sufficient for the dashboard visual alignment.

### `src/app/globals.css`

Recommended scope: no change.

Do not move reference CSS globally. The dashboard can be aligned with existing tokens and Tailwind classes.

## 6. Acceptance checklist: visual

The future Openclaw implementation is acceptable when:

- The home dashboard still looks like the real command center, not a static gallery.
- The first viewport has a stronger visual hierarchy than current main.
- The dashboard background has subtle depth/atmosphere, without requiring AppShell changes.
- Hero panel feels like an operational command panel.
- KPI cards have clear overline, localized badge, large numeric value and helper text.
- Cards use dark surface layering: base, surface, raised.
- Nested cards use subtle borders and 16px radius.
- Blue is the only action/progress default.
- Green appears only for success/done/validated/money-like states.
- Amber appears only for delayed/pending/at-risk states.
- Red appears only for blockers/errors.
- No raw enum labels are visible.
- No phone-frame mockup appears in the real dashboard.
- Mobile layout remains single-column and readable.
- Desktop layout keeps the 4 KPI cards and two-column lower area.
- Empty states still render correctly.

## 7. Acceptance checklist: technical

The future Openclaw implementation is acceptable when:

- `src/app/page.tsx` is unchanged.
- `src/components/layout/AppShell.tsx` is unchanged.
- `src/app/layout.tsx` is unchanged.
- `package.json` is unchanged.
- `package-lock.json` is unchanged.
- `src/lib/**` is unchanged.
- Supabase files are unchanged.
- The dashboard still receives `summary: DashboardSummary`.
- `getDashboardSummary()` is still called by `/`.
- No `DesignReferenceScreen` import appears outside `/design-reference`.
- No new dependencies are added.
- No static replacement data is introduced.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run test` passes.
- `git diff --name-status main..HEAD` in the implementation branch contains only approved dashboard/UI files.

Suggested implementation diff limit:

- Prefer only `src/components/screens/ReformistDashboardScreen.tsx`.
- Allow UI primitive files only if a clear reusable primitive gap is found and reviewed first.

## 8. Recommended Openclaw implementation order

Openclaw should implement this in one narrow branch: `openclaw/ui-dashboard-visual-alignment`.

Order:

1. Confirm clean branch from latest `origin/main`.
2. Verify `/` still renders `ReformistDashboardScreen` before edits.
3. Edit only `src/components/screens/ReformistDashboardScreen.tsx` initially.
4. Add local atmospheric background wrapper inside the dashboard component.
5. Rework the hero into a command-center panel using existing summary fields.
6. Refine KPI cards using existing `metrics` array and `summary`.
7. Refine active projects, pending budgets and alerts modules without changing data logic.
8. Run `npm run lint`.
9. Run `npm run build`.
10. Run `npm run test`.
11. Smoke check:
    - `/`
    - `/design-reference`
    - `/projects`
    - `/budgets`
12. Confirm no route, AppShell, layout, package, Supabase or data files changed.

Stop conditions:

- If a desired visual effect requires changing AppShell, stop.
- If a desired visual effect requires package changes, stop.
- If a desired visual effect requires changing the dashboard summary contract, stop.
- If implementing a CTA requires a route/action not currently approved, stop.
- If the dashboard starts resembling a static mock instead of rendering `summary`, stop.

## 9. Final recommendation

Openclaw should not start broad UI implementation yet. The next safe implementation is a single-screen visual alignment of `ReformistDashboardScreen.tsx`, preserving the current `/` route and `DashboardSummary` data contract.

Codex recommendation:

1. Implement the dashboard visual alignment only.
2. Keep `/design-reference` as a comparison target.
3. Do not touch AppShell, layout, routes, packages, Supabase or service data.
4. After dashboard alignment passes lint/build/test, create a separate Codex spec for budgets or projects before further implementation.
