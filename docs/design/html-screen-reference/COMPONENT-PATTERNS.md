# Component Patterns

## Global observation

The 19 HTML screens are not 19 unrelated mocks. They are built from a stable component grammar:

- dark mobile-first shell
- dense header rows
- layered cards
- numeric emphasis with Space Grotesk
- semantically restricted accent colors
- grouped list modules
- persistent bottom navigation

These patterns should become reusable React components, not copied layouts.

## App shell mobile/web

Appears in:

- almost every screen except the split error/offline comparison

Problem solved:

- consistent mobile framing, contained page height, anchored footer nav

Future React components:

- `MobileScreenFrame`
- `ScreenHeader`
- `BottomTabBar`

Relevant tokens:

- `bg-base`
- `border-subtle`
- `radius-28`
- deep outer shadow

Implementation risks:

- applying phone-frame chrome directly to desktop real routes would make product feel like a prototype
- should stay a composition reference, not a mandatory shell for all runtime pages

## Headers

Appears in:

- dashboard
- project detail
- documents
- notifications
- purchases
- profitability
- settings

Problem solved:

- compact top navigation with back, title, subtitle and contextual actions

Future React components:

- `PageHeader`
- `BackHeader`
- `TitleWithMeta`
- `HeaderIconButton`

Relevant tokens:

- circular icon button surfaces
- title/subtitle hierarchy
- secondary icon tint

Implementation risks:

- mixing too many one-off header variants
- route-specific hacks instead of composable slots

## Tab bars

Appears in:

- project detail tabs
- bottom client/professional navigation
- settings bottom tabs

Problem solved:

- scoped navigation without leaving the current context

Future React components:

- `SegmentedTabs`
- `BottomNavigation`
- `PillTabs`

Relevant tokens:

- `bg-surface`
- `radius-14`
- active blue state
- neutral inactive copy

Implementation risks:

- encoding business logic into presentational tab components

## Cards

Appears in:

- all major flows

Problem solved:

- chunking dense operational data into readable surfaces

Future React components:

- `SurfaceCard`
- `RaisedCard`
- `ModuleCard`
- `SummaryCard`

Relevant tokens:

- `bg-surface`
- `bg-raised`
- `border-subtle`
- `radius-16`

Implementation risks:

- recreating many card variants instead of extending the current `Card`

## KPI cards

Appears in:

- dashboard
- profitability
- closeout
- client progress cards

Problem solved:

- fast scan of numeric state

Future React components:

- `KpiCard`
- `MetricSplitCard`
- `ProgressMetricCard`

Relevant tokens:

- `font-num`
- large numeric scale
- semantic badge accents

Implementation risks:

- overusing green or blue without semantic discipline

## Forms

Appears in:

- new budget
- room measurements
- linear measurement
- settings/preferences

Problem solved:

- controlled entry of structured obra and budget data

Future React components:

- `FormSection`
- `FormField`
- `InlineMetricField`
- `StickyFormFooter`

Relevant tokens:

- `radius-12`
- dark input surface
- blue focus ring

Implementation risks:

- porting static form spacing without adapting to real validation and error states

## Inputs

Appears in:

- new budget
- room measurements
- linear measurement
- purchases search

Problem solved:

- high-contrast data entry in dark UI

Future React components:

- `TextField`
- `NumberField`
- `SearchField`
- `UnitInput`

Relevant tokens:

- blue focus shadow
- subtle border
- Space Grotesk for numeric values

Implementation risks:

- introducing custom inputs with inconsistent focus/accessibility

## Selectors

Appears in:

- surface setup
- experience segment
- tabbed project detail

Problem solved:

- explicit choice between a few modes or states

Future React components:

- `ChoiceCard`
- `SegmentControl`
- `ModeSelector`

Relevant tokens:

- active blue background
- raised inactive surfaces

Implementation risks:

- state explosion if every selector becomes custom

## Guild chips

Appears in:

- purchase list
- budget lines
- client room breakdown
- dashboard project snippets

Problem solved:

- identify gremios without abusing semantic warning/danger colors

Future React components:

