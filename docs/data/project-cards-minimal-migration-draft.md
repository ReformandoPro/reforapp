# ProjectCard Minimal Migration Draft

> **NO EJECUTAR TODAVÍA**
>
> Este documento es solo un borrador técnico para preparar la futura primera migración mínima de Supabase. No debe aplicarse contra ninguna base real ni convertirse todavía en una migración activa del sistema.

## Objetivo

Diseñar la primera migración mínima futura necesaria para alimentar `ProjectCard` parcial desde Supabase.

## Alcance de esta fase

Solo entran estas tablas:

- `organizations`
- `clients`
- `projects`

## Fuera de alcance en esta fase

Quedan explícitamente fuera:

- `tasks`
- `approvals`
- presupuestos
- costes
- márgenes
- documentos
- fotos
- Odoo
- compras
- inventario
- empleados
- auth real
- RLS real

## SQL conceptual no ejecutable

El siguiente SQL es aproximado y solo documental.

```sql
-- NO EJECUTAR TODAVÍA

create table organizations (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  display_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  client_id uuid not null references clients(id),
  name text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Relación con ProjectCard

Para el primer read parcial previsto:

- `ProjectCard.id` <- `projects.id`
- `ProjectCard.name` <- `projects.name`
- `ProjectCard.clientName` <- `clients.display_name`
- `ProjectCard.status` <- `projects.status`
- `delayedTasksCount` <- valor controlado temporal
- `blockedTasksCount` <- valor controlado temporal
- `pendingApprovalsCount` <- valor controlado temporal

## Estados

`projects.status` deberá alinearse con `ProjectStatus` del dominio antes de aplicar una migración real.

Estado actual del dominio de proyecto:

- `lead`
- `budgeting`
- `approved`
- `scheduled`
- `in_progress`
- `paused`
- `completed`
- `delivered`
- `closed`
- `cancelled`

Opciones todavía abiertas para la implementación real:

- `text` con validación de aplicación;
- `text` con `check constraint`;
- `enum` de PostgreSQL.

Por prudencia, el `check constraint` queda como opción pendiente, no como decisión final de esta fase.

## Índices futuros propuestos

Sin ejecutar todavía, la primera iteración real probablemente necesitará:

```sql
-- NO EJECUTAR TODAVÍA

create index idx_projects_organization_id on projects(organization_id);
create index idx_projects_client_id on projects(client_id);
create index idx_clients_organization_id on clients(organization_id);
create index idx_projects_organization_status on projects(organization_id, status);
```

## RLS futuro

No se definen políticas reales todavía.

La futura estrategia de RLS dependerá de cerrar antes:

- Supabase Auth
- `organizations`
- `memberships`
- roles

## Ajustes pendientes antes de migración real

Antes de convertir este borrador en una migración ejecutable habrá que decidir o confirmar:

- estrategia de generación de UUIDs;
- si `organizations` será obligatoria desde el primer día;
- si `projects.status` se protege en DB o solo en aplicación;
- si `updated_at` se mantendrá con trigger, desde aplicación o con otra estrategia;
- si conviene añadir `on delete` explícitos en las foreign keys.

## Preguntas abiertas

- ¿`organizations` será obligatoria desde el primer día?
- ¿Cuándo entra `memberships`?
- ¿Los IDs serán generados por Supabase con `gen_random_uuid()`?
- ¿`projects.status` será `text + check`, enum Postgres o validación de aplicación?
- ¿El cliente operativo será distinto del contacto fiscal de Odoo?
- ¿Cuándo entran `tasks` y `approvals` para los contadores?

## Notas arquitectónicas

- Este borrador no activa `SupabaseProjectsRepository` en runtime.
- La UI debe seguir consumiendo `ProjectCard` a través de `service -> repository`.
- La UI no debe acoplarse a este SQL conceptual.
- El mock sigue siendo la implementación activa.
