# R1: runbook de aplicación remota controlada

Estado: preparado para revisión. Este documento no autoriza por sí mismo la
ejecución de SQL remoto.

## 1. Identidad

- Proyecto Supabase: `hafljwojvblyfljddjcr`.
- Rama/base de aplicación: `main`.
- SHA de `main` integrado: `1b0bd622123929409953584c2bad70a17a570190`.
- Migración exacta: `supabase/migrations/20260801130000_r1_acl_orphan_tables_hardening.sql`.
- Rollback exacto: `supabase/rollbacks/20260801130000_r1_acl_orphan_tables_hardening.rollback.sql`.
- R1 y este procedimiento no incluyen R2, R3, `--include-all`, repair ni seed.

## 2. Backup obligatorio

Antes de cualquier escritura, verificar de nuevo el backup:

- Run: `30677113749`.
- Artifact: `supabase-staging-backup-public-schema`.
- SHA-256 ZIP: `3444d3decc5aa1a80a066a1923bf4723a43d97ad25356271eb10a35ae5ee934e`.
- SHA-256 dump: `52e0c874475a541cb5e70adec0011f031111509fbd60fcd3cd6b353312ac9059`.

Procedimiento:

1. Descargar el artifact mediante GitHub CLI.
2. Confirmar ZIP válido, nombre del archivo interno y tamaño mayor que cero.
3. Calcular ambos SHA-256 y compararlos literalmente con los valores anteriores.
4. Confirmar que el artifact no está expirado y corresponde al proyecto
   `hafljwojvblyfljddjcr`.
5. Detenerse si falta el artifact, cambia cualquier hash o el dump no es legible.

## 3. Preflight read-only

Antes de escribir:

1. Confirmar que `Deploy app-beta` está `disabled_manually`.
2. Ejecutar el workflow manual
   `verify-public-table-security.yml` con:
   `confirm_project_ref=hafljwojvblyfljddjcr`.
3. Verificar artifact no vacío, `server_version_num`, reglas completadas y
   excepciones.
4. Aceptar únicamente las violaciones pre-R1 ya documentadas en la evidencia
   aprobada. Cualquier violación nueva, regla no verificada o excepción activa
   detiene el procedimiento.
5. Confirmar que `public-table-security-exceptions.json` sigue vacío.

No ejecutar la aplicación si el verificador no termina con evidencia válida y
exit 0, o si el backup no coincide exactamente.

## 4. Mecanismo de aislamiento elegido

`supabase db push` no acepta un nombre de fichero para seleccionar una migración:
aplica todas las migraciones locales pendientes en orden. Nunca se debe pasar el
nombre de R1 a `db push` esperando que seleccione solo ese fichero.

La opción elegida es **A/C: workspace temporal mínimo dentro de un workflow
dedicado**, con `--dry-run` obligatorio. No se modifica el árbol versionado ni se
falsea `schema_migrations`.

El runner debe demostrar primero que la CLI ofrece el mecanismo:

```bash
supabase db push --help | tee "$RUNNER_TEMP/db-push-help.txt"
grep -F -- '--dry-run' "$RUNNER_TEMP/db-push-help.txt"
```

Si `--dry-run` no aparece, se aborta. El workflow hará checkout exacto de `main`,
obtendrá mediante `supabase migration list` la lista read-only ya registrada y
creará un directorio temporal nuevo. Copiará allí únicamente las migraciones ya
registradas y `20260801130000_r1_acl_orphan_tables_hardening.sql`.

Cada nombre debe terminar en `.sql`, existir localmente y copiarse sin modificar.
R1 se compara byte a byte con `main` y no se permite ningún fichero adicional.

En ese workspace se ejecuta:

```bash
supabase db push --dry-run --db-url "$SUPABASE_STAGING_DB_URL" \
  > "$RUNNER_TEMP/r1-dry-run.txt" 2>&1
```

El plan se guarda como artifact y se parsea a nombres. Debe contener exactamente:

```text
count=1
name=20260801130000_r1_acl_orphan_tables_hardening.sql
timestamp=20260801130000
```

Se aborta con cero, dos o más entradas, nombre o timestamp distinto, cualquier
M1/M2/M3/M4 u otra migración, error del dry-run o plan no verificable.

