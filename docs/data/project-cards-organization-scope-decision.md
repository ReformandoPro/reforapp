# ProjectCard Organization Scope Decision

## Objetivo

Decidir cómo se propagará el contexto de organización para el futuro primer read real de `ProjectCard`.

## Contexto

El primer read real de `getProjectCards()` deberá estar filtrado por `organization_id`, pero todavía no existe Auth, RLS ni `memberships`.

Hoy el proyecto mantiene:

- `ProjectCard` como contrato estable de UI;
- `service -> repository -> fuente de datos` como flujo arquitectónico;
- `SupabaseProjectsRepository` solo como esqueleto no conectado;
- query plan futuro filtrado por `organization_id`.

## Decisión propuesta

Se adopta esta decisión arquitectónica para el primer diseño real de Supabase:

- `organizations` será obligatoria desde el primer diseño real de Supabase.
- `clients` y `projects` pertenecerán siempre a una `organization`.
- El primer `SupabaseProjectsRepository.getProjectCards()` real no resolverá todavía `organizationId` desde Auth.
- En la primera implementación real, `organizationId` se pasará explícitamente desde una capa superior, repository gateway o contexto de aplicación.
- Más adelante, cuando exista `Supabase Auth + memberships + RLS`, `organizationId` se derivará de la sesión o de la organización activa del usuario.
- La UI no debe pasar ni conocer `organization_id` directamente.
- La UI seguirá consumiendo `services`.

## Implicación para repositories

El futuro repository necesitará un contexto de organización.

Esa necesidad podrá resolverse más adelante por una de estas vías:

- parámetro explícito;
- factory de repository;
- repository context;
- capa de aplicación superior.

Todavía no se implementa ninguna de esas opciones.

La decisión de esta fase es solo arquitectónica:

- el repository necesita scope de organización;
- ese scope debe resolverse antes del repository;
- la UI no debe asumirlo ni propagarlo directamente.

## Memberships futuras

Se documenta una tabla futura conceptual `memberships`, todavía fuera de la primera migración parcial de `ProjectCard`.

Shape conceptual:

- `id`
- `organization_id`
- `user_id`
- `role`
- `created_at`

`memberships` no entra en la primera migración parcial salvo que se decida que Auth/RLS deben existir desde el primer día, cosa que hoy no está cerrada.

## RLS futura

No se definen políticas reales todavía.

La futura estrategia de RLS dependerá de cerrar antes:

- Supabase Auth;
- `memberships`;
- organización activa;
- roles.

## Impacto sobre ProjectCard

- `ProjectCard` no cambia.
- `ProjectCard` no incluye `organizationId`.
- `organization_id` es un detalle de filtrado del repository/data layer.
- Hermes no debe modelarlo en UI todavía.

## Impacto sobre query plan y read real futuro

Para el primer read real previsto:

1. una capa superior resolverá el `organizationId` activo;
2. el repository recibirá ese contexto de organización;
3. la query sobre `projects` se filtrará por `organization_id`;
4. el resultado se mapeará al shape intermedio del repository;
5. el repository devolverá `ProjectCard[]`.

Esto permite:

- proteger el diseño multiempresa desde el inicio;
- no bloquear el primer read real esperando Auth/RLS completos;
- evitar contaminar la UI con detalles de tenancy o de datos.

## Preguntas abiertas

- ¿Habrá una sola organización por usuario en MVP o multi-organización desde el principio?
- ¿Dónde vivirá el selector de organización activa?
- ¿El primer MVP necesita invitaciones de usuarios?
- ¿Qué roles mínimos hacen falta: `owner`, `admin`, `project_manager`, `worker`, `client`?
- ¿Los clientes finales tendrán cuenta en Supabase Auth desde el MVP o solo vista futura?
- ¿Debe bloquearse la primera migración real hasta tener `memberships` y RLS?
- ¿Puede existir un modo local/mock con `organizationId` fijo de desarrollo?

## Notas arquitectónicas

- Esta decisión no implementa Auth.
- Esta decisión no activa RLS.
- Esta decisión no cambia el contrato `ProjectCard`.
- Esta decisión no activa `SupabaseProjectsRepository` en runtime.
- El mock sigue siendo la implementación activa.
