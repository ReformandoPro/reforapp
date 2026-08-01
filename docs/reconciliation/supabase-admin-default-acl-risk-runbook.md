# Supabase `supabase_admin` default ACL: aceptación temporal controlada

Estado: control operativo temporal. R1 observa y endurece los objetos existentes,
pero no puede modificar los default ACL cuyo grantor es `supabase_admin`.

## Riesgo

Una tabla nueva creada en `public` por `supabase_admin` puede heredar privilegios
amplios para `PUBLIC`, `anon`, `authenticated` o `service_role`. Esto puede
reintroducir exposición aunque las tablas actuales estén protegidas por R1.

## Responsable y plazo

El responsable es el Product Owner hasta designar formalmente un DBA/Supabase
owner. El riesgo debe resolverse dentro de siete días desde la aprobación de esta
aceptación y, en cualquier caso, antes de crear otra tabla en `public`.

## Prohibición inmediata

No crear tablas en `public` mediante `supabase_admin`. Las nuevas migraciones deben
usar el rol gestionable aprobado y dejar explícitos owner, RLS, policies y ACL.

## Antes de cada `db_push`

1. Confirmar backup descargable, íntegro y correspondiente al proyecto.
2. Revisar el diff de migraciones y comprobar que no crea tablas con
   `supabase_admin` como owner.
3. Ejecutar `node scripts/ci/verify-public-table-security.mjs` contra el entorno
   objetivo en modo read-only.
4. Detenerse ante cualquier violación, excepción caducada o tabla no inventariada.

## Después de cada `db_push`

1. Ejecutar de nuevo el verificador read-only.
2. Confirmar owner, RLS, policies y ACL de cada tabla `public`.
3. Comparar la lista de tablas antes/después.
4. Conservar el artifact de evidencia junto al run de CI.
5. No considerar completado el cambio si aparece owner `supabase_admin` sin
   excepción aprobada, privilegio de `PUBLIC`/`anon`, `TRUNCATE` o `MAINTAIN` para
   `authenticated`, o una tabla sin las policies requeridas.

## Incidente

Si el verificador falla: congelar nuevos cambios de esquema, no ejecutar otro
`db_push`, conservar logs y backup, avisar al Product Owner/DBA y ejecutar solo
consultas read-only hasta identificar el objeto. No revocar ni conceder ACL de
forma manual sin una baseline y autorización explícitas.

## Rollback

El rollback de la migración aplicada debe ejecutarse únicamente con el backup
verificado y el procedimiento aprobado para esa migración. Primero se compara el
estado actual con la baseline; después se restaura y se vuelve a ejecutar el
verificador. Si no hay igualdad exacta o el owner no es gestionable, se detiene el
rollback y se escala al DBA/Supabase owner.

## Cierre definitivo

El control temporal se cierra cuando una cuenta autorizada modifica de forma
verificable los default ACL de `supabase_admin`, una tabla de prueba demuestra que
los defaults son seguros, el rollback de la prueba es exacto y dos ejecuciones
read-only consecutivas pasan sin excepciones. Hasta entonces esta aceptación no
autoriza por sí sola la aplicación remota de R1.