Solo tras una aprobación separada podría ejecutarse `supabase db push` desde ese
workspace; no se pasa ningún nombre de fichero.

La opción B — aplicar SQL directo y registrar manualmente
`supabase_migrations.schema_migrations` — queda descartada y no se implementa:
sería una reparación manual del historial y exige aprobación específica.

Está prohibido `--include-all`, `migration repair`, `seed`, SQL directo, DDL/DML
adicional y cualquier deploy.

## 5. Verificación posterior inmediata

Ejecutar, sin conceder privilegios ni modificar fixtures preexistentes:

```bash
node scripts/ci/r1-acl-orphan-tables-smoke.mjs --privileges
node scripts/ci/r1-acl-orphan-tables-smoke.mjs --authorized
node scripts/ci/r1-acl-orphan-tables-smoke.mjs --denied
node scripts/ci/r1-acl-orphan-tables-smoke.mjs --adversarial
```

Después ejecutar:

1. `verify-public-table-security.yml` read-only.
2. Diagnóstico read-only de ACL/RLS y baseline de R1.
3. Conteo e identidad de filas antes/después en `budgets`, `budget_items`,
   `materials`, `notifications` y `tasks`.
4. Confirmación de RLS activa, cero policies en tablas deny-all y ACL esperada.

## 6. Smoke funcional de app-beta

Solo después de que los smokes de seguridad pasen:

- login;
- onboarding;
- lectura de proyectos;
- escritura legítima de proyectos;
- lectura/escritura de tareas autorizadas;
- aislamiento entre dos organizaciones.

Detenerse si aparece cualquier error ACL/RLS, pérdida de sesión, operación
autorizada rechazada o acceso cruzado entre organizaciones.

## 7. Criterios de rollback

Hacer rollback inmediato si:

- falla cualquier smoke;
- cambia el número o identidad de filas;
- `service_role` pierde una operación de su contrato;
- `authenticated` pierde acceso necesario;
- `PUBLIC` o `anon` conservan privilegios indebidos;
- RLS no queda activa;
- aparece una violación inesperada;
- el verificador no produce evidencia completa.

## 8. Rollback

Tras detener operaciones y conservar logs/artifacts, la ejecución autorizada sería
el rollback exacto asociado a la migración R1, mediante el procedimiento aprobado
para el entorno. Después:

1. Verificar restauración exacta de ACL, grant options, RLS, default ACL gestionado
   y baselines.
2. Ejecutar nuevamente los cuatro modos del smoke y el verificador read-only.
3. Confirmar filas intactas y conservar la evidencia.

Advertencia: **el rollback restaura deliberadamente la exposición pre-R1**. No
reintentar la aplicación hasta una nueva aprobación explícita.

## 9. Riesgo residual

- Los default ACL de `supabase_admin` no tienen mitigación definitiva.
- La aceptación temporal dura como máximo siete días desde su aprobación.
- Product Owner es responsable hasta designar DBA/Supabase owner.
- Está prohibido crear tablas en `public` mediante `supabase_admin`.
- El verificador read-only es obligatorio antes y después de cada `db_push`.
- Cualquier nueva tabla con owner `supabase_admin` requiere tratamiento y
  aprobación explícitos; no se permite una excepción genérica.

## 10. Checklist y veredicto

- [ ] Backup verificado con ambos SHA-256.
- [ ] Proyecto y `main` confirmados.
- [ ] `Deploy app-beta` permanece `disabled_manually`.
- [ ] Preflight read-only válido y sin violaciones nuevas.
- [ ] Cero excepciones activas.
- [ ] Solo R1 identificada para aplicación.
- [ ] No `--include-all`, repair, seed ni deploy.
- [ ] Cuatro modos del smoke ejecutados y correctos.
- [ ] Verificador posterior correcto.
- [ ] Filas de tablas huérfanas intactas.
- [ ] Smoke funcional app-beta correcto.
- [ ] Rollback disponible y criterio de parada conocido.

Veredicto final pendiente:

`GO PARA APLICAR R1 REMOTAMENTE`

o

`NO-GO PARA APLICAR R1 REMOTAMENTE`
