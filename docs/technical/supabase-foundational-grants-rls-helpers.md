# Corrección fundacional Supabase: grants y helpers RLS

## Causa raíz

Las migraciones crean políticas para `authenticated`, pero no conceden
privilegios de tabla explícitos. RLS decide qué filas puede usar un rol, pero no
otorga privilegios de tabla: sin `SELECT`, `INSERT`, `UPDATE` o `DELETE`, la
política no llega a evaluarse.

El código no usa `service_role`. Las rutas actuales usan cliente SSR con la
sesión del usuario o cliente público anon. La migración lo trata como rol
administrativo Supabase mediante privilegios DML explícitos, sin `GRANT ALL`, y
no lo expone a la aplicación.

Las cuatro funciones auxiliares ejecutaban
`set_config('row_security', 'off', true)` y no restauraban el valor anterior.
El tercer argumento `true` hace el cambio local a la transacción, no local a la
llamada de función; podía afectar consultas posteriores de la misma transacción.

## Solución

`20260727090000_supabase_foundational_grants_rls_helpers.sql`:

- concede privilegios explícitos a `authenticated` para operaciones cubiertas
  por las políticas actuales;
- aborta antes de conceder privilegios si `project_task_issues` no tiene RLS y
  las políticas B16 de lectura e inserción esperadas;
- concede DML explícito a `service_role` en las tablas de aplicación;
- conserva RLS como control de filas para `authenticated`;
- restaura `row_security` después de cada helper, también en excepciones;
- revoca ejecución pública de los helpers y concede `EXECUTE` a
  `authenticated`;
- tiene rollback explícito.

## Matriz propuesta

| Grupo | authenticated | service_role | anon |
|---|---|---|---|
| organizations, memberships, clients, projects | DML según políticas RLS | DML explícito administrativo | Ninguno |
| project_tasks | SELECT/INSERT/UPDATE según RLS | DML explícito administrativo | Ninguno |
| profiles | SELECT/INSERT/UPDATE según RLS | DML explícito administrativo | Ninguno |
| comments, documents, progress, costs, purchases, purchase items, phases, invitations, templates y derivados | Operaciones definidas por políticas RLS | DML explícito administrativo | Ninguno |
| budgets y budget lines | DML según políticas RLS | DML explícito administrativo | Ninguno |
| project_task_issues | SELECT/INSERT según RLS | DML explícito administrativo | Ninguno |

## Validación pendiente

`supabase/validation/foundational-grants-rls-helpers.sql` comprueba ACL,
`EXECUTE`, funciones y restauración transaccional de `row_security`. Claude Code
debe añadir fixtures sintéticos y ejecutar la matriz RLS, los casos anon,
authenticated y service_role, rollback y reaplicación en Docker/Supabase local.

El protocolo debe ejecutar también un caso negativo sobre un baseline sin B16:
la migración fundacional debe abortar antes de sus grants y `authenticated` no
debe recibir `SELECT` ni `INSERT` sobre `project_task_issues`. Sobre un baseline
con B16 aplicado, la misma migración debe continuar y superar la matriz completa.

El rollback no revoca `USAGE` del esquema `public`, porque ese privilegio forma
parte del baseline reproducible de Supabase y no lo añade esta migración.
