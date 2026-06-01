# Component Audit

## Scope

This audit compares the current UI primitives in the repository against the documented design system reference stored in:

- `docs/design/design-system-intake.md`
- `docs/design/hermes-ui-guidelines.md`
- `docs/design/source-sistema-de-diseno.md`
- `docs/design/source-tokens.css`
- `docs/design/source-tokens.json`
- `docs/design/source-tailwind.config.js`

Audited components:

- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/ErrorState.tsx`
- `src/components/ui/LoadingState.tsx`

This document is intentionally non-implementation. It records current state, gaps and recommended sequencing before any UI base adaptation.

## Design system baseline

The current documented design target establishes:

- dark mode as the default theme;
- semantic color discipline;
- blue `#2D7FF9` as primary/info/progress;
- green `#1D9E75` only for money/success/confirmation;
- amber only for warning/pending;
- red only for error/destructive;
- sober radii (`~12px` buttons, `~16px` cards);
- Inter for UI text and Space Grotesk for highlighted numbers;
- dark layered surfaces and subtle borders instead of light cards;
- neutral guild chips without color-coding by trade.

## Component audit

### 1. Card

**Current state**

`Card.tsx` is a simple layout wrapper. It provides a reusable container but still reflects the current repo visual baseline rather than the target dark design system.

**Main differences vs design system**

- likely still tied to current light/minimal runtime surfaces rather than dark layered surfaces;
- does not yet clearly encode `bg/surface`, `bg/surface-raised` and subtle border hierarchy from the new system;
- may not yet use the target card radius consistently (`~16px`);
- typography and spacing are still inherited from current repo defaults, not from the documented system;
- visual density likely remains generic rather than tuned for operational dashboards and work-management screens.

**Adaptation risk**

- **Medium**

Reason: `Card` is foundational and widely reused, but conceptually straightforward to align once tokens and global surfaces are decided.

---

### 2. Button

**Current state**

`Button.tsx` already centralizes button styling and behavior, so it is structurally a good candidate for controlled adaptation.

**Main differences vs design system**

- may not yet enforce semantic color discipline strictly enough;
- primary/secondary/destructive semantics may not fully align with the new blue/green/red rules;
- border radius may not yet match the target button radius (`~12px`);
- dark mode styling may still be weaker than the documented dark-first system;
- focus, hover and disabled states may need normalization against the design tokens.

**Adaptation risk**

- **Medium**

Reason: buttons are globally visible and sensitive, but the component boundary is already clear.

---

### 3. Badge

**Current state**

`Badge.tsx` likely handles compact status labels, but it predates the stricter semantic system now documented.

**Main differences vs design system**

- semantic badge mapping may not yet follow the four-state system cleanly;
- background/text/border pairing may not yet reflect the documented dark badge treatment;
- risk of decorative color usage if badge variants are too loose;
- guild/trade chips should be neutral, and the current badge abstraction may not yet separate semantic status badges from neutral taxonomy chips.

**Adaptation risk**

- **Medium**

Reason: visually small but semantically important; mistakes here can reintroduce color misuse quickly.

---

### 4. EmptyState

**Current state**

`EmptyState.tsx` exists as a reusable pattern and likely already supports title/description messaging.

**Main differences vs design system**

- may not yet sit on the documented dark surface hierarchy;
- may not yet use consistent text hierarchy (`primary`, `secondary`, `tertiary`);
- any icon or accent color may need normalization to avoid decorative semantic misuse;
- likely needs tighter alignment with spacing, density and CTA treatment under the new system.

**Adaptation risk**

- **Low to Medium**

Reason: usually isolated and easy to restyle once tokens and Button/Card are aligned.

---

### 5. ErrorState

**Current state**

`ErrorState.tsx` provides a dedicated reusable state pattern, which is positive for consistency.

**Main differences vs design system**

- red must be reserved for true error/destructive semantics only;
- background, border and text treatment may need alignment with `danger` tokens in dark mode;
- CTA and retry styling may need coordination with the unified Button system;
- should avoid excessive visual aggression while remaining clearly semantic.

**Adaptation risk**

- **Low to Medium**

Reason: structurally simple, but semantically sensitive.

---

### 6. LoadingState

**Current state**

`LoadingState.tsx` exists as a reusable state component.

**Main differences vs design system**

- loading should likely align with primary/info blue, not arbitrary accent color;
- spacing and skeleton/indicator density may need adaptation to the target dark surfaces;
- typography and supporting labels may still reflect current repo defaults rather than the new system.

**Adaptation risk**

- **Low**

Reason: simpler than interactive components and easier to align after tokens are settled.

## Cross-cutting differences vs system

Across the audited components, the main gaps are:

### Dark mode base

The design system is explicitly dark-first. The current app runtime still uses a much simpler global background/foreground setup and older font choices.

### Surface and text tokens

The new system expects deliberate use of:

- `bg/base`
- `bg/surface`
- `bg/surface-raised`
- `bg/overlay`
- `text/primary`
- `text/secondary`
- `text/tertiary`
- `text/disabled`

Current components are not yet guaranteed to map cleanly onto that token model.

### Semantic color discipline

The incoming system is much stricter than the current baseline. This especially affects:

- `Button`
- `Badge`
- `ErrorState`
- any future guild-related UI

### Radius consistency

The target system is sober and consistent:

- buttons around `12px`
- cards around `16px`

Current components should be normalized together rather than one by one in isolation.

### Typography

The design system targets:

- Inter for UI
- Space Grotesk for highlighted numeric values

The app currently still uses Geist/Geist Mono in layout, so any component-level alignment without a typography decision would remain partial.

### Visual density

The new system is aimed at operational construction workflows: dense but readable. Existing components may still be more generic than specifically tuned to that use case.

## Recommended adaptation order

### Recommendation on sequencing

**Tokens/global styles should be decided before broad component adaptation.**

Reason:

- adapting `Card`, `Button` and `Badge` without stable tokens would create rework;
- typography, surfaces and semantic color rules are cross-cutting foundations;
- state components (`EmptyState`, `ErrorState`, `LoadingState`) depend on the same visual foundations.

### Recommended order

1. Decide token/global-style alignment strategy.
2. Adapt `Card`, `Button` and `Badge` together.
3. Then adapt `EmptyState`, `ErrorState` and `LoadingState`.
4. Only after that, build new screens or larger UI sections.

## Final recommendation

### Should there be a tokens phase first?

**Yes.**

A token/global-style phase should happen before broad component adaptation.

### Should Card, Button and Badge be adapted together?

**Yes.**

They form the minimal UI base and should be aligned in the same controlled phase.

### Should the team wait for TSX design components?

**Preferably yes, if the design team can provide TSX-ready source or clearer implementation guidance.**

However, work does not need to stop completely. The current repo can proceed with a documented audit and then a controlled adaptation of internal TypeScript components using the design system as reference.

## Risk summary by component

- `Card`: **Medium**
- `Button`: **Medium**
- `Badge`: **Medium**
- `EmptyState`: **Low/Medium**
- `ErrorState`: **Low/Medium**
- `LoadingState`: **Low**

## Recommended next step

Before touching runtime UI, open a small dedicated phase to decide:

- whether `globals.css` and typography are updated first;
- whether the Tailwind/runtime token bridge is introduced first;
- whether `Card`, `Button` and `Badge` are adapted in one batch.

That should be the next intentional step before any new UI implementation work.
