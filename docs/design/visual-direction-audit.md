# Visual Direction Audit — Reformando.app (beta)

**Date:** 2026-06-02

**Scope:** documentation-only audit of the current beta visual direction vs the **modern design system** artifacts under `docs/design/modern-source/`.

**Non-goals:** no code changes, no token changes, no component/layout edits, no Supabase/data/routes changes, no deploy.

## 1) Diagnosis (honest) of the current beta

### 1.1 What has been fixed technically (✅)

The migration work so far has achieved real technical convergence:

- Semantic Tailwind theme is integrated (semantic colors, borders, ring, radii, typography scale).
- Dark mode is enforced at `<html>`.
- Shared UI components (`Card`, `Badge`, `Button`, `ProgressBar`, `ListItem`, `EmptyState`, etc.) largely stopped depending on `bg-[var(--...)]` / `text-[var(--...)]` / `border-[var(--...)]`.
- The dashboard screen stopped using legacy CSS-var Tailwind arbitrary patterns and moved to semantic classes.

These are foundational prerequisites. They reduce token drift and make the codebase migratable.

### 1.2 What still looks visually wrong (❌)

Even with “correct tokens”, the beta reads **too technical / outline-first / monochrome** and does not match the “professional renovation management app” expectation.

**Observed problems (from current beta and the provided screenshot):**

- **Excess of borders / outline language**
  - Too many elements rely on visible 1px borders as the primary separator.
  - Borders look “white-ish” and uniform, so the UI feels like a wireframe rather than a designed product.

- **Lack of depth / elevation hierarchy**
  - Surfaces feel flat: raised vs surface vs base is not clearly legible.
  - Shadows/elevation are under-used compared to the modern reference direction.

- **Weak typographic hierarchy**
  - Headers, overlines, meta text, and values often share similar weight/contrast.
  - KPI values do not feel “hero” enough; labels do not create a clear scanning pattern.

- **Badges feel too flat / weak**
  - Status chips do not create enough semantic contrast.
  - They don’t feel like an intentional system element; they read as small grey/flat pills.

- **KPIs are not expressive enough**
  - KPIs are present but lack a clear visual rhythm: label → value → helper is not strongly encoded.
  - The KPI row/grid does not “lead” the screen; it blends with other cards.

- **Layout composition feels rigid**
  - The screen reads as repeated boxed blocks with equal treatment.
  - Hero, KPI, and content sections don’t feel like distinct layers of importance.

- **Color usage feels timid / under-deployed**
  - The system’s primary blue exists, but its “brand voice” is not strong.
  - The modern reference uses the blue not only as a token but as a compositional tool (kickers, CTAs, focal highlights).

### 1.3 Why “tokens correct” ≠ “design correct”

Tokens guarantee **consistent values**, not good visual design.

- A screen can use `bg-bg-surface`, `border-subtle`, `text-content-secondary` everywhere and still look like an **outline UI** if:
  - borders are the main separator,
  - surfaces lack contrast and depth,
  - typography does not encode hierarchy,
  - badges/KPIs are not composed like the reference system.

The modern artifacts (`galeria-pantallas.html`, ZIP components) encode **composition and geometry**, not just token names.

## 2) Comparison against the modern system (what we’re missing)

### 2.1 What is aligned (✅)

- Dark mode palette and semantic naming broadly match `SISTEMA-DE-DISENO.md`.
- Focus model is converging to ring-based.
- Shared components are moving away from arbitrary var-based Tailwind classes.

### 2.2 What contradicts / impoverishes the system (⚠️)

- **The reference gallery uses atmosphere and depth**:
  - `galeria-pantallas.html` applies a **subtle radial background glow** and strong frame shadow, which adds brand identity and depth.
  - It uses clear separation between **base/surface/raised** and meaningful contrast.

- **Outline-first vs surface-first**
  - The current beta relies heavily on borders; the reference uses borders as *subtle separators*, not the main visual language.

- **Component geometry + typography intent**
  - The reference components use overline patterns (`text-overline`, uppercase tracking) and numeric typography (`font-num`, `text-display`) as first-class hierarchy tools.
  - Current screens often approximate this, but not consistently/compositionally.

### 2.3 “Too literal” interpretation (where the migration drifted)

- Migrating `border-[var(...)]` → `border-subtle` everywhere is technically correct, but can produce a **uniform outline** look when used as the dominant separator.
- Migrating screens “mechanically” (string replacement) tends to preserve legacy composition (many boxes) rather than adopting the **modern layout rhythm**.

### 2.4 Components that should be replaced by ZIP versions (vs 계속 adapting)

Based on the implementation spec and the modern source:

- The safest path to the intended look is to **prefer ZIP component composition** over incremental adaptation once foundation is stable.
- Candidates to treat as “replace from ZIP (or faithful port)” in Phase 3+:
  - `MetricCard` and KPI patterns (ZIP provides a distinct KPI composition).
  - `Badge` styling (ZIP has stronger overline + dot option and clearer semantic variants).
  - `Button` variants and sizing (ZIP encodes focus/hover and geometry more decisively).
  - Any missing atoms present in ZIPs (Checkbox, etc.) once needed.

## 3) Direction decision (choose a path)

Evaluate options:

### A) Continue migrating tokens screen-by-screen
**Pros:** safe, incremental, low merge risk.
**Cons:** high probability of ending with a **technically semantic** UI that still looks wrong (because composition stays legacy).

### B) Rebuild each screen using modern components (ZIP / faithful ports)
**Pros:** highest chance to reach the **actual visual direction**.
**Cons:** requires explicit screen work; changes are more visible.

