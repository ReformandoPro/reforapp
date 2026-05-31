# ProjectCard Supabase Schema Plan

## Objetivo

Diseñar el modelo mínimo futuro de Supabase necesario para alimentar el contrato `ProjectCard`.

Esta fase es solo documental. No crea migraciones, tablas reales, RLS, endpoints ni conexión real con Supabase.

## Contrato actual ProjectCard

El contrato actual usado por la UI contiene:

- `id`
- `name`
- `clientName`
- `status`
- `delayedTasksCount`
- `blockedTasksCount`
- `pendingApprovalsCount`

## Por qué ProjectCard es el primer candidato

`ProjectCard` es un buen primer candidato para salir de mock porque:

- alimenta el dashboard del reformista;
- es una lectura sencilla;
- no toca cálculo económico;
- no expone márgenes, costes ni información sensible de presupuesto;
- permite probar el patrón service -> repository -> Supabase con bajo riesgo.

## Decisión para la primera iteración real

El primer read real de Supabase para `getProjectCards()` será **parcial**.

En esa primera iteración, `ProjectCard` se alimentará inicialmente desde `projects` y `clients`. Los contadores `delayedTasksCount`, `blockedTasksCount` y `pendingApprovalsCount` se mantendrán en mock o en valor controlado temporal hasta una segunda iteración con `tasks` y `approvals`.

## Tablas candidatas mínimas

### Primera iteración real

Las tablas necesarias para la primera iteración real son:

- `projects`
- `clients`

Campos mínimos necesarios:

- `projects.id`
- `projects.name`
- `projects.status`
- `projects.client_id`
- `clients.id`
- `clients.display_name`

### Segunda iteración

En una segunda iteración entrarían además:

- `tasks`
- `approvals`

No se incluye todavía presupuestos, compras, inventario, documentos, fotos ni Odoo.

## Campos mínimos por tabla

### organizations

- `id`
- `name`
- `created_at`

Uso: agrupar todos los datos de una empresa reformista y preparar multiempresa desde el inicio.

### clients

- `id`
- `organization_id`
- `display_name`
- `email`
- `phone`
- `created_at`

Uso: alimentar `ProjectCard.clientName`.

### projects

- `id`
- `organization_id`
- `client_id`
- `name`
- `status`
- `created_at`
- `updated_at`

Uso: alimentar `ProjectCard.id`, `ProjectCard.name` y `ProjectCard.status`.

### tasks

- `id`
- `organization_id`
- `project_id`
- `status`
- `due_date`
- `blocked_reason`
- `created_at`

Uso: calcular `delayedTasksCount` y `blockedTasksCount`.

### approvals

- `id`
- `organization_id`
- `project_id`
- `status`
- `type`
- `created_at`

Uso: calcular `pendingApprovalsCount`.

## Cómo se calcula ProjectCard

### Primera iteración real

- `id` viene de `projects.id`.
- `name` viene de `projects.name`.
- `clientName` viene de `clients.display_name`.
- `status` viene de `projects.status`.
- `delayedTasksCount` se mantiene temporalmente en mock o valor controlado.
- `blockedTasksCount` se mantiene temporalmente en mock o valor controlado.
- `pendingApprovalsCount` se mantiene temporalmente en mock o valor controlado.

### Segunda iteración

- `delayedTasksCount` se derivará de `tasks`.
- `blockedTasksCount` se derivará de `tasks`.
- `pendingApprovalsCount` se derivará de `approvals`.

## Datos derivados

Estos campos deberían ser derivados, no necesariamente columnas persistidas en `projects`:

- `delayedTasksCount`
- `blockedTasksCount`
- `pendingApprovalsCount`

En la primera iteración no se resuelven todavía desde Supabase real. Quedan para una segunda iteración, en la que habrá que decidir si se calculan mediante:

- query agregada en repository;
- vista SQL;
- función SQL;
- materialización posterior si hay problemas de rendimiento.

## Por qué empezar de forma parcial

- Reduce riesgo.
- Permite validar primero el patrón `service -> repository -> Supabase`.
- Evita diseñar prematuramente contadores derivados.
- Mantiene `ProjectCard` como contrato de UI.
- Evita contaminar la UI con detalles de base de datos.

## Qué no entra todavía

Quedan fuera de este primer diseño:

- presupuestos;
- versiones de presupuesto;
- líneas de presupuesto;
- costes;
- márgenes;
- contingencias;
- documentos;
- fotos;
- compras;
- inventario;
- proveedores;
- empleados;
- asistencia;
- Odoo;
- facturación;
- RLS final;
- permisos avanzados;
- auditoría completa.

## Riesgos

### Duplicar estados entre dominio y DB

Riesgo: que `ProjectStatus` en TypeScript y `projects.status` en Supabase diverjan.

Mitigación: mantener el dominio como fuente semántica y validar en repository/API antes de persistir.

### Contadores caros

Riesgo: calcular tareas bloqueadas, vencidas y aprobaciones pendientes puede hacerse caro si crece el volumen.

Mitigación: empezar con queries simples y evolucionar a vistas o funciones SQL si hace falta.

### Fugas entre organizaciones

Riesgo: exponer obras de una empresa a otra.

Mitigación: incluir `organization_id` desde el primer diseño y aplicar RLS en una fase posterior.

### Meter datos económicos antes de tiempo

Riesgo: contaminar `ProjectCard` con costes, márgenes o presupuesto antes de tener bien definido el motor presupuestario.

Mitigación: mantener `ProjectCard` operativo y no económico.

## Decisiones pendientes

Antes de crear migraciones reales hay que decidir:

1. Si usaremos Supabase Auth desde el MVP.
2. Si `organizations` será obligatoria desde el primer día.
3. Cómo modelaremos `memberships` y roles.
4. Qué estados exactos de proyecto pasan a DB.
5. Qué estados exactos de tareas pasan a DB.
6. Qué estados exactos de aprobaciones pasan a DB.
7. Si los contadores se calcularán en query, vista SQL, función SQL o repository.
8. Si el cliente operativo de Reformando será siempre diferente del contacto fiscal de Odoo.
9. Qué datos del cliente podrán ver operarios, administración y cliente final.

## Fuera de alcance de esta fase

Esta fase no implementa:

- `SupabaseProjectsRepository`;
- migraciones;
- tablas;
- RLS;
- seed data;
- endpoints;
- autenticación;
- integración Odoo;
- cambios visuales.

Además, en esta fase no se debe:

- conectar Supabase real;
- añadir presupuestos ni datos económicos;
- acoplar la UI a nombres de tablas.

## Próximo paso recomendado

El siguiente paso debería ser preparar la implementación técnica de esa primera lectura parcial, manteniendo `ProjectCard` como contrato de UI y dejando la estrategia de contadores para una segunda iteración.
