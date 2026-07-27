# B18 — Seguridad y RLS

## Alcance

B18 protege `public.project_task_issues` y corrige los cuatro helpers de
autorización existentes. No modifica migraciones históricas ni concede grants
de tabla. Los grants se mantienen como un contrato separado hasta disponer de
un snapshot ACL reconstruido y de pruebas que demuestren las operaciones
necesarias.

## Incidencias

La tabla de incidencias se creó en `20260706100000_project_task_issues.sql` sin
RLS ni políticas. B18 activa RLS y crea solamente:

- SELECT para usuarios `authenticated` miembros de la organización;
- INSERT para usuarios `authenticated` miembros de la organización cuyo
  `reporter_user_id` coincide con `auth.uid()`.

Ambas políticas comprueban simultáneamente:

1. el proyecto pertenece a `organization_id`;
2. la tarea pertenece al proyecto;
3. la tarea pertenece a la organización;
4. el usuario pertenece a la organización.

No se crean políticas UPDATE ni DELETE.

La migración rechaza políticas con nombres inesperados en la tabla, para evitar
combinar B18 con una política permisiva no revisada.

## Helpers

`is_org_member`, `is_org_admin`, `org_has_any_membership` e
`is_client_in_org` conservan sus firmas. Se definen como `SECURITY DEFINER`,
usan `search_path = pg_catalog, public`, cualifican las tablas y restauran
`row_security` en retorno normal, retorno temprano y excepción.

`EXECUTE` se revoca a `PUBLIC` y se concede únicamente a `authenticated`, que
es el rol que ejecuta las políticas. No se concede a `anon` ni a
`service_role`.

Los helpers `org_has_any_membership` e `is_client_in_org` mantienen el
`EXECUTE` para `authenticated` porque las políticas históricas de bootstrap y
de proyectos los utilizan. Para evitar enumeración directa:

- un usuario sin pertenencia a la organización no puede consultar clientes;
- un usuario que no pertenece a una organización recibe un resultado
  conservador que impide el bootstrap, sin revelar si existen membresías;
- `auth.uid()` nulo devuelve siempre falso;
- las pruebas comprueban Alpha/Beta y usuario externo.

El propietario efectivo debe ser el rol controlado que aplica las migraciones y
debe verificarse en PostgreSQL/Supabase local. B18 no cambia propietarios con
un nombre de rol asumido. En el entorno CI efímero el propietario esperado es
`postgres`, porque el bootstrap y las migraciones se ejecutan con ese usuario;
la migración aborta si el propietario previo de cualquiera de los cuatro
helpers no coincide con el usuario aplicador.

## Grants

B18 captura primero un snapshot ejecutable del ACL de esos cinco privilegios.
Solo concede los que estaban ausentes en el baseline. El snapshot se conserva
en `public.b18_grant_baseline` hasta la compensación y se elimina al finalizar.
La compensación revoca únicamente los privilegios marcados como añadidos por
B18; los privilegios preexistentes se conservan.

Los privilegios son SELECT sobre `memberships`, `projects` y `project_tasks`,
y SELECT/INSERT sobre `project_task_issues`. `anon` no recibe acceso de negocio
y `service_role` no recibe DML global.

## Rollback

El rollback elimina las dos políticas B18, pero mantiene RLS activado. El
baseline histórico deja la tabla sin RLS, y restaurarlo produciría una
exposición; por eso el rollback es deliberadamente fail-closed.

La reversión de B18 es una compensación fail-closed, no un rollback exacto:

- elimina las políticas B18;
- revoca únicamente los grants de tabla añadidos por B18;
- mantiene RLS activado y sin políticas;
- conserva las definiciones corregidas de los helpers;
- no restaura `EXECUTE` a `PUBLIC`.

Esto puede interrumpir temporalmente la funcionalidad, pero no restaura la
exposición histórica de una tabla sin RLS ni la fuga de `row_security`.

## Validación local requerida

En una base Supabase/PostgreSQL desechable:

1. snapshot de tablas, RLS, políticas, ACL, propietarios y funciones;
2. aplicar todas las migraciones históricas anteriores a B18;
3. aplicar B18 y sus grants mínimos;
4. crear fixtures sintéticos para Alpha y Beta;
5. probar owner/admin/member, usuario sin membresía y `anon`;
6. probar SELECT/INSERT legítimos y todos los cruces de organización,
   proyecto, tarea y reporter;
7. confirmar UPDATE/DELETE denegados;
8. comprobar firma, propietario, `SECURITY DEFINER`, `search_path`, ACL y
   restauración de `row_security`;
9. ejecutar la compensación y verificar RLS activado, sin políticas y sin
   grants B18;
10. reaplicar B18 y repetir las comprobaciones.

Ejecutar:

```text
psql -v ON_ERROR_STOP=1 -f supabase/validation/b18-security-rls.sql
```

El script contiene consultas y aserciones ejecutables; los casos con identidad
de usuario requieren fixtures y claims locales, y no se consideran ejecutados
hasta disponer de evidencia PostgreSQL real.

## Pospuesto

- matriz fina `project_manager`, `worker` y `client`;
- portal de clientes;
- Storage;
- RPCs de actualización por columnas;
- grants adicionales a `authenticated`;
- cualquier uso de `service_role` desde la aplicación.
