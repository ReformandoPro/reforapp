# STYLE REVIEW PACKAGE — Reformando.app

Branch: `openclaw/ui-style-review-package`

## 1) Purpose (non-technical)
This package is a **shared review bundle** so Design / Product / Direction / Development can agree on a **final visual specification** before any further UI iterations.

**Goal:** stop “trying styles” in production code. First we align on the visual system; then we implement.

## 2) What’s included
This folder is a curated index of what already exists in the repo:
- The modern design system reference artifacts (tokens, docs, HTML gallery, component ZIPs)
- A repo-derived inventory of:
  - modern components available in ZIPs
  - current app UI components
  - where styles/tokens are used in screens
- A token comparison and known integration conflicts
- A dashboard style audit (for the *modern rebuild* branch state)

## 3) What’s NOT included
- No runtime changes
- No UI changes
- No token behavior changes
- No Supabase/data changes
- No deploy/beta changes

## 4) Key links inside the repo
### Modern design system (source of truth)
- `docs/design/modern-source/SISTEMA-DE-DISENO.md`
- `docs/design/modern-source/tokens.css`
- `docs/design/modern-source/tokens.json`
- `docs/design/modern-source/galeria-pantallas.html`
- `docs/design/modern-source/componentes-tsx-src.zip`
- `docs/design/modern-source/componentes-next.zip`

### Export / inventory (generated)
- `docs/design/style-export/style-assets-export.md` (main export report)
- `docs/design/style-export/token-comparison.md`
- `docs/design/style-export/modern-components-inventory.md`
- `docs/design/style-export/app-components-inventory.md`
- `docs/design/style-export/screens-style-inventory.md`
- `docs/design/style-export/current-dashboard-style-audit.md`

## 5) Decisions required from humans (before more implementation)
1. **Integration strategy**
   - Keep current Tailwind v4 + CSS var arbitrary values approach, OR
   - Move towards the modern Tailwind semantic config model.

2. **Typography strategy**
   - When/how Inter + Space Grotesk will be loaded in `layout.tsx` (and how that affects the entire app).

3. **Component convergence**
   - Which components should be replaced by modern equivalents, which should be adapted, and which should remain.

4. **Dashboard/KPI language**
   - Confirm the definitive KPI visual language (active card vs accent vs badges) backed by the design spec.

## 6) Recommendation: what NOT to do next
- Do **not** iterate UI styles with ad-hoc patches.
- Do **not** copy ZIP components blindly.
- Do **not** rename/replace tokens that have type mismatches (border shorthand vs color, focus ring shadow vs color) without an agreed plan.

## 7) Suggested review flow
1. Design + Product review `SISTEMA-DE-DISENO.md` and the HTML gallery.
2. Dev reviews token conflicts and integration constraints.
3. Agree on a single integration strategy + typography plan.
4. Write down the final spec decisions (this becomes the implementation checklist).
