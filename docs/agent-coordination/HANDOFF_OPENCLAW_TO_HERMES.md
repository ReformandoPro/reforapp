# Handoff — Openclaw → Hermes

Este archivo registra traspasos de Openclaw a Hermes.

## Último handoff

### Fecha
2026-05-30

### Resumen
Se consolida la base del core para que Hermes pueda empezar UI base con mocks controlados. El motor presupuestario inicial ya tiene tests unitarios, los estados y transiciones de proyecto/presupuesto viven en dominio y los contratos mínimos de dashboard, obra y presupuesto quedan definidos para consumo de UI.

### Archivos modificados
- package.json
- package-lock.json
- vitest.config.ts
- tests/engine/budget.test.ts
- docs/agent-coordination/DECISIONS.md
- docs/agent-coordination/HANDOFF_OPENCLAW_TO_HERMES.md
- src/lib/types/dashboard.ts
- src/lib/types/index.ts
- src/lib/services/dashboard.ts
- src/lib/services/projects.ts
- src/lib/services/budgets.ts
- src/lib/repositories/dashboard-repository.ts
- src/lib/repositories/projects-repository.ts
- src/lib/repositories/budgets-repository.ts
- src/lib/repositories/mock-dashboard-repository.ts
- src/lib/repositories/mock-projects-repository.ts
- src/lib/repositories/mock-budgets-repository.ts
- src/lib/repositories/index.ts
- src/lib/mock/dashboard.ts
- src/lib/mock/project.ts
- src/lib/mock/budget.ts
- src/app/page.tsx

### Contratos disponibles
- `ProjectCard`
- `ProjectOverview`
- `BudgetSummary`
- `BudgetView`
- `DashboardSummary`
- `BudgetDetail`
- `BudgetLine`
- `BudgetStatus` (fuente de verdad en dominio)
- `ProjectStatus` (fuente de verdad en dominio)

### Servicios disponibles para UI
- `getDashboardSummary()`
- `getProjectCards()`
- `getProjectOverview(projectId)`
- `getBudgetSummary(budgetId)`
- `getBudgetSummaries()`

Estos servicios exponen contratos de lectura orientados a pantalla, no modelos internos.

### Repositories disponibles
- `DashboardRepository`
- `ProjectsRepository`
- `BudgetsRepository`
- `MockDashboardRepository`
- `MockProjectsRepository`
- `MockBudgetsRepository`

### Tipos exportados
Desde `src/lib/types/index.ts` están exportados:
- `BudgetSummary`
- `BudgetView`
- `ProjectCard`
- `ProjectOverview`
- `DashboardSummary`
- `BudgetDetail`
- `BudgetLine`
- tipos comunes (`EntityId`, `MoneyAmount`, `AuditFields`, `OrganizationScoped`)

### Estados disponibles
- Proyecto: `lead`, `budgeting`, `approved`, `scheduled`, `in_progress`, `paused`, `completed`, `delivered`, `closed`, `cancelled`
- Presupuesto: `draft`, `sent`, `viewed`, `change_requested`, `approved`, `rejected`, `expired`, `archived`

Las transiciones viven en:
- `src/lib/domain/projects/transitions.ts`
- `src/lib/domain/budgets/transitions.ts`

### Qué puede hacer Hermes ahora
Hermes puede seguir iterando sin backend real estas piezas:
- AppShell móvil-first
- Home temporal
- Dashboard placeholder del reformista usando `DashboardSummary`
- Pantalla de obra usando `ProjectOverview`
- Pantalla de presupuesto usando `BudgetView`
- estados de carga, vacío y error para esas vistas

Debe consumir contratos y servicios de `src/lib/services/*`, no importar mocks ni repositories directamente.

Hermes puede usar `ProjectCard` para tarjetas/listados de obra, pero no debe asumir todavía persistencia real en Supabase ni campos adicionales que no estén expuestos por el contrato. `ProjectCard` sigue siendo el contrato estable de UI. El primer candidato previsto para salir de mock será `getProjectCards()`; su primera lectura real se ha decidido como **parcial**, alimentada inicialmente solo desde `projects` y `clients`. Ya existe un esqueleto futuro de `SupabaseProjectsRepository`, un mapper interno de repository para esa transformación parcial, un helper interno para mapear listas de filas, un borrador documental de migración mínima futura, un query plan documental y una decisión arquitectónica sobre organization scope, pero el mock sigue siendo la implementación activa. Hermes no debe asumir que la query ya exista, que las tablas ya existan o depender del shape intermedio de Supabase. Hermes tampoco debe añadir `organizationId` a `ProjectCard` ni pedirlo desde UI todavía. Antes de conectar Supabase real, Openclaw prepara ese read parcial dentro de `service -> repository`, no en UI, y el scope de organización seguirá siendo responsabilidad futura de la capa data/application. La UI no debe acoplarse al SQL conceptual.

### Qué datos pueden ser mock
Pueden seguir siendo mock temporales, pero encapsulados en servicios:
- listas de `ProjectCard`
- detalles de `ProjectOverview`
- listas de `BudgetSummary`
- detalles de `BudgetView`
- estructura completa de `DashboardSummary`
- contadores de tareas bloqueadas, retrasadas, incidencias y aprobaciones pendientes

En particular, `delayedTasksCount`, `blockedTasksCount` y `pendingApprovalsCount` pueden seguir siendo mock o valores controlados y siguen fuera de Supabase real hasta una segunda iteración con `tasks` y `approvals`.

### Qué NO debe asumir Hermes
Hermes no debe asumir todavía:
- endpoints reales
- persistencia en Supabase ya cerrada
- autenticación o permisos finales
- integración con Odoo
- edición real de presupuestos
- que la primera versión de estados/transiciones sea definitiva
- que los contratos reflejen tablas crudas de Supabase
- que pueda importar datos mock directamente desde `src/lib/mock/*`
- que deba consumir repositories desde UI
- que dependa de nombres de tablas de Supabase
- que `ProjectCard` tenga más campos de los expuestos actualmente
- que la primera lectura real de `ProjectCard` incluya ya contadores derivados desde `tasks` o `approvals`
- que todo lo visible en `BudgetView` pueda mostrarse al cliente sin revisar el subobjeto `client`

### Bloqueos
No hay bloqueos técnicos para empezar UI base con mocks controlados.

### Decisiones pendientes
- Validar si `DashboardSummary` cubre bien el dashboard inicial o necesita ajuste tras la primera propuesta visual de Hermes
- Cerrar más adelante el flujo final de estados de presupuesto, obra, tareas, extras y aprobaciones
- Definir después los endpoints/servicios reales que sustituirán los mocks

### Pendientes para Openclaw
- Añadir más tests del motor presupuestario cuando entren materiales, mermas, redondeos y compra
- Sustituir gradualmente mock repositories por repositories reales cuando se defina la capa de datos
- Preparar modelo inicial de Supabase cuando se cierre el conjunto mínimo de entidades
- Decidir más adelante si `ProjectOverview` y `BudgetView` necesitan versiones separadas por rol o por contexto (interno/cliente)
