# HTML Screen Reference Library

Date: 2026-06-03

Branch: `codex/html-screen-design-intake`

## What this contains

This folder ingests the 19 official HTML screens from `rediseno_pantallas_refor.zip` as a structured design and product reference.

It converts those static HTML mockups into:

- screen inventory
- reusable UI patterns
- token extraction
- MVP mapping
- implementation sequencing

## Why it matters

The ZIP is valuable because it captures a consistent visual and functional direction across:

- reformista/backoffice flows
- obra/project detail flows
- budgeting and profitability flows
- purchases/documents flows
- client portal flows
- error/offline states

That makes it more useful than a single gallery or isolated mock. It is a reference set for the next MVP implementation phases.

## How it should be used

Use this package to:

- align product and design decisions on which screens matter for the MVP
- derive reusable React component patterns
- extract tokens safely before changing runtime code
- prioritize implementation branches
- validate that future real screens preserve the intended visual grammar

## How it should not be used

The HTML files are reference material only.

They must not be:

- mounted directly as production routes
- copied into `/` or other real routes
- used to replace real data screens with static mockups
- treated as finished frontend architecture
- merged into runtime as-is

Rule:

The HTML screens are visual and functional reference. They are not product runtime.

## Relation to `/design-reference`

`/design-reference` is an internal visual route already present in the app. It validates atmosphere, hierarchy and styling direction.

This HTML library goes beyond that route:

- `/design-reference` is one safe internal visual reference surface
- this folder is a structured reference set covering multiple product modules and user roles

## Relation to dashboard visual spec

This folder complements:

- `docs/design/dashboard-visual-alignment-spec.md`

That spec is route-specific and focused on the real dashboard. This HTML package is broader and includes budgeting, measurements, purchases, portal cliente, documents, notifications and settings.

## Relation to MVP gap analysis

This folder complements:

- `docs/product/mvp-gap-analysis.md`

The MVP gap analysis explains what is missing functionally. This package shows what several of those missing modules should look and feel like when they become real product.

## Relation to Supabase MVP

This folder also complements:

- `docs/product/supabase-mvp-schema/`
- `docs/product/supabase-first-real-read-spec.md`

Those documents define data and implementation sequencing. This folder defines the UI and UX targets that those data-backed modules should eventually support.

## Raw HTML policy

The raw HTML files are not versioned in this branch.

Reason:

- they already exist in the uploaded ZIP
- they are static source material, not runtime assets
- duplicating 19 mock HTML files into the repo would add noise without improving implementation safety

Only the structured documentation has been committed.
