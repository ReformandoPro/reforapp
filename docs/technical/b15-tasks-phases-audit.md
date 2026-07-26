# B15 — Tasks & Phases Operational MVP (Auditoría)

Fecha: 2026-07-06  
Rama: `b15/tasks-phases-operational-mvp`

## 1) Qué existe sobre fases

**Tablas / migrations**

- `project_phases` se crea en `supabase/migrations/20260628150000_project_phases.sql`.
  - Columnas: `organization_id`, `project_id`, `title`, `description`, `status` (default `planned`), `start_date`, `end_date`, `sort_order`.
  - Check de estado: `planned | in_progress | done | blocked | cancelled`.
  - RLS:
    - `select`: cualquier miembro (cualquier rol) de la organización.
    - `insert/update/delete`: solo `owner/admin`, y valida `project_id` pertenece a `organization_id`.
  - Nota: la migration incluye un “guard” para no aplicar si el schema legacy no está normalizado a UUID (evita estados parciales).

**Servicios / tipos**

- `src/lib/services/phases.ts` define `PhaseStatus` + `PHASE_STATUSES` (labels UI).
- `src/lib/services/project-operational-summary.ts` lee `project_phases` y selecciona una fase “current”.

**Componentes / páginas**

- Listado: `src/app/app/projects/[id]/phases/page.tsx`.
- Crear: `src/app/app/projects/[id]/phases/new/page.tsx` + `.../actions.ts`.
- Editar / eliminar: `src/app/app/projects/[id]/phases/[phaseId]/edit/page.tsx` + `.../actions.ts`.

**Mock vs real**

- Fases operativas (/app) usan Supabase real (`createServerSupabaseClient`) y RLS.
- Onboarding crea fases reales desde plantillas: `src/app/app/onboarding/first-project/actions.ts` (`project_phases`).

## 2) Qué existe sobre tareas

**Tablas / migrations**

- `project_tasks` se crea en `supabase/migrations/20260628025000_project_tasks.sql`.
  - Columnas: `organization_id`, `project_id`, `title`, `description`, `status`, `priority`, `due_date`, `created_at`, `updated_at`.
  - Check de estado: `pending | in_progress | done | blocked`.
  - Check de prioridad: `low | medium | high | urgent`.
  - RLS:
    - `select`: cualquier miembro de la organización.
    - `insert/update`: `owner/admin/member`, y valida `project_id` pertenece a `organization_id`.
- Asignación: `assignee_user_id` en `supabase/migrations/20260628123300_project_tasks_assignee.sql`.
  - FK preferente a `auth.users(id)`.
  - RLS de insert/update valida que el assignee (si existe) pertenece a la organización (via `memberships`).
- Asociación a fase: `phase_id` + FK en `supabase/migrations/20260628150000_project_phases.sql`.
  - RLS de insert/update valida que la fase pertenece a la misma `organization_id` + `project_id`.

**Servicios / tipos**

- `src/lib/services/project-operational-summary.ts` lee `project_tasks` para el “hub” operativo.
- En UI (App Router /app) el estado de tareas se modela como: `pending | in_progress | done | blocked`.
- Existe un módulo legacy de tareas “demo” con mocks (`src/lib/domain/tasks/status.ts` + `src/lib/mock/tasks.ts`) que usa estados distintos (no es el módulo operativo /app).

**Componentes / páginas / acciones**

- Listado: `src/app/app/projects/[id]/tasks/page.tsx`.
- Crear: `src/app/app/projects/[id]/tasks/new/page.tsx` + `.../actions.ts` (valida org/proyecto/assignee/fase).
- Detalle: `src/app/app/projects/[id]/tasks/[taskId]/page.tsx`.
- Editar: `src/app/app/projects/[id]/tasks/[taskId]/edit/page.tsx` + `.../actions.ts`.

**Mock vs real**

- Tareas operativas (/app) usan Supabase real (`project_tasks`) con RLS.
- Onboarding crea tareas reales desde plantillas: `src/app/app/onboarding/first-project/actions.ts` (`project_tasks`).

## 3) Cómo se muestran hoy

- Hub operativo de obra: `src/app/app/projects/[id]/page.tsx`
  - Bloques de: Tareas, Fases, Presupuestos, Costes, Margen, Compras, Documentos y Avances.
  - El bloque “Tareas” y “Fases” se alimenta desde `src/lib/services/project-operational-summary.ts`.
- Rutas específicas:
  - `/app/projects/[id]/phases` y `/app/projects/[id]/tasks` (App Router).

## 4) Relación con organizationId / projectId / memberships / responsables / estados / fechas

- `organizationId` sale de `getOrganizationContextForRequest()` (membership resuelto en servidor).
- Todas las lecturas/escrituras filtran por `organization_id` + `project_id` y (cuando aplica) `id`.
- Responsables:
  - `project_tasks.assignee_user_id` (UUID), opcional.
  - UI usa `getOrgMembersWithProfiles()` para poblar el selector.
- Estados:
  - Fases: `planned | in_progress | done | blocked | cancelled`.
  - Tareas: `pending | in_progress | done | blocked`.
- Fechas:
  - Fases: `start_date`, `end_date`.
  - Tareas: `due_date`.

## 5) Permiso de member

Desde B15, `member` puede crear y modificar tareas, pero no fases. La migración correctiva
`20260726090100_b15_tasks_member_write.sql` alinea las políticas RLS de `project_tasks`
con `src/lib/services/project-operational-permissions.ts` y conserva las validaciones de
organización, proyecto, responsable y fase.

`project_tasks.organization_id` es inmutable. Una tarea puede cambiar de proyecto solo si
no tiene incidencias; si ya tiene incidencias, la base rechaza el cambio. Estas garantías
se aplican mediante triggers en `20260726090200_parent_integrity.sql` y no dependen del rol.

La garantía se aplica en `BEFORE INSERT OR UPDATE`: la organización es inmutable
en UPDATE; el proyecto debe pertenecer a la organización; una fase debe pertenecer
simultáneamente a la organización y al proyecto; y el responsable debe tener una
membresía en la organización. Un cambio de proyecto se rechaza si la tarea tiene
incidencias. La comprobación de incidencias usa una función `SECURITY DEFINER` y
no depende de la visibilidad RLS del usuario.
