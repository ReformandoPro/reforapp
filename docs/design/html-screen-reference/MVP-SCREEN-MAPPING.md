# MVP Screen Mapping

## Current repo reality

Real routes already present:

- `/`
- `/projects`
- `/projects/[id]`
- `/projects/[id]/tasks`
- `/budgets`
- `/budgets/[id]`
- `/design-reference`

Current modules partly implemented:

- dashboard
- projects
- project tasks
- budgets

Modules not yet implemented in real product runtime:

- documents
- purchases/materials
- notifications
- measurement workflow
- client portal
- profitability
- settings
- closeout

## Screen-to-MVP mapping

| HTML screen | Current repo equivalent | Gap status | Data dependency | MVP value |
|---|---|---|---|---|
| dashboard admin | `/` | partial | dashboard aggregates | closes command-center gap |
| detalle proyecto tabs | `/projects/[id]` | partial | project overview + tabs data | strong MVP accelerator |
| nuevo presupuesto | `/budgets/new` missing | missing | budgets + lines + client/project relations | core MVP |
| lista compra | no route | missing | materials/purchases | useful after tasks/budget |
| gestion compras | no route | missing | purchases/orders | useful after schema for purchases |
| rentabilidad | no route | missing | real cost/revenue | post-core MVP |
| documentos proyecto | no route | missing | documents metadata/storage | useful but after core persistence |
| galeria avance | no route | missing | photos/media | useful but after storage |
| notificaciones | no route | missing | alert feed | useful but non-blocking |
| cierre de obra | no route | missing | payments, extras, invoice state | post-MVP |
| portal cliente bienvenida | no route | missing | client-scoped project state | useful after client auth |
| portal estado por estancias | no route | missing | room progress, media, checklist | useful after client portal base |
| configuracion superficie | no route | missing | measurement setup | useful for richer estimating |
| medidas habitaciones | no route | missing | room measurements | useful for estimating workflow |
| medida lineal | no route | missing | linear measurements | post-core MVP |
| esquema reforma | no route | missing | room schema/shape data | post-core MVP |
| perfil profesional | no route | missing | workforce profile data | post-MVP or marketplace |
| ajustes | no route | missing | user/settings data | post-MVP |
| error/sin conexion | partial via existing states | partial | none or generic app errors | useful shared state work |

## Which screens help close the MVP fastest

Most useful for the next MVP closure:

1. `dashboard_admin_rediseno_sistema_unificado.html`
2. `detalle_proyecto_tabs_rediseno_sistema.html`
3. `nuevo_presupuesto_rediseno_sistema_unificado.html`
4. `documentos_proyecto_rediseno_sistema.html`
5. `lista_compra_rediseno_sistema_unificado.html`

Why:

- they align directly with reformista workflow
- they map to modules already described in `mvp-gap-analysis`
- they do not depend on speculative marketplace or post-closeout logic

## Screens that are clearly post-MVP

- `cierre_de_obra_rediseno_sistema.html`
- `rentabilidad_rediseno_sistema_unificado.html`
- `perfil_profesional_rediseno_sistema.html`
- `medida_lineal_rediseno_sistema.html`
- `esquema_reforma_rediseno_sistema.html`

Reason:

- either advanced financial reporting
- advanced estimation UX
- workforce/marketplace enrichment
- or closure logic beyond the first operational loop

## Supabase dependencies

High dependency on real Supabase or equivalent persistence:

- dashboard admin
- detalle proyecto tabs
- nuevo presupuesto
- documentos proyecto
- lista compra
- portal cliente screens

Moderate dependency:

- notificaciones
- mediciones
- settings

Low dependency:

- error/sin conexion reference states

## Recommended next 5 screens/modules

1. `/projects`
   - use the reference language from dashboard + project detail tabs
   - lowest-risk real route for first visual alignment after data foundation

2. `/projects/[id]`
   - move toward `detalle_proyecto_tabs_rediseno_sistema.html`
   - should become the operational nucleus of the obra

3. `/budgets/new`
   - implement from `nuevo_presupuesto_rediseno_sistema_unificado.html`
   - depends on budget CRUD and project/client relations

4. `/projects/[id]/documents`
   - implement from `documentos_proyecto_rediseno_sistema.html`
   - useful once metadata exists even before full storage sophistication

5. `/projects/[id]/shopping-list`
   - implement from `lista_compra_rediseno_sistema_unificado.html`
   - useful bridge between tasks and purchases

## Recommendation

Do not try to translate all 19 screens into runtime at once.

The right order is:

- real route already present
- direct reformista value
- low-to-moderate data complexity
- reusable pattern yield

That points first to:

- dashboard
- project detail
- budget creation
- documents
- shopping/purchases
