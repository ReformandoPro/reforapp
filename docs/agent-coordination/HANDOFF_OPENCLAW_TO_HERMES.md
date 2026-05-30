# Handoff — Openclaw → Hermes

Este archivo registra traspasos de Openclaw a Hermes.

## Último handoff

### Fecha
2026-05-30

### Resumen
Se ha creado la base técnica inicial del proyecto Reformando.app con Next.js, TypeScript, Tailwind, Supabase preparado y estructura separada entre core/backend y frontend/UI.

### Archivos modificados
- .env.example
- README.md
- src/lib/supabase/browser.ts
- src/lib/supabase/server.ts
- src/lib/engine/budget.ts
- src/lib/engine/index.ts
- src/lib/types/budget.ts
- src/lib/types/project.ts
- src/lib/types/index.ts
- src/lib/odoo/README.md
- docs/agent-coordination/HANDOFF_OPENCLAW_TO_HERMES.md
- docs/agent-coordination/HANDOFF_HERMES_TO_OPENCLAW.md
- docs/agent-coordination/DECISIONS.md
- docs/agent-coordination/BLOCKERS.md

### Contratos disponibles
- `BudgetSummary`
- `ProjectCard`
- `BudgetStatus`
- `ProjectStatus`

### Qué puede hacer Hermes ahora
Hermes puede crear el layout base, una home temporal, componentes de estado vacío/carga/error y placeholders visuales para dashboard, obra y presupuesto usando los contratos iniciales `BudgetSummary` y `ProjectCard`.

### Qué NO debe asumir Hermes
Hermes no debe asumir todavía que existen endpoints reales, persistencia completa, autenticación final, integración con Odoo ni pantallas definitivas conectadas a datos reales.

### Bloqueos
No hay bloqueos técnicos inmediatos para empezar UI base con mocks.

### Pendientes para Openclaw
- Crear dominio inicial de organizaciones, proyectos y presupuestos.
- Definir contratos de servicios y API.
- Preparar modelo base de Supabase.
- Añadir tests del motor presupuestario.
