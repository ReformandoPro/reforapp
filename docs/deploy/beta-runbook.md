# Runbook operativo de beta — Reformando.app

## Alcance y autorización

Este runbook se ejecuta únicamente con aprobación explícita. No contiene secretos y no autoriza por sí solo acceso a VPS, Supabase remoto ni despliegue.

## Variables y precondiciones

Confirmar antes de empezar:

- SHA completo aprobado para `main`;
- project ref de Supabase staging documentado en el workflow;
- `APP_BETA_SSH_HOST`, `APP_BETA_SSH_USER`, `APP_BETA_SSH_PORT`;
- `APP_BETA_SSH_PRIVATE_KEY`, `APP_BETA_SSH_KNOWN_HOSTS`;
- `APP_BETA_HEALTH_USERNAME`, `APP_BETA_HEALTH_PASSWORD`;
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_STAGING_DB_URL`;
- backup descargado y localizable.
- prefijo de backup: `reformando-mvp-closure-before-grants`.

Nunca exponer `service_role` en código cliente, variables `NEXT_PUBLIC_*`, HTML, logs o capturas.

## Preflight de destino y base de datos

- **Lectura:** derivar el project ref de `NEXT_PUBLIC_SUPABASE_URL` de `reformando-app-beta` y compararlo con el project ref previsto para beta.
- Si no coincide, emitir `NO-GO` y no migrar ni desplegar.
- **Lectura:** confirmar que el contenedor es `reformando-app-beta` y no `reformando-beta`.
- **Lectura:** confirmar que el cliente no contiene `service_role` ni la expone mediante variables públicas.

## Secuencia

1. **Backup previo — escritura de artefacto:** ejecutar `Supabase Staging Ops (manual)` con `mode=backup_only`; descargar el artefacto con prefijo `reformando-mvp-closure-before-grants` y registrar nombre, hash, ubicación y timestamp.
2. **Aplicar migraciones — escritura de base de datos:** confirmar el project ref y ejecutar `mode=db_push` con `backup_confirmed=I_HAVE_DOWNLOADED_BACKUP`. Conservar la salida literal y confirmar que el destino es el estado real de beta.
3. **Smoke local/CI:** verificar migración, rollback, reaplicación y los smokes `authorized`, `denied` y `privileges` antes de tocar beta.
3. **Merge — escritura de repositorio:** mergear el PR aprobado en `main`. Este merge dispara automáticamente el deploy de beta.
4. **Desplegar aplicación — escritura de infraestructura:** dejar que `Deploy app-beta` ejecute el despliegue automático sobre el SHA aprobado. El destino debe ser únicamente `reformando-app-beta` en `/docker/reformando-app-beta`.
5. **Health check — lectura:** consultar `/api/health` con Basic Auth autorizada. Exigir HTTP 200, JSON válido, `status: "ok"`, campo `commit` presente y valor igual al SHA esperado.
6. **Smoke remoto:** ejecutar la matriz permitida/denegada y la obra piloto documentadas en `docs/qa/beta-functional-audit.md` y `docs/qa/pilot-project-runbook.md`.
7. **Cerrar o parar:** solo cerrar si se cumplen los criterios de `docs/product/mvp-closure-backlog.md`.

## Rollback y reaplicación

- Si falla la migración: detenerse, conservar logs y no mergear ni desplegar la aplicación.
- Si falla el health check: detener el smoke, conservar el SHA y logs, y seleccionar un SHA anterior conocido.
- Ejecutar el rollback de grants contra el mismo estado y conservar evidencia literal.
- Reaplicar solo después de identificar y corregir la causa; conservar ambas salidas.
- Para rollback de aplicación, reconstruir únicamente `reformando-app-beta` con un SHA conocido y verificar de nuevo `/api/health`.

## Criterios de parada inmediata

Parar ante cualquier P0/P1, backup ausente, project ref incorrecto, SHA discrepante, secreto faltante, migración parcial, 401/403 inesperado en flujo autorizado, 500/503, error PostgreSQL o evidencia de fuga multi-tenant.
