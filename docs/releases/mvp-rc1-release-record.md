# Reformando.app — MVP RC1 Release Record

## 1. Identificación

| Campo | Valor |
|---|---|
| Release | MVP RC1 |
| Estado | PREPARACIÓN |
| SHA actual de `main` | `b22515f98ac8a1230feca2ef65c2fcf003499c31` |
| PR de grants | #140 |
| HEAD de #140 | `9ff11515798a449199d705513f155b998bed1cc0` |
| SHA objetivo final | `PENDING` hasta merge |
| Responsables | `PENDING` |

No se inventarán SHA finales, credenciales, project refs ni resultados de checks.

## 2. Alcance RC1

- Clientes.
- Obras.
- Fases.
- Tareas.
- Kanban.
- Incidencias.
- Roles owner/admin/member.
- Aislamiento multi-tenant.
- Responsive móvil.
- Health check de aplicación.

## 3. Fuera de alcance

- Presupuestos.
- OBRAMAT.
- PR #118.
- Storage end-to-end.
- Invitaciones y acceso cliente.
- Registro de horas.
- Gastos con factura.
- Runner remoto reutilizable.
- Incidencias P2/P3 no bloqueantes.

## 4. Secuencia exacta de salida

1. **Checks de PR #140 — lectura:** esperar `Projects authenticated read validation`, `CI` y `B18 security validation` en PASS.
2. **Configuración — lectura:** confirmar el project ref previsto y que `NEXT_PUBLIC_SUPABASE_URL` efectiva de beta corresponde a ese ref. Si no coincide: NO-GO.
3. **Backup — escritura de artefacto:** descargar backup antes de cualquier migración y registrar ubicación, hash y timestamp.
4. **Migración — escritura de base de datos:** aplicar la migración aprobada contra el estado real de beta y conservar salida literal.
5. **Grants — lectura/escritura controlada:** ejecutar `authorized`, `denied` y `privileges`; verificar delta DML y ausencia de privilegios extra.
6. **Merge PR #140 — escritura de repositorio:** mergear solo con checks PASS y aprobación explícita.
7. **Deploy — escritura de infraestructura:** dejar que el merge a `main` dispare el deploy automático de `reformando-app-beta`.
8. **Health check — lectura HTTP:** exigir HTTP 200, JSON válido, `status: "ok"`, campo `commit` presente y SHA coincidente.
9. **Smoke autorizado — lecturas/escrituras funcionales:** ejecutar owner/admin sobre clientes, obras, fases, tareas, Kanban e incidencias.
10. **Smoke denegado — lecturas/escrituras bloqueadas:** verificar member, otra organización y anónimo según RLS.
11. **Smoke de privilegios — lectura SQL:** verificar solo el delta permitido y ausencia de `WITH GRANT OPTION` nuevo.
12. **Auditoría Chrome — lectura:** capturar consola, red, status HTTP, tiempos y pantallas sin secretos.
13. **Logs — lectura:** revisar 401/403, RLS, 500/503, PostgreSQL y discrepancias de SHA.
14. **Obra piloto — lecturas/escrituras funcionales:** ejecutar el flujo cliente → obra → fase → tarea → incidencia → estado.
15. **GO/NO-GO:** registrar decisión, incidencias abiertas y firmas.

Referencias operativas:

- [Runbook beta](../deploy/beta-runbook.md)
- [Smoke post-despliegue](../deploy/beta-post-deploy-smoke.md)
- [Auditoría funcional](../qa/beta-functional-audit.md)
- [Runbook de obra piloto](../qa/pilot-project-runbook.md)
- [Plantilla de evidencia](../qa/evidence-template.md)
- [Observabilidad beta](../qa/beta-observability.md)

## 5. Registro de evidencias

Completar una entrada por paso:

| Paso | Timestamp UTC | Entorno | Lectura/escritura | SHA | Comando/acción | Salida relevante | Enlace/captura | Responsable | Resultado | Severidad |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 2 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 3 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 4 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 5 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 6 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 7 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 8 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 9 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 10 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 11 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 12 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 13 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |
| 14 | | | | | | | | | PASS/FAIL | P0/P1/P2/P3 |

## 6. Criterios de parada

Emitir NO-GO y detenerse ante:

- P0 o P1;
- backup fallido o no localizable;
- project ref no confirmado;
- migración no verificable o parcial;
- health check distinto de HTTP 200;
- campo `commit` ausente o distinto;
- error 500/503;
- fuga multi-tenant;
- denegación que modifique datos;
- privilegio extra o `WITH GRANT OPTION` no autorizado.

## 7. Rollback

1. Detener smoke y preservar evidencia.
2. Ejecutar rollback SQL aprobado.
3. Verificar restauración exacta y eliminación del baseline temporal.
4. Revertir la aplicación o seleccionar el SHA anterior conocido.
5. Desplegar únicamente `reformando-app-beta` con el SHA anterior.
6. Ejecutar health check y verificar el campo `commit`.
7. Verificar integridad y ausencia de pérdida de datos.
8. Registrar y cerrar el incidente con causa, impacto y acciones.

## 8. GO/NO-GO beta

**GO beta** solo si checks, backup, migración, grants, health check, smoke autorizado/denegado, privilegios, Chrome y logs pasan; no hay P0/P1; y el SHA coincide.

**NO-GO beta** ante cualquier criterio de parada o evidencia incompleta.

## 9. GO/NO-GO MVP

GO MVP requiere además:

- una obra piloto completada;
- al menos 5 tareas creadas y completadas;
- al menos 2 incidencias registradas y cerradas;
- cero intervención manual en BD;
- cero P0/P1 abiertos;
- cero errores 5xx inesperados;
- cero denegaciones RLS inesperadas;
- cinco días laborables de observación;
- dos perfiles funcionales verificados.

## 10. Registro de incidencias

| ID | Timestamp | Severidad | Flujo | Descripción | Evidencia | Responsable | Estado | Mitigación |
|---|---|---|---|---|---|---|---|---|
| | | P0/P1/P2/P3 | | | | | OPEN/CLOSED | |

## 11. Firmas

| Rol | Nombre | Fecha UTC | Decisión | Firma/enlace |
|---|---|---|---|---|
| Responsable técnico | PENDING | | GO/NO-GO | |
| Responsable funcional | PENDING | | GO/NO-GO | |
| Responsable de release | PENDING | | GO/NO-GO | |
