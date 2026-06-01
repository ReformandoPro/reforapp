# Implementation spec intake — modern UI migration

This folder contains the **implementation-ready specification** returned by the team after reviewing the repository’s style inventories.

## Relationship to the review package
- The review package (`docs/design/style-review-package/`) and export (`docs/design/style-export/`) captured:
  - what artifacts exist,
  - what the app currently does,
  - and which questions were still open.
- This package (`docs/design/implementation-spec/`) is the **counterpart**:
  - it resolves those open questions,
  - and defines the ordered migration plan for implementing the modern design system.

## Source of truth (still)
The primary source of truth remains:
- `docs/design/modern-source/`

If there is any conflict between this spec and `docs/design/modern-source/`, **`modern-source` wins**.

## What this folder is / is not
- ✅ Documentation and decision artifacts only.
- ❌ Not an implementation.
- ❌ No UI/runtime/tokens/layout/Supabase/deploy changes should be made in this intake branch.

## Files
- `IMPLEMENTATION-SPEC.md` — decisions + rationale + ordered convergence plan.
- `TOKEN-MIGRATION.md` — paste-ready token operations and type-mismatch fixes.
- `MIGRATION-CHECKLIST.md` — phase checklist (foundation → components → screens → cleanup).
- `decisions.json` — machine-readable decisions for tracking.
