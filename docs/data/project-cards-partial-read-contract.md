# ProjectCard Partial Read Contract

## Objetivo

Preparar el contrato de lectura parcial para `getProjectCards()` antes de conectar Supabase real.

## Contrato de UI

`ProjectCard` se mantiene como contrato estable de UI con estos campos:

- `id`
- `name`
- `clientName`
- `status`
- `delayedTasksCount`
- `blockedTasksCount`
- `pendingApprovalsCount`

## Primera lectura Supabase futura

La primera implementación real de Supabase para `getProjectCards()` solo deberá necesitar:

- `projects.id`
- `projects.name`
- `projects.status`
- `projects.client_id`
- `clients.id`
- `clients.display_name`

Esta primera lectura será parcial y deberá mapear esos datos al contrato `ProjectCard` sin exponer detalles de base de datos a la UI.

## Valores temporalmente controlados

Hasta la segunda iteración, estos campos no vendrán de Supabase real:

- `delayedTasksCount`
- `blockedTasksCount`
- `pendingApprovalsCount`

Podrán mantenerse en mock o en valores controlados dentro del repository, pero nunca calcularse en UI.

## Regla arquitectónica

Flujo obligatorio:

`UI -> service -> repository -> fuente de datos`

La UI no debe importar mocks ni clientes Supabase directamente.

## Futuro SupabaseProjectsRepository

El futuro `SupabaseProjectsRepository` deberá implementar la misma interfaz que el mock repository actual.

Su responsabilidad será:

- leer el modelo parcial `projects + clients`;
- mapearlo al contrato `ProjectCard`;
- mantener los contadores como valores temporales controlados hasta la segunda iteración.
