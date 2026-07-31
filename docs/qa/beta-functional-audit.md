# Auditoría funcional ejecutable — app-beta

## Uso

Ejecutar después de un despliegue validado, con una sesión autorizada y sin compartir credenciales. Usar Chrome/DevTools para capturas de pantalla, consola y red. Registrar para cada caso: timestamp UTC, URL, usuario/rol, organización anonimizados, resultado, captura o log sanitizado y severidad.

Estados permitidos: `PASS`, `FAIL`, `BLOCKED`, `N/A`.

## Datos de prueba

- Usuario owner: cuenta QA autorizada.
- Usuario admin: cuenta QA autorizada.
- Usuario member: cuenta QA autorizada.
- Usuario de otra organización: cuenta QA autorizada.
- Usuario anónimo: sesión cerrada.
- Obra piloto: identificador registrado en la evidencia de ejecución.

## Casos ejecutables

| ID | Área | Pasos exactos | Usuario/rol | Resultado esperado | Evidencia | Estado | Sev. si falla |
|---|---|---|---|---|---|---|---|
| AUTH-01 | Login | Abrir `/login`; iniciar sesión; seguir redirección | owner | Dashboard cargado, organización correcta | URL, timestamp, captura | ` ` | P1 |
| ORG-01 | Organización | Abrir selector/contexto de organización y revisar membership | owner/admin/member | Solo aparece la organización autorizada | Captura y organización anonimizada | ` ` | P0 |
| CLI-01 | Clientes | Abrir `/app/clients`; crear cliente; volver al listado | owner | Cliente persistido y visible | ID anonimizado, captura | ` ` | P1 |
| PROJ-01 | Proyectos | Crear obra vinculada al cliente; abrir detalle | owner | Obra creada con datos correctos | ID, URL, captura | ` ` | P1 |
| PROJ-02 | Proyectos | Editar nombre, estado y datos permitidos; guardar; recargar | owner/admin | Cambios persistidos | Antes/después sanitizado | ` ` | P1 |
| PHASE-01 | Fases | Abrir fases; crear y editar una fase | owner/admin | Fase visible y vinculada a la obra | ID, captura | ` ` | P1 |
| TASK-01 | Tareas | Crear tarea con fase, prioridad y fecha; recargar | owner/admin | Tarea persistida | ID, captura | ` ` | P1 |
| TASK-02 | Tareas | Editar título, descripción y estado; recargar | owner/admin | Cambios persistidos | Antes/después | ` ` | P1 |
| KAN-01 | Kanban | Abrir tablero; localizar tarea; cambiar estado si procede | owner/admin/member | Tarea aparece en columna correcta | Captura y estado | ` ` | P1 |
| INC-01 | Incidencias | Abrir tarea; crear incidencia; consultar listado | owner/admin | Incidencia creada y visible según permisos | ID, captura | ` ` | P1 |
| ACL-01 | Permisos | Repetir lectura/escritura de proyectos y tareas | owner/admin | Operaciones permitidas por política | Logs/status sanitizados | ` ` | P1 |
| ACL-02 | Permisos | Intentar editar como member | member | Operación permitida o denegada exactamente según política; nunca bypass | Status y captura | ` ` | P1 |
| ACL-03 | Aislamiento | Abrir IDs de otra organización y consultar/editar | owner de org B | Sin lectura ni escritura de org A | Status y evidencia | ` ` | P0 |
| ACL-04 | Anónimo | Cerrar sesión y repetir rutas protegidas | anónimo | Redirección o denegación; ningún dato | URL/status | ` ` | P0 |
| UI-01 | Responsive | Repetir dashboard, clientes y obra a 390×844 | cualquier QA | Sin solapamientos ni overflow horizontal | Capturas viewport | ` ` | P3 |
| UI-02 | Estados vacíos | Abrir una organización/obra sin datos | owner | Empty states claros, sin errores | Captura | ` ` | P2 |
| UI-03 | Errores | Provocar validación inválida y revisar mensaje | owner | Mensaje visible, asociado y accionable | Captura | ` ` | P2 |
| HTTP-01 | Runtime | Revisar consola/red durante flujos principales | cualquier QA | Cero 500/503 inesperados | Export/log sanitizado | ` ` | P0 |
| PILOT-01 | Obra piloto | Completar cliente → obra → fase → tarea → incidencia → estado | owner/admin | Flujo completo persistido | IDs y checklist firmada | ` ` | P1 |

## Criterio de auditoría

La auditoría no se cierra si existe un `FAIL` P0/P1, si el aislamiento no está probado o si no hay evidencia reproducible. Los P2/P3 deben quedar registrados con decisión y responsable.
