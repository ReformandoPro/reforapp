# R2 — Hardening de helpers y bootstrap de memberships

Estado: especificación aprobada para revisión; no implementada.

## Helpers objetivo

Reemplazar atómicamente los cuerpos de:

- `public.is_org_member(uuid)`
- `public.is_org_admin(uuid)`
- `public.org_has_any_membership(uuid)`
- `public.is_client_in_org(uuid, uuid)`
- `public.org_is_empty_for_bootstrap(uuid)`

Cada función debe usar `SECURITY DEFINER`, `SET search_path = pg_catalog, public`, conservar la firma canónica y restaurar el valor previo de `row_security` tanto en retorno normal como en excepción. La restauración debe ocurrir antes de cada retorno temprano y en un bloque de excepción que relance el error.

## Privilegios

- Revocar `EXECUTE` de `public` y `anon` para las cinco funciones.
- Conceder `EXECUTE` únicamente a `authenticated`.
- Verificar owner, `prosecdef`, `proconfig`, argumentos y cuerpos después del cambio.
- No conceder privilegios a `service_role` salvo evidencia independiente y aprobación explícita.

## Bootstrap

Reemplazar atómicamente la policy de inserción de `memberships` para que el primer owner solo pueda insertarse cuando el usuario autenticado coincide con `user_id`, el rol es `owner` y `org_is_empty_for_bootstrap(organization_id)` es verdadero. Un usuario no autenticado, un segundo owner o una organización con cualquier membership deben ser rechazados.

## Pruebas obligatorias

- Primer owner válido: éxito.
- Segundo owner en organización no vacía: rechazo.
- Usuario autenticado que intenta crear owner para otro usuario: rechazo.
- Owner/admin existente: puede ejecutar las operaciones autorizadas por sus policies.
- Member: solo puede realizar las operaciones de miembro.
- `anon`: no puede ejecutar helpers ni insertar membership.
- Excepción dentro de helper: `row_security` vuelve al valor anterior.
- No hay recursión de policies ni fuga de existencia de organizaciones.

## Rollback

Capturar antes de modificar las definiciones remotas completas, owners, atributos, `proconfig`, grants y policies. El rollback restaura esas definiciones capturadas y los grants exactos; no usa cuerpos del repositorio como sustituto de la evidencia remota.

## Criterios de parada

Detenerse si falta cualquiera de las cinco funciones, si una firma está sobrecargada de forma inesperada, si el owner o `search_path` difiere sin explicación, si existe una policy de bootstrap desconocida, si falla la restauración de `row_security`, o si alguna prueba de anon/member/admin/owner no produce el resultado esperado.
