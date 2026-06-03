# Supabase MVP schema specification

Date: 2026-06-03

Branch: `codex/supabase-mvp-schema-spec`

Base commit: `905cf6a` (`merge: add MVP gap analysis`)

## Executive Summary

This folder defines the minimum Supabase/Postgres schema proposed to move Reformando.app from mock-backed screens to persistent MVP data.

The schema is intentionally narrow. It supports the product surface that already exists in `main`:

- dashboard summary;
- project/obra list;
- project/obra detail;
- project tasks;
- budget list;
- budget detail;
- basic task status update;
- basic incidents/operational alerts;
- basic approvals.

It does not apply any migration, does not touch a real Supabase project and does not modify runtime code. The SQL file is a proposed migration artifact for a future implementation branch.

## What This Schema Solves

The current app has routes, services, repositories, mocks and stable TypeScript read contracts, but no persistent product workflow. This schema gives those contracts a real database target while keeping the MVP focused on the first useful loop:

1. A company has members.
2. A reformista manages clients.
3. A client has projects/obras.
4. A project has tasks, budgets, budget lines, incidents, approvals and documents.
5. Existing routes can read those records through the Supabase adapter once the adapter is approved and connected.

## MVP Coverage

Included:

- `organizations`
- `profiles`
- `organization_members`
- `clients`
- `projects`
- `tasks`
- `budgets`
- `budget_lines`
- `approvals`
- `incidents`
- `documents`

Excluded from MVP:

- Odoo sync tables;
- purchase orders and inventory;
- material request workflow;
- full document storage policy design;
- chat/messages;
- notifications queue;
- legal time tracking;
- invoices/accounting;
- advanced audit log;
- advanced role hierarchy;
- cross-organization reporting.

## Relationship With The Supabase Adapter

The adapter branch `codex/data-supabase-adapter-foundation` introduces a safe runtime seam:

- if Supabase env vars are missing, the app uses mocks;
- if Supabase env vars exist, the app still falls back to mocks until real repositories are connected;
- current routes keep their existing service contracts.

This schema is the next technical prerequisite. After approval, a future branch can create real Supabase migrations and then connect one read path at a time, starting with project cards or project tasks.

## Files

- `SCHEMA.md`: table-by-table model and relation to current app contracts.
- `RLS-POLICIES.md`: minimum RLS design by table and role.
- `SEED-DATA.md`: demo data plan aligned with current mocks.
- `MIGRATION-PLAN.md`: safe branch sequence, acceptance criteria and rollback.
- `schema.sql`: proposed Supabase/Postgres SQL migration artifact.

## Non-Goals

This specification does not:

- execute SQL;
- create Supabase tables remotely;
- change `src/`;
- change routes or UI;
- add dependencies;
- deploy beta;
- merge or depend on the rescue branch.
