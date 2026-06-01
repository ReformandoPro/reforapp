# Design system intake
## Context
The design team provided two design asset packages for Reformando.app:
1. A Next/App Router component package with reusable UI components.
2. A static HTML/design-token package with visual guidelines, tokens and screen previews.
This document records the useful parts of that material as a stable project reference before adapting production UI components.
## Received assets
### Component package
The component package includes a Next.js/App Router oriented component set, originally delivered in JavaScript/JSX and Tailwind.
Available components include:
- `Card`
- `Button`
- `Badge`
- `Input`
- `ListItem`
- `TabBar`
- `MetricCard`
- `ProgressBar`
- `Timeline`
- `Avatar`
- `Checkbox`
- `SegmentedControl`
- `Donut`
- `GuildChip`
The package describes:
- Next.js 13+ App Router compatibility.
- Tailwind-based styling.
- `next/font` usage.
- Dark mode as a first-class visual target.
- Server Components by default, with small `"use client"` islands only where interaction is needed.
- Inter for UI text and Space Grotesk for highlighted numeric values.
- A suggested `@/ui` alias.
### Static design package
The static package includes:
- `galeria-pantallas.html`
- `SISTEMA-DE-DISENO.md`
- `tokens.css`
- `tokens.json`
- `tailwind.config.js`
The repository already stores extracted source references under `docs/design/source-*`.
## Adoptable design principles
The following principles should guide future UI work:
1. Dark mode is the base visual theme.
2. Color communicates meaning, not decoration.
3. Blue is reserved for primary actions, information and progress.
4. Green is reserved for money, confirmation, validation and success.
5. Red is reserved for errors, destructive states or blocking problems.
6. Amber is reserved for warnings, pending attention and risk.
7. Trades/guilds should not be color-coded by default.
8. Trade differentiation should use text, labels or icons rather than arbitrary color.
9. UI should remain sober, operational and dense enough for construction-site workflows.
10. Components should be adapted progressively instead of copied wholesale.
## Core tokens from the design material
### Colors
Base surfaces:
- `bg/base`: `#0A0F1A`
- `bg/surface`: `#0E1626`
- `bg/surface-raised`: `#162132`
- `bg/overlay`: `#1C2940`
Text:
- `text/primary`: `#F4F7FC`
- `text/secondary`: `#A8B2C4`
- `text/tertiary`: `#6B7689`
- `text/disabled`: `#4A5366`
Semantic colors:
- primary blue: `#2D7FF9`
- success/money green: `#1D9E75`
- warning amber: use for warnings and pending states
- danger red: use for errors, destructive actions and blockers
### Typography
- Inter: general UI text.
- Space Grotesk: highlighted metrics, figures and numeric emphasis.
### Radius
- Buttons: approximately `12px`.
- Cards: approximately `16px`.
- The intended feel is modern and sober, not playful.
## Current repository state
The current app already has:
- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/ErrorState.tsx`
- `src/components/ui/LoadingState.tsx`
The current app also already has design references:
- `docs/design/hermes-ui-guidelines.md`
- `docs/design/source-readme.md`
- `docs/design/source-sistema-de-diseno.md`
- `docs/design/source-tokens.css`
- `docs/design/source-tokens.json`
- `docs/design/source-tailwind.config.js`
Current differences to review before adoption:
- The app currently uses `Geist` and `Geist_Mono` in `src/app/layout.tsx`, while the design material recommends Inter and Space Grotesk.
- The app currently has minimal CSS variables in `src/app/globals.css`.
- Current UI components are TypeScript and should remain TypeScript.
- The design component package was delivered in JavaScript/JSX and should be treated as visual/reference material unless converted.
## Recommendation
Do not copy the external component library directly into the production app.
Instead:
1. Keep this design intake as reference.
2. Audit current UI components against the design material.
3. Adapt existing TypeScript components progressively.
4. Preserve the current architecture and service boundaries.
5. Keep UI components generic and data-agnostic.
6. Use the design system as the visual target for future screens.
7. Ask the design team for TypeScript/TSX versions when possible to reduce integration ambiguity.
## Recommended next phases
### Phase 1: Design intake
Completed by this document.
### Phase 2: Component audit
Compare existing components with the design material:
- `Card`
- `Button`
- `Badge`
- `EmptyState`
- `ErrorState`
- `LoadingState`
Output should be a short document or diff proposal, not immediate broad visual changes.
### Phase 3: Token alignment
Decide whether to update:
- `src/app/globals.css`
- Tailwind theme configuration
- typography in `src/app/layout.tsx`
This should be done in a small, isolated branch.
### Phase 4: UI base adaptation
Adapt existing UI components in TypeScript.
Suggested priority:
1. `Card`
2. `Button`
3. `Badge`
4. empty/loading/error states
5. list item / metric card primitives if needed
### Phase 5: Future screen work
Build future UI, including tasks, incidents and materials, using the aligned component base rather than ad hoc styling.
## Open decisions
- Whether to replace Geist with Inter and Space Grotesk.
- Whether to introduce a formal `MetricCard` component.
- Whether to introduce a reusable `ListItem` component.
- Whether to create a dedicated `src/components/ui` design-system structure or keep current simple components.
- Whether the external components should be converted to `.tsx` by design before implementation.
