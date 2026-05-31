# Project Tasks Read Contract

## Propósito

Definir el primer contrato de lectura para tareas asociadas a una obra, de forma que el producto pueda avanzar en modo readonly sin inventar datos fuera del dominio ya insinuado por `delayedTasksCount`, `blockedTasksCount`, `nextActions` y la sección `tasks` de `ProjectOverview`.

## Alcance

Esta propuesta cubre solo:

- lectura;
- listado de tareas por obra;
- contrato mínimo para UI readonly futura;
- continuidad con mocks controlados.

Queda expresamente fuera de esta fase:

- creación, edición o borrado;
- asignación real de usuarios;
- Supabase real;
- Auth, RLS o memberships;
- automatismos de planificación;
- flujos de escritura.

## Tipo propuesto

`ProjectTaskListItem`

## Campos mínimos recomendados

```ts
type ProjectTaskListItem = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName?: string;
  dueDate?: string;
  isDelayed: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  sectionLabel?: string;
};
```

## Estados propuestos

```ts
type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";
```

## Prioridades propuestas

```ts
type TaskPriority = "low" | "medium" | "high" | "urgent";
```

## Servicio futuro

```ts
getProjectTasks(projectId: string): ProjectTaskListItem[]
```

## Relación con contratos actuales

Este contrato se alinea con señales funcionales ya presentes en el repositorio:

- `delayedTasksCount` existe ya en `ProjectCard`, `ProjectOverview` y `DashboardSummary`;
- `blockedTasksCount` existe ya en `ProjectCard`, `ProjectOverview` y `DashboardSummary`;
- `nextActions` existe ya en `ProjectOverview`;
- `ProjectOverview.availableSections` ya contempla la sección `tasks`.

Relación prevista:

- `delayedTasksCount` podrá calcularse más adelante a partir de tareas con `isDelayed`;
- `blockedTasksCount` podrá calcularse más adelante a partir de tareas con `isBlocked` o `status === "blocked"`;
- `nextActions` podrá derivarse más adelante desde tareas pendientes/prioritarias, pero por ahora permanece como campo propio de `ProjectOverview`.

## Próximas fases recomendadas

### Fase 1

- types;
- status domain;
- mock;
- repository/service readonly.

### Fase 2

- tests de servicio y repository.

### Fase 3

- UI readonly en `/projects/[id]/tasks` o en una sección de tareas dentro del detalle de obra.

### Fase 4 futura

- persistencia real.

## Decisiones pendientes

- si tareas tendrán capítulos o partidas;
- si responsables serán texto mock o usuarios reales;
- si calendario/planificación será un dominio separado;
- si incidencias y bloqueos serán entidades separadas o campos de tarea.

## Criterio de prudencia

Este documento no activa implementación ni persistencia. Solo fija un contrato mínimo recomendado para que la siguiente fase pueda avanzar de manera trazable, contract-first y sin mezclar todavía UI final, Supabase real o escritura.