- `GuildChip`

Relevant tokens:

- neutral guild background
- neutral guild border
- uppercase small label

Implementation risks:

- reintroducing per-gremio arbitrary colors and breaking semantic grammar

## Status badges

Appears in:

- documents
- purchases
- notifications
- project states
- timeline/current-phase markers

Problem solved:

- semantic visibility of state

Future React components:

- `StatusBadge`
- `StatusDot`
- `UnreadIndicator`

Relevant tokens:

- blue for current/info/action
- green for money/completed/validated
- amber for warning/pending
- red only for destructive/error

Implementation risks:

- blending guild chips and semantic badges into one component

## Empty states

Appears in:

- project tabs example

Problem solved:

- preserve structure when a module has no content yet

Future React components:

- `EmptyStatePanel`
- `EmptyTabState`

Relevant tokens:

- muted icon circle
- CTA secondary/primary pairing

Implementation risks:

- generic empty states that ignore the module context

## Errors / offline

Appears in:

- `estado_error_sin_conexion_rediseno_sistema.html`

Problem solved:

- distinguish neutral connectivity failure from true destructive error

Future React components:

- `OfflineState`
- `ErrorStatePanel`

Relevant tokens:

- neutral blue retry
- destructive red only for real failure

Implementation risks:

- using danger styling for all failure states

## Timelines

Appears in:

- client welcome
- gallery progression
- closeout payment milestones

Problem solved:

- communicates sequence and progress over time

Future React components:

- `MilestoneTimeline`
- `PhotoTimeline`
- `PaymentTimeline`

Relevant tokens:

- vertical connectors
- done/current/pending node states

Implementation risks:

- one timeline component may be too generic; better shared primitives plus module-specific wrappers

## Galleries

Appears in:

- gallery advance
- portal client welcome
- portal by rooms

Problem solved:

- visual proof of progress

Future React components:

- `BeforeAfterCard`
- `GalleryGrid`
- `PhotoFilterBar`

Relevant tokens:

- image badges
- rounded media frames
- muted placeholders for unloaded media

Implementation risks:

- demo gradients must become real media states with loading/fallback logic

## Documents

Appears in:

- documents project

Problem solved:

- grouped file access with metadata and action affordances

Future React components:

- `DocumentGroup`
- `DocumentRow`
- `DocumentSummaryCard`

Relevant tokens:

- file icon tiles
- download button circle
- signature warning badge

Implementation risks:

- storage and permission model are more complex than the mock suggests

## Shopping / purchase lists

Appears in:

- purchase list
- purchase management

Problem solved:

- bridge task/material planning with procurement

Future React components:

- `GroupedChecklist`
- `PurchaseOrderList`
- `MaterialRow`

Relevant tokens:

- neutral group chips
- compact rows
- sticky CTA/footer

Implementation risks:

- hard to implement safely before data model for materials and purchases exists

## Budget lines

Appears in:

- new budget

Problem solved:

- budget composition by partidas with fast subtotal visibility

Future React components:

- `BudgetLineCard`
- `BudgetTotalsFooter`
- `BudgetHeaderForm`

Relevant tokens:

- guild chip
- mini metric cells
- sticky footer totals

Implementation risks:

- HTML shows static lines; real product needs editable structures, validation and persisted ordering

## Profitability / charts

Appears in:

- profitability
- closeout

Problem solved:

- translates cost and margin into scannable management view

Future React components:

- `ProfitHero`
- `DonutChartCard`
- `CategoryBreakdownBar`

Relevant tokens:

- green reserved to net benefit/money-positive signals
- blue used for category bars and chart rings

Implementation risks:

- visual charts can outrun available real data and force fake numbers

## Client/professional navigation

Appears in:

- client portal screens
- settings
- professional profile

Problem solved:

- separate role-specific navigation and comprehension

Future React components:

- `ClientBottomNav`
- `ProfileHero`
- `RoomProgressCard`

Relevant tokens:

- role-tailored iconography
- same dark system shell

Implementation risks:

- sharing one nav for every role would blur permissions and information hierarchy
