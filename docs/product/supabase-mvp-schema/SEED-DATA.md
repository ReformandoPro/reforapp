# Supabase MVP Seed Data

## Purpose

Seed data should make the current product routes useful immediately after the first database migration, without requiring product CRUD screens first.

It should support:

- dashboard with meaningful counters;
- project list with multiple statuses;
- project detail with counters and sections;
- project task route with delayed, blocked and done tasks;
- budget list/detail with margin data;
- approvals and incidents for dashboard alerts.

## Demo Organization

| Field | Value |
|---|---|
| `id` | deterministic UUID in SQL |
| `name` | Reformando Demo |
| `slug` | `reformando-demo` |

## Demo Users / Profiles

| Role | Display name | Email | Purpose |
|---|---|---|---|
| `owner` | Jorge Reformando | `owner@reformando.demo` | company owner/admin |
| `project_manager` | Carlos Mendoza | `jefe.obra@reformando.demo` | reformista/jefe de obra |
| `worker` | Juan Albañil | `juan@reformando.demo` | assigned worker |
| `worker` | Ana Electricista | `ana@reformando.demo` | assigned worker |
| `client` | Alejandro Ortiz | `cliente@reformando.demo` | final client |

Note: real `profiles.id` values must match Supabase `auth.users.id`. For a pure SQL seed, profile rows can be included only if matching auth users are created separately. The `schema.sql` includes commented seed guidance, not executable auth-user creation.

## Demo Clients

| Display name | Email | Phone |
|---|---|---|
| Familia Ortega | `familia.ortega@example.com` | `+34 600 000 001` |
| Sr. Alejandro Ortiz | `alejandro.ortiz@example.com` | `+34 600 000 002` |

## Demo Projects

| Name | Client | Status | Purpose |
|---|---|---|---|
| Reforma integral — Calle Mayor 18 | Familia Ortega | `in_progress` | mirrors current main mock |
| Reforma ático Serrano | Sr. Alejandro Ortiz | `scheduled` | matches design reference/client portal language |
| Baño principal — Loft Gran Vía | Familia Ortega | `budgeting` | pending budget/demo pipeline |

These projects should make `/projects` show more than one state and make dashboard counters credible.

## Demo Tasks

For `Reforma integral — Calle Mayor 18`:

| Title | Status | Priority | Assignee | Due date | Blocked reason | Section |
|---|---|---|---|---|---|---|
| Resolver bloqueo de fontanería en baño principal | `blocked` | `urgent` | Carlos Mendoza | current date | Falta validación técnica del replanteo. | Instalaciones |
| Validar extra de carpintería con cliente | `in_progress` | `high` | Carlos Mendoza | past date | null | Carpintería |
| Cerrar remates de demolición en cocina | `todo` | `medium` | Juan Albañil | future date | null | Demoliciones |
| Completar medición inicial de tabiquería | `done` | `medium` | Carlos Mendoza | past date | null | Mediciones |

For `Reforma ático Serrano`:

| Title | Status | Priority | Assignee | Due date | Section |
|---|---|---|---|---|---|
| Preparar replanteo de suelos | `todo` | `high` | Carlos Mendoza | future date | Revestimientos |
| Revisar cuadro eléctrico existente | `todo` | `medium` | Ana Electricista | future date | Electricidad |

For `Baño principal — Loft Gran Vía`:

| Title | Status | Priority | Assignee | Due date | Section |
|---|---|---|---|---|---|
| Cerrar medición de alicatado | `todo` | `medium` | Carlos Mendoza | future date | Presupuesto |

## Demo Budgets

### Budget 1

| Field | Value |
|---|---|
| Project | Reforma integral — Calle Mayor 18 |
| Title | Presupuesto base — Reforma integral Calle Mayor 18 |
| Code | `REF-CM18-V1` |
| Status | `sent` |
| Currency | `EUR` |
| Surface | `90.00` |
| Estimated cost | `6000000` cents |
| Sale price | `8571429` cents |
| Target margin | `0.3000` |
| Actual margin | `0.3000` |
| Contingency | `300000` cents |
| Client visible total | `8571429` cents |

Lines:

| Name | Kind | Quantity | Unit | Unit cost | Sale price | Client visible |
|---|---|---:|---|---:|---:|---|
| Demolición de tabiquería | `labor` | `45` | `m2` | `1250` | `56250` | true |
| Fontanería baño principal | `subcontract` | `1` | `ud` | `180000` | `260000` | true |
| Materiales de acabado | `material` | `1` | `lote` | `950000` | `1350000` | true |

### Budget 2

| Field | Value |
|---|---|
| Project | Baño principal — Loft Gran Vía |
| Title | Presupuesto inicial — Baño Loft Gran Vía |
| Code | `REF-LGV-BANO-V1` |
| Status | `draft` |
| Currency | `EUR` |
| Surface | `8.00` |
| Estimated cost | `520000` cents |
| Sale price | `780000` cents |
| Target margin | `0.3000` |
| Actual margin | `0.3333` |
| Contingency | `45000` cents |
| Client visible total | `780000` cents |

## Demo Approvals

| Project | Kind | Status | Title |
|---|---|---|---|
| Reforma integral — Calle Mayor 18 | `extra` | `pending` | Aprobación extra de carpintería |
| Reforma integral — Calle Mayor 18 | `budget` | `approved` | Presupuesto base aprobado |
| Baño principal — Loft Gran Vía | `budget` | `pending` | Revisión presupuesto inicial |

## Demo Incidents

| Project | Task | Level | Status | Title |
|---|---|---|---|---|
| Reforma integral — Calle Mayor 18 | Resolver bloqueo de fontanería | `warning` | `open` | Bloqueo crítico en fontanería |
| Reforma integral — Calle Mayor 18 | Validar extra de carpintería | `info` | `open` | Aprobación pendiente del cliente |
| Reforma ático Serrano | null | `info` | `open` | Confirmar entrega de material de suelos |

## Demo Documents

| Project | Kind | Title | Visible to client |
|---|---|---|---|
| Reforma integral — Calle Mayor 18 | `photo` | Estado inicial cocina | true |
| Reforma integral — Calle Mayor 18 | `document` | Plano instalaciones | false |
| Reforma ático Serrano | `photo` | Replanteo inicial | true |

## Acceptance Criteria For Seed

- `/` can show active projects, pending budgets and operational alerts from real data.
- `/projects` can render at least three project cards.
- `/projects/[id]` can render valid counters and enabled sections.
- `/projects/[id]/tasks` can render blocked, delayed, done and todo tasks.
- `/budgets` can render at least two budgets.
- `/budgets/[id]` can render one sent and one draft budget.
