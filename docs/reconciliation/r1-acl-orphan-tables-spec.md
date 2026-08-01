# R1 — Hardening de ACL y tablas huérfanas

Estado: especificación aprobada para revisión; no implementada.

## Alcance

R1 protege las tablas públicas legacy sin RLS y fija un baseline ACL explícito. No convierte tipos, no modifica filas y no aplica cambios remotos por sí sola.

## Baseline

Antes de cualquier cambio se captura, por tabla y privilegio, el resultado efectivo de `aclexplode(coalesce(relacl, acldefault('r', relowner)))` para `anon`, `authenticated` y `service_role`, además de los default ACL de `postgres` y `supabase_admin`.

El baseline cubre exactamente las tablas legacy detectadas (`budgets`, `budget_items`, `materials`, `notifications`, `tasks`) y los privilegios `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `REFERENCES`, `TRIGGER`, `TRUNCATE`, `MAINTAIN`. `anon`, `authenticated` y `service_role` se auditan y deciden por separado; no se heredan decisiones entre roles.

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

## Criterios de parada

Detenerse si falta una tabla, rol, baseline, privilegio esperado, owner conocido o prueba de necesidad de servidor; si aparece una policy desconocida; si el baseline cambia durante la operación; o si cualquier prueba de aislamiento falla.
