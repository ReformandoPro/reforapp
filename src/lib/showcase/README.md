# Showcase (public)

Public **showcase** area.

## Objective

Make the showcase the **canonical runtime implementation** of the Design System.

The intended evolution is:

`docs/design/modern-source (SSOT)` → `Showcase components/screens` → `Product screens (/app)`

## What the showcase is

- A commercial / storytelling surface (sales, partners, investors).
- A controlled environment to validate tokens + components before touching `/app`.

## What the showcase is NOT

- Not the operational product.
- Not a demo backed by real data.

## Architecture

- Routes: `src/app/showcase/**`
- Narrative model (separate): `src/lib/showcase/**`
- Showcase UI primitives: `src/components/showcase/**`
- Showcase screens: `src/components/screens/showcase/**`
- Tokens/foundations (scoped): `src/styles/showcase/**`

## SSOT

Reference sources:

- `docs/design/modern-source/galeria-pantallas.html`
- `docs/design/modern-source/tokens.css`
- `docs/design/modern-source/SISTEMA-DE-DISENO.md`

The first reference grammar is:

- **S01 = "Screen 1: Nuevo Presupuesto"**

## Separation policy

Hard rules:

- Narrative/commercial model only. **Do not reuse** operational product types, statuses, or IDs.
- No Supabase.
- No imports from `src/lib/services`.
- No changes to `/app/**`.
- No changes to `/projects/**` (public demo).

Data policy:

- Deterministic local mock data (marketing/storytelling).

Reuse policy:

- Prefer building primitives inside `src/components/showcase/**`.
- Do not reuse `src/components/ui/*` styling (except neutral helpers like `cn`).
