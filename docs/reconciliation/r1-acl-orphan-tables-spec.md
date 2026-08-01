# R1 — Hardening de ACL y tablas huérfanas

Estado: especificación aprobada para revisión; no implementada.

## Alcance

R1 protege las tablas públicas legacy sin RLS y fija un baseline ACL explícito. No convierte tipos, no modifica filas y no aplica cambios remotos por sí sola.

## Baseline

Antes de cualquier cambio se captura, por tabla y privilegio, el resultado efectivo de `aclexplode(coalesce(relacl, acldefault('r', relowner)))` para `anon`, `authenticated` y `service_role`, además de los default ACL de `postgres` y `supabase_admin`.

El baseline cubre exactamente las tablas legacy detectadas (`budgets`, `budget_items`, `materials`, `notifications`, `tasks`) y los privilegios `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `REFERENCES`, `TRIGGER`, `TRUNCATE`, `MAINTAIN`. `anon`, `authenticated` y `service_role` se auditan y deciden por separado; no se heredan decisiones entre roles.

## Resolución segura del owner

La autoridad para cada objeto se resuelve en este orden:

1. owner real del objeto leído desde el catálogo;
2. `postgres`, únicamente si coincide con la evidencia de ownership y el entorno lo permite;
3. `supabase_admin`, solo con autorización explícita para ese objeto y operación;
4. abortar si el owner no puede determinarse sin suposición.

Nunca se sustituye un owner desconocido por `postgres` o `supabase_admin` por conveniencia.

## Exhaustividad de tablas

Antes del baseline se cruzan tres inventarios: tablas referenciadas por server actions, repositories y queries del código; tablas usadas por el cliente `service_role`; y tablas físicas `public` obtenidas de `pg_class`. El resultado debe documentar cada diferencia y demostrar que no existe una tabla utilizada por la aplicación fuera de la lista R1. La comprobación falla si hay acceso dinámico, nombre construido, tabla omitida o dependencia no clasificada.

## Estado objetivo

- Revocar `TRUNCATE` y `MAINTAIN` explícitamente de los tres roles.
- Aplicar RLS deny-all a las tablas legacy, sin políticas permisivas para roles de cliente.
- Conservar las operaciones de servidor mediante grants mínimos y explícitos únicamente donde exista una prueba de necesidad.
- No revocar privilegios del owner ni alterar funciones, secuencias o tablas fuera del alcance.
- Normalizar default ACL de `postgres` y `supabase_admin` solo después de comparar el baseline y obtener aprobación de las diferencias.

## Rollback exacto

El rollback restaura, por tabla, rol y privilegio, exactamente el baseline capturado; elimina únicamente las políticas RLS creadas por R1 y restaura los default ACL previos de cada grantor. Si un privilegio no estaba presente en el baseline, permanece revocado. No se usa `GRANT ALL` ni se reconstruyen ACL por aproximación.

## Pruebas adversarias

- `anon` no puede leer, insertar, actualizar, borrar, truncar ni mantener ninguna tabla legacy.
- `authenticated` no puede acceder sin una política explícita.
- `service_role` conserva únicamente el acceso de servidor aprobado.
- La tabla permanece protegida con RLS después de un `SET ROLE` permitido.
- Nuevas tablas no reciben privilegios de cliente inesperados por default ACL.
- El rollback reproduce byte a byte el conjunto lógico de grants del baseline.

## Fixtures y smokes

Los fixtures se cargan en un entorno aislado y deben terminar con código `0`, conteos esperados y cero filas fuera del scope autorizado. Los smokes concretos son:

- `anon`: cada operación de lectura/escritura sobre las cinco tablas devuelve rechazo;
- `authenticated`: acceso sin policy devuelve rechazo;
- `service_role`: solo las operaciones documentadas devuelven éxito;
- comprobación de `relrowsecurity = true` y ausencia de policies permisivas inesperadas;
- creación de una tabla de prueba y verificación de que no recibe grants de cliente por default ACL;
- ejecución del rollback y comparación de grants contra el snapshot inicial.

Cada smoke debe registrar comando, identidad efectiva, resultado esperado, resultado observado y código de salida. Un resultado distinto de `0` donde se espera éxito, o distinto de rechazo donde se espera denegación, detiene R1.

## Criterios de parada

Detenerse si falta una tabla, rol, baseline, privilegio esperado, owner conocido o prueba de necesidad de servidor; si aparece una policy desconocida; si el baseline cambia durante la operación; o si cualquier prueba de aislamiento falla.
