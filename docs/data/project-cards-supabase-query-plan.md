# ProjectCard Supabase Query Plan

> **NO EJECUTAR TODAVÍA**
>
> Este documento define el primer query plan futuro para `SupabaseProjectsRepository.getProjectCards()`. Es solo diseño técnico y no debe conectar Supabase real ni ejecutar queries todavía.

## Objetivo

Definir el primer query plan futuro para `SupabaseProjectsRepository.getProjectCards()` sin conectar Supabase real todavía.

## Alcance

La primera query real deberá leer únicamente:

- `projects`
- `clients`

No debe leer todavía:

- `tasks`
- `approvals`
- presupuestos
- costes
- documentos
- Odoo
- compras
- inventario
- empleados

## Contrato de salida

La salida pública seguirá siendo `ProjectCard[]`.

La UI no debe conocer:

- el shape intermedio de Supabase;
- nombres de tablas;
- joins;
- alias de relaciones.

La UI debe seguir consumiendo `service -> repository`.

## Shape intermedio esperado

El mapper actual espera conceptualmente este shape intermedio de fila parcial:

```ts
{
  id: string;
  name: string;
  status: string;
  client_id: string;
  client: {
    id: string;
    display_name: string;
  };
}
```

Nombre interno actual del shape:

- `SupabaseProjectCardPartialRow`

Nombre de relación esperado hoy por el mapper:

- `client`

## Query conceptual

La siguiente query es solo conceptual y no debe ejecutarse todavía.

```ts
// NO EJECUTAR TODAVÍA

supabase
  .from("projects")
  .select(`
    id,
    name,
    status,
    client_id,
    client:clients (
      id,
      display_name
    )
  `)
  .eq("organization_id", organizationId);
```

Notas de diseño:

- la query parte de `projects`;
- necesita join con `clients` para alimentar `clientName`;
- se filtra por `organization_id`;
- todavía no incluye orden, paginación ni filtros adicionales de estado;
- todavía no incluye `tasks` ni `approvals`.

## Flujo futuro

1. `SupabaseProjectsRepository.getProjectCards()` recibirá o resolverá el `organizationId`.
2. Ejecutará una query sobre `projects` con join a `clients`.
3. Validará errores devueltos por Supabase.
4. Convertirá el resultado al shape `SupabaseProjectCardPartialRow[]`.
5. Usará el helper interno de lista del repository.
6. Ese helper usará `mapSupabaseProjectCardPartialRowToProjectCard`.
7. Devolverá `ProjectCard[]`.

## Contadores

En esta fase del diseño, los contadores seguirán como valores controlados dentro del repository:

- `delayedTasksCount = 0`
- `blockedTasksCount = 0`
- `pendingApprovalsCount = 0`

O su equivalente controlado dentro de la implementación del repository.

No deben calcularse en UI.

## Manejo de errores futuro

Puntos que siguen pendientes de decisión:

- qué hacer si Supabase devuelve error;
- qué hacer si un proyecto referencia un cliente inexistente;
- qué hacer si `projects.status` no pasa `isProjectStatus`;
- si el repository debe lanzar error, devolver lista vacía o mapear errores a un error de aplicación.

## Organization scope

La futura query deberá estar filtrada por `organization_id`.

Esto es necesario para:

- evitar fugas entre organizaciones;
- preparar multiempresa desde el primer read real;
- dejar el camino listo para RLS posterior.

Decisión actual de diseño:

- en la primera implementación real, `organizationId` vendrá de una capa superior o contexto de aplicación;
- no se resolverá todavía dentro del repository desde Auth;
- más adelante podrá derivarse desde sesión/Auth, organización activa y `memberships`.

El origen definitivo de `organizationId` sigue pendiente y dependerá de cerrar:

- Auth;
- RLS;
- `memberships`;
- roles;
- estrategia de sesión o contexto de aplicación.

## Preguntas abiertas

- ¿`organizationId` se pasará como parámetro al repository o se resolverá desde sesión/Auth?
- ¿La relación Supabase se llamará `client`, `clients` u otro alias?
- ¿Cómo se mapearán errores de Supabase a errores de aplicación?
- ¿Habrá paginación desde el primer read real?
- ¿Habrá orden por `created_at`, `updated_at` o estado?
- ¿Se filtrarán proyectos archivados o completados?
- ¿Cuándo entrarán `tasks` y `approvals` para contadores reales?

## Notas arquitectónicas

- Este documento no implementa la query real.
- Este documento no activa `SupabaseProjectsRepository` en runtime.
- El mock sigue siendo la implementación activa.
- `ProjectCard` sigue siendo el contrato estable de UI.
- El shape intermedio de Supabase es interno del repository.
