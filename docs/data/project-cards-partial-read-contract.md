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

## Esqueleto actual

Existe un esqueleto de `SupabaseProjectsRepository`, pero el mock sigue siendo la implementación activa en runtime.

Ese esqueleto solo prepara el punto de extensión para la futura sustitución del mock y todavía no:

- se conecta a Supabase real;
- ejecuta queries reales;
- requiere variables de entorno nuevas;
- sustituye al repository activo.

## Futuro SupabaseProjectsRepository

El futuro `SupabaseProjectsRepository` deberá implementar la misma interfaz que el mock repository actual.

Su responsabilidad será:

- leer el modelo parcial `projects + clients`;
- delegar el mapeo a un mapper interno del repository;
- mapear ese resultado al contrato `ProjectCard`;
- mantener los contadores como valores temporales controlados hasta la segunda iteración.

## Mapper interno preparado

Existe un mapper interno para preparar la transformación de la fila parcial futura de Supabase a `ProjectCard`.

Ese mapper:

- es interno de la capa repository;
- no lo usa directamente la UI;
- no ejecuta queries reales;
- no conecta Supabase;
- inicializa temporalmente los contadores a `0`.

## Helper interno de lista preparado

Dentro de `SupabaseProjectsRepository` existe también un helper interno para preparar el flujo futuro:

`SupabaseProjectCardPartialRow[] -> ProjectCard[]`

Ese helper:

- solo compone el mapper ya creado;
- no ejecuta queries reales;
- no activa todavía el repository Supabase en runtime;
- no sustituye al mock actual;
- no forma parte del contrato público de UI.