### C) Create a parallel UI layer (`src/components/modern-ui`) and migrate screens to it
**Pros:** isolates visual redesign from legacy UI, allows iterative refinement without breaking existing screens.
**Cons:** temporary duplication cost; needs clear migration rules and an endgame.

### D) Partially revert visual migration and redo with a stricter guide
**Pros:** can reduce current outline-heavy look quickly.
**Cons:** risky, demoralizing, can reintroduce token drift.

**Recommendation:** **Option C (parallel `modern-ui`)**

Justification:

- We need to stop pretending mechanical token migration will yield the intended look.
- A parallel layer lets us implement the modern system *as designed* (ZIP patterns, composition, depth) while preserving current flows.
- It reduces churn in `src/components/ui/*` which has already stabilized and is now shared across screens.

## 4) Visual correction proposal for the dashboard (no code)

Target: align with `galeria-pantallas.html` and `SISTEMA-DE-DISENO.md` principles.

### 4.1 Background
- Base should feel less “flat black”. Use subtle atmosphere (as per gallery):
  - a faint radial blue glow (primary) and a second faint green glow (success) in the page background.
  - keep it subtle; avoid gimmick.

### 4.2 Header / hero
- Hero needs a stronger hierarchy:
  - kicker/overline in `text-primary-300` (or similar accent),
  - title with clear weight and spacing,
  - body copy clearly secondary.
- Reduce hard borders; use surface contrast and spacing.

### 4.3 KPI cards
- KPIs should be the “scan line” of the dashboard:
  - overline label (uppercase + tracking),
  - large numeric value in `font-num` (Space Grotesk),
  - helper line tertiary,
  - status chip that is visually strong enough (background + dot option).
- Consider one “active” KPI (blue surface) to guide focus (as the modern MetricCard guidance suggests).

### 4.4 Content cards
- Active projects and pending budgets should use:
  - surface-first styling (`bg-bg-surface` / `bg-bg-raised`) and **subtle** borders.
  - clear row density rules (consistent paddings).

### 4.5 Badges
- Badge variants should be more assertive:
  - `info: bg-primary-900 text-primary-100`
  - `warning: bg-warning-900 text-warning-100`
  - `danger: bg-danger-900 text-danger-100`
  - optional dot and overline typography.

### 4.6 Buttons
- Primary actions should feel like CTAs:
  - primary blue with hover state,
  - secondary/ghost should not be “outline-first”.

### 4.7 Progress bar
- Track should be very subtle; fill should be the main signal.
- Keep warning for real warnings; do not use success green as progress.

### 4.8 Bottom navigation
- Ensure it doesn’t read as a thick outlined bar.
- Use base/surface layering and subtle separators.

## 5) Blocking human decisions (need answers)

1. **Reference fidelity:** should the dashboard match `galeria-pantallas.html` literally, or is it only conceptual?
2. **Borders vs depth:** do we want visible borders on cards, or primarily surface contrast + occasional shadow?
3. **Brand presence:** should primary blue be used more prominently (kickers, CTA emphasis, active KPI), or remain restrained?
4. **KPI module style:** compact cards vs stronger modules (active card, badge dot, typography)?
5. **Navigation paradigm:** keep the bottom nav as-is, or adopt the modern nav pattern from the gallery/ZIP?
6. **Final reference artifact:** which single mock/screenshot is the “acceptance truth” for Phase 3 dashboard?

## 6) Corrected implementation plan (small branches, visual acceptance)

### Branch 1 — Modern UI foundation layer (parallel)
**Goal:** create `src/components/modern-ui/*` with faithful ports of the ZIP components (or direct import if feasible).
- Files: `src/components/modern-ui/{Card,Badge,Button,ProgressBar,MetricCard}.tsx` (+ `cn`/types as needed)
- Acceptance:
  - visual match to ZIP + `galeria-pantallas.html` patterns,
  - no changes to routes/data/Supabase.

### Branch 2 — Dashboard rebuild using modern-ui
**Goal:** rebuild `ReformistDashboardScreen.tsx` using `modern-ui` components and the intended composition.
- Files: `src/components/screens/ReformistDashboardScreen.tsx`
- Acceptance:
  - KPI hierarchy reads correctly,
  - badges have sufficient presence,
  - reduced outline feel; depth restored,
  - localized labels.

### Branch 3 — AppShell/header/nav refinement
**Goal:** align layout chrome (header + bottom nav) with the chosen modern pattern.
- Files: `src/components/layout/AppShell.tsx`
- Acceptance:
  - chrome feels like part of the product, not a frame of borders.

### Branch 4 — Remaining screens (projects/budgets/tasks)
**Goal:** migrate screen-by-screen to modern-ui + correct composition.
- Files: `src/app/projects/*`, `src/app/budgets/*`, tasks screens.
- Acceptance:
  - each screen visually matches agreed reference.

---

## Appendix — Artifacts consulted

- `docs/design/modern-source/SISTEMA-DE-DISENO.md`
- `docs/design/modern-source/galeria-pantallas.html`
- `docs/design/modern-source/tokens.css`
- `docs/design/modern-source/tokens.json`
- `docs/design/modern-source/tailwind.config.js`
- `docs/design/implementation-spec/*`
- `docs/design/style-export/*`
- Current code snapshot:
  - `src/app/globals.css`
  - `tailwind.config.js`
  - `src/app/layout.tsx`
  - `src/components/layout/AppShell.tsx`
  - `src/components/screens/ReformistDashboardScreen.tsx`
  - `src/components/ui/*`
