# Implementation Plan

## Core rule

The HTML screens are reference visual and functional material. They must not be mounted directly as product runtime and must not replace real routes with static mockups.

## Phase 1: document tokens and patterns

Suggested branch:

- `openclaw/html-reference-token-consolidation`

Goal:

- convert this intake into reviewed token/pattern decisions

Probable files:

- `docs/design/html-screen-reference/**`
- possibly follow-up docs in `docs/design/`

Acceptance criteria:

- shared pattern names agreed
- token gaps identified
- no runtime changes

Risks:

- over-documenting without converging on implementable components

Rollback:

- docs-only, trivial rollback

What not to do:

- no runtime token migration yet

## Phase 2: implement reusable base components

Suggested branch:

- `openclaw/ui-component-foundation-from-html-reference`

Goal:

- build or refine reusable components from repeated patterns

Probable files:

- `src/components/ui/**`
- possibly local screen helper components

Acceptance criteria:

- no route replacement
- no static HTML pasted into screens
- components validated against multiple HTML references

Risks:

- inventing too many variants
- rebuilding a parallel component system

Rollback:

- revert shared component branch if API becomes unstable

What not to do:

- no redesign of all routes at once

## Phase 3: apply to one small real screen

Suggested branch:

- `openclaw/ui-small-screen-alignment`

Target candidate:

- notifications
- documents
- or a non-critical detail list

Goal:

- prove the component/pattern translation on a contained real route

Acceptance criteria:

- route remains data-safe
- no global visual regressions
- lint/build/test pass

Risks:

- choosing a screen too central too early

Rollback:

- revert one route branch only

What not to do:

- no dashboard-first if base components are still unstable

## Phase 4: apply to `/projects`

Suggested branch:

- `openclaw/ui-projects-alignment`

Goal:

- align `/projects` and then `/projects/[id]` toward the project/detail HTML references

Probable files:

- `src/app/projects/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/components/screens/ProjectOverviewScreen.tsx`

Acceptance criteria:

- real routes preserved
- no data contract changes just for visuals
- styling aligned with reference patterns

Risks:

- overfitting to a static tab mock before task/material routes exist

Rollback:

- revert route-specific styling branch

What not to do:

- do not bypass AppShell
- do not replace route content with a static HTML mock

## Phase 5: apply to budgets and purchases

Suggested branch:

- `openclaw/ui-budgets-purchases-alignment`

Goal:

- bring `budgets` and upcoming purchase screens into the same system

Probable files:

- existing budget screens
- future purchase route screens
- shared budget line and grouped-list components

Acceptance criteria:

- budget hierarchy matches reference
- purchase list patterns stay neutral for gremios
- no semantic color misuse

Risks:

- purchases may outrun backend readiness
- budget editing may need more product decisions than the HTML suggests

Rollback:

- keep budget and purchase branches separate if needed

What not to do:

- do not fake data richness with static profitability or purchase totals

## Phase 6: portal cliente

Suggested branch:

- `openclaw/ui-client-portal-foundation`

Goal:

- implement client-specific navigation and status views after auth/data boundaries exist

Probable files:

- future client routes
- role-specific navigation and status cards

Acceptance criteria:

- client sees only allowed data
- visual grammar remains consistent with reformista app
- role-specific route isolation is preserved

Risks:

- client visibility and permissions are a data problem first, UI problem second

Rollback:

- disable client route while keeping shared components

What not to do:

- no client portal before auth and project scoping exist

## Safe sequence recommendation

1. Consolidate design docs from this HTML library.
2. Build base reusable components.
3. Prove them on one low-risk real screen.
4. Apply to `/projects`.
5. Apply to budget and purchase flows.
6. Only then expand to portal cliente.
