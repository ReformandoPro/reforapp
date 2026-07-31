# Guía única de ejecución de beta y obra piloto

Esta guía consolida el runbook de beta, el smoke post-despliegue, la auditoría funcional y el runbook de obra piloto. Se ejecuta con autorización explícita y sin registrar secretos.

## Paso 1 — Preparar expediente

- Confirmar SHA aprobado de `main`.
- Confirmar que los checks obligatorios están en PASS.
- Confirmar aprobación de la migración y rollback de grants.
- Abrir una copia de `docs/qa/evidence-template.md`.
- Designar responsable y observador de logs.

Resultado esperado: expediente creado y responsable identificado.

## Paso 2 — Preparar backup y variables

- Ejecutar `Supabase Staging Ops (manual)` en modo `backup_only`.
- Descargar el backup y registrar nombre, hash, ubicación y timestamp.
- Confirmar project ref de staging.
- Confirmar en el gestor autorizado las variables SSH, health check y Supabase.
- Verificar que `service_role` no aparece en código cliente, `NEXT_PUBLIC_*`, HTML ni capturas.

Parar si falta el backup, el project ref no coincide o falta una variable requerida.

## Paso 3 — Aplicar migraciones

- Ejecutar `Supabase Staging Ops (manual)` en modo `db_push`.
- Usar `I_HAVE_DOWNLOADED_BACKUP` solo después de localizar el backup.
- Conservar la salida literal de aplicación.
- Confirmar que se actuó contra el estado real de beta.
- Conservar evidencia de rollback y reaplicación según la validación aprobada.

Resultado esperado: migración aplicada, rollback validado y reaplicación PASS.

## Paso 4 — Desplegar beta

- Ejecutar `Deploy app-beta` sobre el SHA aprobado.
- Confirmar destino: `reformando-app-beta` en `/docker/reformando-app-beta`.
- No tocar `reformando-beta`.
- Conservar el enlace y resultado del workflow.

Parar ante cualquier fallo de configuración, build o servicio incorrecto.

## Paso 5 — Verificar health check

- Consultar `https://app-beta.reformando.pro/api/health` con credenciales autorizadas.
- Exigir HTTP 200, JSON válido, `status: ok` y SHA esperado.
- Registrar duración, timestamp y respuesta sanitizada.

Resultado esperado: health check PASS y SHA coincidente.

## Paso 6 — Ejecutar login y organización

- Iniciar sesión con owner QA.
- Confirmar organización y membership.
- Repetir lectura con admin y member.
- Cerrar sesión y confirmar bloqueo anónimo.

Resultado esperado: contexto correcto, sin fuga de organización ni acceso anónimo.

## Paso 7 — Ejecutar flujo de datos núcleo

En este orden:

1. Crear o localizar cliente.
2. Crear obra.
3. Editar obra.
4. Crear y editar fases.
5. Crear tareas con fase, prioridad y fecha.
6. Editar tareas y cambiar estado.
7. Verificar Kanban y persistencia tras recarga.
8. Crear y cerrar incidencias.

Registrar cada acción con `evidence-template.md`. Resultado esperado: persistencia correcta y cero 500/503.

## Paso 8 — Ejecutar matriz de permisos

- Owner/admin: editar proyectos y tareas autorizadas.
- Member: ejecutar únicamente lecturas/escrituras permitidas por RLS.
- Otra organización: intentar lectura y escritura sobre datos ajenos; debe quedar aislada.
- Anónimo: intentar rutas protegidas; debe ser denegado.
- Registrar si la denegación es error explícito o no-op RLS, sin considerar ambos como éxito sin verificar la fila.

Resultado esperado: cero bypass y cero fuga multi-tenant.

## Paso 9 — Revisar observabilidad

Durante los pasos 3–8, revisar logs en estos puntos:

- tras migración;
- tras health check;
- tras cada flujo núcleo;
- al terminar el piloto.

Buscar 401/403 inesperados, denegaciones RLS, 500/503, errores PostgreSQL, latencias y discrepancias de SHA. Escalar P0/P1 y detener la ejecución.

## Paso 10 — Ejecutar obra piloto

- Crear y emitir un presupuesto.
- Generar la obra desde el presupuesto.
- Crear al menos 5 tareas.
- Completar las 5 tareas.
- Registrar al menos 2 incidencias.
- Cerrar las 2 incidencias.
- Medir tiempo hasta primer valor, objetivo menor de 60 minutos.
- Medir pantallas núcleo, objetivo menor de 3 segundos.
- Confirmar cero intervención manual en BD y cero pérdida de datos.

## Paso 11 — Cerrar o hacer NO-GO

Emitir **GO** solo si:

- migración, rollback y reaplicación tienen evidencia literal;
- health check y SHA pasan;
- matriz de permisos y aislamiento pasan;
- obra piloto completa sus métricas;
- no hay P0/P1 abiertos.

Emitir **NO-GO** ante pérdida de datos, fuga multi-tenant, flujo central bloqueado, migración inconsistente, health check fallido, 500/503 no explicado o intervención manual en BD.

## Referencias sin duplicar instrucciones

- Detalle de despliegue y rollback: `docs/deploy/beta-runbook.md`.
- Detalle de health check y smoke: `docs/deploy/beta-post-deploy-smoke.md`.
- Casos funcionales y severidades: `docs/qa/beta-functional-audit.md`.
- Métricas y GO/NO-GO del piloto: `docs/qa/pilot-project-runbook.md`.
- Formato de evidencia: `docs/qa/evidence-template.md`.
- Señales y escalado: `docs/qa/beta-observability.md`.
