# Decisions — Reformando.app

Registro de decisiones importantes del proyecto.

## Decisiones confirmadas

### Supabase como core operativo
Supabase/PostgreSQL será la base principal de Reformando Core.

### Odoo como ERP externo integrado
Odoo 18 se usará para CRM, contactos fiscales, productos, proveedores, compras, inventario, facturación, contabilidad y recursos humanos administrativos.

### Motor presupuestario propio
El motor presupuestario vive en Reformando Core y no debe depender directamente ni de Supabase ni de Odoo.

### Estados y transiciones viven en dominio
Los estados y transiciones de presupuesto y proyecto viven en `src/lib/domain/*`, no en UI ni en tipos sueltos duplicados. `BudgetStatus` y `ProjectStatus` deben tener una única fuente de verdad y los contratos compartidos deben importar desde dominio cuando corresponda.

### Primera versión revisable del flujo de estados
La versión actual de estados y transiciones es una primera aproximación revisable. No debe bloquear la evolución del flujo de negocio hasta validar de forma completa presupuesto, obra, tareas, extras y aprobaciones.

### Las pantallas consumen servicios, no mocks directos
Las pantallas no deben consumir mocks directamente. Deben consumir servicios de aplicación en `src/lib/services/*` que hoy devuelven datos mock y mañana podrán leer de Supabase sin obligar a rediseñar las pantallas.

### Los servicios consumen repositories, no mocks directos
Los servicios de aplicación no deben depender directamente de mocks. Deben depender de interfaces de repository. Hoy se implementan con mock repositories; mañana podrán implementarse con Supabase repositories sin obligar a reescribir la capa de servicios ni las pantallas.
