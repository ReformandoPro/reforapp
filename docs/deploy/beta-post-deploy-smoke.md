# Smoke remoto post-despliegue — app-beta

Este procedimiento es operativo y debe ejecutarse solo con autorización explícita. No incluye credenciales en comandos ni permite usar la VPS desde un entorno de desarrollo.

## Precondiciones

- SHA objetivo de `main` confirmado.
- Workflow de aplicación completado.
- Migraciones aplicadas mediante `Supabase Staging Ops (manual)` en modo `db_push`.
- Backup descargado y confirmado.
- Variables/secretos disponibles únicamente en GitHub Actions o el gestor autorizado:
  `SUPABASE_STAGING_DB_URL`, `SUPABASE_ACCESS_TOKEN`, `APP_BETA_HEALTH_USERNAME`, `APP_BETA_HEALTH_PASSWORD`.
- Proyecto Supabase staging confirmado por su project ref documentado en el workflow.

## Comandos y comprobaciones

### 1. Verificar migraciones

Ejecutar el workflow manual `Supabase Staging Ops (manual)` con `mode=db_push`, confirmación de backup y project ref correcto. Debe terminar con `supabase db push` exitoso y sin conflictos.

### 2. Verificar aplicación

El workflow `Deploy app-beta` se dispara por push a `main` o manualmente con un SHA completo. Debe validar secretos, construir `reformando-app-beta` y no tocar `reformando-beta`.

### 3. Health check

Desde el runner autorizado:

```bash
curl --fail --silent --show-error --max-time 10 \
  --user "$APP_BETA_HEALTH_USERNAME:$APP_BETA_HEALTH_PASSWORD" \
  https://app-beta.reformando.pro/api/health
```

PASS solo si devuelve HTTP 200, JSON válido, `status: "ok"` y el SHA esperado.

### 4. Smoke autenticado

Con una sesión QA legítima, ejecutar los casos de `docs/qa/beta-functional-audit.md` en este orden:

1. login y organización;
2. clientes;
3. proyecto piloto;
4. fases;
5. tareas y Kanban;
6. incidencias;
7. permisos y aislamiento;
8. responsive y errores.

Registrar timestamp, ruta, status, duración, usuario/organización anonimizados y evidencia sanitizada. Nunca registrar cookies, JWT, contraseñas o claves.

## Limpieza

- No borrar datos reales.
- Identificar cualquier dato QA creado durante el smoke.
- Eliminarlo solo mediante procedimiento autorizado posterior y con orden de dependencias documentado.
- Confirmar que no quedan sesiones, secretos o artefactos temporales en logs.

## PASS/FAIL

PASS requiere health check correcto, migraciones confirmadas, smoke funcional completo, aislamiento verificado y cero P0/P1.

FAIL ante cualquier 500/503 inesperado, fuga multi-tenant, escritura no autorizada, pérdida de datos, migración incompleta o bloqueo de un flujo central.
