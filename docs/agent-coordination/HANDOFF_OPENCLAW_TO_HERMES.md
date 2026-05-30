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
- src/lib/mock/dashboard.ts
- src/lib/mock/project.ts
- src/lib/mock/budget.ts
- src/app/page.tsx

### Contratos disponibles
- `ProjectCard`
- `BudgetSummary`
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

### Tipos exportados
Desde `src/lib/types/index.ts` están exportados:
- `BudgetSummary`
- `ProjectCard`
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
- Pantalla de resumen de obra usando `ProjectCard`
- Pantalla de resumen de presupuesto usando `BudgetSummary`
- estados de carga, vacío y error para esas vistas

Debe consumir contratos y servicios de `src/lib/services/*`, no importar mocks directamente.

### Qué datos pueden ser mock
Pueden seguir siendo mock temporales, pero encapsulados en servicios:
- listas de `ProjectCard`
- listas de `BudgetSummary`
- estructura completa de `DashboardSummary`
- contadores de tareas bloqueadas, retrasadas y aprobaciones pendientes

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

### Bloqueos
No hay bloqueos técnicos para empezar UI base con mocks controlados.

### Decisiones pendientes
- Validar si `DashboardSummary` cubre bien el dashboard inicial o necesita ajuste tras la primera propuesta visual de Hermes
- Cerrar más adelante el flujo final de estados de presupuesto, obra, tareas, extras y aprobaciones
- Definir después los endpoints/servicios reales que sustituirán los mocks

### Pendientes para Openclaw
- Añadir más tests del motor presupuestario cuando entren materiales, mermas, redondeos y compra
- Sustituir gradualmente servicios mock por lectura real cuando se defina la capa de datos
- Preparar modelo inicial de Supabase cuando se cierre el conjunto mínimo de entidades
