# Token Extraction

## Global reading

The HTML package defines a stable token family embedded in each screen. It is close to the visual direction already discussed in the repo and more consistent than the old rescue branch.

## Core colors

Base surfaces repeated across screens:

- `#0A0F1A` as `bg-base`
- `#0E1626` as `bg-surface`
- `#162132` as `bg-raised`
- `#1C2940` as `bg-overlay` in several screens

Primary text:

- `#F4F7FC`

Secondary text:

- `#A8B2C4`
- `#6B7689`
- `#4A5366` for disabled or lower emphasis

## Semantic color families

Blue:

- `#C7DEFD`
- `#6FA8F6`
- `#2D7FF9`
- `#1E66D6`
- `#1850AB`
- `#0C2F6B`

Use:

- primary CTA
- active states
- current progress
- focus ring
- actionable icon tiles
- info/current markers

Green:

- `#9FE1CB`
- `#5DCAA5`
- `#1D9E75`
- `#0F6E56`
- `#04342C`

Use:

- money received
- net benefit
- validated skills
- completed milestones
- done check markers

Red:

- `#F09595`
- `#E88A8A`
- `#E24B4A`
- `#A32D2D`
- `#501313`

Use:

- destructive account/session actions
- true error state
- destructive notification badge only where necessary

Amber:

- `#FAC775`
- `#EF9F27`
- `#412402`

Use:

- pending review
- warning
- documents pending signature
- delayed/provisional state

## Surfaces

Observed surface grammar:

- base app shell in near-black
- surface card for first layer
- raised surface for nested metric/input/list elements
- occasional light surface in purchases for emphasis, not as default theme

Do not generalize white cards into the system. The white purchase CTA/search treatment is a local exception, not the global product language.

## Borders and overlays

Repeated border tokens:

- `rgba(255,255,255,0.06)` subtle
- `rgba(255,255,255,0.10)` default
- `rgba(255,255,255,0.16)` strong

Guild chips:

- neutral brown/stone tinted overlays:
  - `rgba(136,135,128,0.18)`
  - `rgba(136,135,128,0.28)`

## Shadows

Repeated patterns:

- device/screen frame shadow: `0 24px 60px rgba(0,0,0,0.5)`
- primary CTA shadow: `0 8px 24px rgba(45,127,249,0.35)`
- some focused surfaces with blue ring or glow
- inset blue glow on reforma schema canvas

Guidance:

- keep the heavy outer frame shadow only for reference/mock framing
- product runtime should use the CTA glow more than universal card shadows

## Radius

Repeated values:

- `28px` for phone/screen frame
- `16px` for large cards
- `14px` for grouped modules and segmented shells
- `12px` for buttons, inputs, icon tiles, nested metrics
- `10px` and `8px` for small tiles and badges
- `999px` for pills, toggles and bars
- `50%` for circular icons and avatars

Recommended interpretation:

- product cards: `16px`
- nested surfaces: `12px`
- pills/badges: fully rounded
- phone frame radius should stay in reference/demo contexts only

## Spacing

Observed rhythm:

- outer padding around mobile screens: `16px`
- card padding commonly `16px`, `18px`, `20px`, `22px`
- tight lists use `10px` to `14px` vertical spacing
- grouped section gaps usually `18px` to `28px`

Recommendation:

- avoid adding a large new spacing scale yet
- normalize around `12 / 16 / 20 / 24 / 28`

## Typography

Fonts:

- `Inter` for UI
- `Space Grotesk` for numeric emphasis

Usage:

- Space Grotesk for totals, KPI values, percentages, money, sqm
- Inter for body, labels, chips, buttons, row text

What already exists in repo:

- the design system already references Inter + Space Grotesk

What this package confirms:

- the HTML screens consistently reinforce that split

## Gradients and radial backgrounds

Observed:

- avatar and placeholder gradients
- radial dot grid in `esquema_reforma`
- green radial glow in profitability hero
- before/after placeholder image gradients

Recommendation:

- add local atmospheric backgrounds only where they communicate module intent
- avoid moving all gradients into global surfaces

## Semantic color usage discipline

Green:

- should remain reserved for money, validated, done, success
- should not become a general progress color for in-course work

Red:

- should remain limited to destructive actions and real error states
- should not label a trade/gremio

Blue:

- should remain the default action/info/current-progress accent
- should carry most active UI emphasis

Amber:

- should signal pending or caution, not hard failure

## Tokens already present in repo

Likely already aligned or partially aligned:

- dark base/surface tokens
- semantic primary/success/warning/danger families
- Inter + Space Grotesk
- semantic borders
- rounded card/button system

This package reinforces those choices rather than introducing a competing token system.

## Tokens missing or under-specified

Worth documenting later in runtime token work:

- neutral guild chip tokens
- overlay surface token for tabs/footers
- dedicated CTA shadow token
- localized glow tokens for hero modules
- media placeholder gradient tokens

## Tokens that should not be added yet

Do not add yet:

- per-gremio color palette
- full chart palette beyond blue family plus semantic green
- broad phone-frame tokens for runtime routes
- many one-off measurement/workflow-specific tokens before components exist

The priority is still semantic stability, not token explosion.
