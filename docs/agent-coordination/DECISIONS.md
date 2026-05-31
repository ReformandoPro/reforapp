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

### Los contratos de lectura para UI son DTOs/view models
Los contratos de lectura para UI no son tablas de Supabase ni modelos internos. Son DTOs/view models orientados a las necesidades de cada pantalla y rol. Deben separar con claridad información interna, información visible para cliente y datos temporales de mock.

### Primer candidato Supabase: `getProjectCards()`
El primer candidato para salir de mock y leer desde Supabase será `getProjectCards()`, por ser una lectura simple, visible en dashboard y de bajo riesgo económico.

### Contrato técnico previo al primer read parcial de `getProjectCards()`
Antes de conectar Supabase real, se mantendrá `ProjectCard` como contrato de UI y se preparará el read parcial `projects + clients` en la capa `repository/service`, sin exponer detalles de base de datos a la UI.

## ProjectCard como primer diseño de esquema Supabase

El primer diseño de esquema Supabase se hará alrededor de `ProjectCard`, empezando por organizaciones, clientes, proyectos, tareas y aprobaciones.

Esta decisión evita introducir todavía presupuestos, costes, márgenes, compras, inventario u Odoo en la primera lectura real.

`ProjectCard` se considera un candidato de bajo riesgo porque alimenta el dashboard, no contiene información económica sensible y permite validar el patrón `service -> repository -> Supabase` antes de abordar modelos más complejos.
