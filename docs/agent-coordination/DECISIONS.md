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
