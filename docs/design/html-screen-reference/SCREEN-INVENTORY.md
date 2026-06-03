# Screen Inventory

## Summary

Screens detected: 19

Primary user groups covered:

- reformista/admin
- reformista/jefe de obra
- cliente final
- trabajador/profesional

Priority legend:

- `MVP imprescindible`
- `MVP util`
- `Post-MVP`
- `Solo referencia visual`

## Inventory

| File | Functional screen | Product module | Primary user | Goal | Main UI elements | Data needed | Probable future route | MVP priority |
|---|---|---|---|---|---|---|---|---|
| `dashboard_admin_rediseno_sistema_unificado.html` | Dashboard admin unificado | Dashboard operativo | Reformista/admin | Daily command center | KPI cards, project list, team module, FAB, bottom nav | dashboard summary, active projects, alerts, team snapshot | `/` | `MVP imprescindible` |
| `detalle_proyecto_tabs_rediseno_sistema.html` | Detalle de proyecto con tabs | Obra/proyecto | Reformista/jefe de obra | Review work status by tab | Hero card, progress, tabs, task list, empty state, CTA row | project overview, tasks, materials, gallery status | `/projects/[id]` | `MVP imprescindible` |
| `nuevo_presupuesto_rediseno_sistema_unificado.html` | Nuevo presupuesto | Presupuestos | Reformista/jefe de obra | Create/edit budget lines | Header actions, form fields, line cards, guild chips, total footer | project, client, budget header, line items, totals | `/budgets/new` or `/projects/[id]/budgets/new` | `MVP imprescindible` |
| `lista_compra_rediseno_sistema_unificado.html` | Lista de compra | Materiales/compras | Reformista/jefe de obra | Track grouped materials to purchase | Grouped list, guild sections, check states, total, CTA | purchase items, statuses, grouped materials | `/projects/[id]/shopping-list` | `MVP util` |
| `gestion_compras_rediseno_sistema.html` | Gestion de compras | Compras | Reformista/admin | View and manage purchase orders | Search, filter tabs/badges, order list, CTA | purchase orders, supplier/order status, search | `/purchases` | `MVP util` |
| `rentabilidad_rediseno_sistema_unificado.html` | Rentabilidad | Economico/reporting | Reformista/admin | Review margin and direct cost breakdown | Profit hero, donut charts, category bars, report CTA | revenue, costs, margin, category breakdown | `/projects/[id]/profitability` or `/reports/profitability/[id]` | `MVP util` |
| `documentos_proyecto_rediseno_sistema.html` | Documentos de proyecto | Documentacion | Reformista/jefe de obra | Organize and access project files | Summary card, grouped document sections, file rows, download actions | document metadata, categories, signature state, updated at | `/projects/[id]/documents` | `MVP util` |
| `galeria_avance_rediseno_sistema.html` | Galeria de avance | Seguimiento de obra | Reformista/jefe de obra | Visual timeline of work progress | Filters, dated timeline, before/after tags, floating camera action | photos, timestamps, room filters, labels | `/projects/[id]/gallery` | `MVP util` |
| `notificaciones_rediseno_sistema.html` | Notificaciones | Communication/alerts | Reformista/admin | Review alert feed by semantic type | Date groups, icon badges, unread dots, bottom nav | notifications, timestamps, semantic type, unread status | `/notifications` | `MVP util` |
| `cierre_de_obra_rediseno_sistema.html` | Cierre de obra | Cierre/facturacion final | Reformista/admin | Final payment and closure review | Payment milestones, extras, final invoice total, toggle, CTA | project totals, milestones, extras, closure status | `/projects/[id]/closeout` | `Post-MVP` |
| `portal_cliente_bienvenida_rediseno.html` | Portal cliente bienvenida | Portal cliente | Cliente final | Track overall project status | Welcome card, milestone timeline, gallery preview, bottom nav | client identity, project progress, milestones, gallery | `/client` | `MVP util` |
| `portal_estado_proyecto_estancias_rediseno.html` | Estado por estancias | Portal cliente | Cliente final | Track progress by room | Progress card, room breakdown, before/after compare, checklists, guild pills | room progress, payment status, room gallery, checklist state | `/client/project-status` | `MVP util` |
| `configuracion_superficie_rediseno_sistema.html` | Configuracion de superficie | Mediciones | Reformista/jefe de obra | Choose area calculation mode | Option cards, illustrations, bottom nav | measurement mode choice | `/measurements/setup` | `MVP util` |
| `medidas_habitaciones_rediseno_sistema.html` | Medidas por habitaciones | Mediciones | Reformista/jefe de obra | Add room-by-room areas | Total surface card, room list, dashed form, CTA | room names, sqm values, accumulated total | `/measurements/rooms` | `MVP util` |
| `medida_lineal_rediseno_sistema.html` | Medida lineal | Mediciones | Reformista/jefe de obra | Enter linear measurement | Large numeric input, unit, note, CTA | measurement value, unit, note | `/measurements/linear` | `Post-MVP` |
| `esquema_reforma_rediseno_sistema.html` | Esquema de reforma | Mediciones/planning | Reformista/jefe de obra | Visualize room layout and total area | Dotted canvas, room blocks, summary card, CTA | room shapes, labels, sqm, totals | `/measurements/schema` | `Post-MVP` |
| `perfil_profesional_rediseno_sistema.html` | Perfil profesional | Equipo/profesionales | Reformista/admin or marketplace | View worker/professional profile | Avatar, reputation, experience segment, skills, CTA | profile data, reputation, skills, verification | `/professionals/[id]` | `Post-MVP` |
| `ajustes_rediseno_sistema.html` | Ajustes | Settings | Reformista/admin | Manage preferences and account | Profile header, grouped rows, toggles, destructive actions | user profile, settings, billing plan | `/settings` | `Post-MVP` |
| `estado_error_sin_conexion_rediseno_sistema.html` | Error / sin conexion | System states | All users | Communicate offline and hard error states | Illustration, neutral error, destructive error, retry/support CTAs | error state, retry action, support action | reusable state, no route | `MVP util` |

## Notes

- `configuracion_superficie_rediseno_sistema.html` appears once in the ZIP and is listed functionally as the entry to the measurements flow.
- Measurement-related screens form a coherent sub-flow:
  - `configuracion_superficie_rediseno_sistema.html`
  - `medidas_habitaciones_rediseno_sistema.html`
  - `medida_lineal_rediseno_sistema.html`
  - `esquema_reforma_rediseno_sistema.html`
- Client portal is represented by two distinct screens and should be treated as one module with phased rollout.
