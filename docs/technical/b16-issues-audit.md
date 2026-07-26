# B16 — Incidencias de tareas

## Alcance cerrado

B16 mantiene las incidencias como anotaciones de texto inmutables asociadas a una tarea.
No incluye edición, eliminación, estados, severidad, responsables ni resolución.

La creación y lectura están disponibles para `owner`, `admin` y `member` dentro de su
organización. `reporter_user_id` siempre procede del usuario autenticado.

## Seguridad y coherencia

La migración original es `20260706100000_project_task_issues.sql`. La corrección posterior
`20260726090000_b16_issues_security.sql`:

- activa RLS;
- permite `SELECT` e `INSERT` solo a miembros autenticados;
- exige que el informante sea `auth.uid()`;
- valida organización, proyecto y tarea en las políticas;
- añade un trigger que impide relaciones cruzadas;
- añade un límite de 2.000 caracteres y rechaza texto vacío;
- no crea políticas de `UPDATE` o `DELETE`.

La migración `20260726090200_parent_integrity.sql` protege las tablas padre:

- `project_tasks.organization_id` no puede cambiar;
- `project_tasks.project_id` no puede cambiar si existen incidencias;
- `projects.organization_id` no puede cambiar.

El límite de 2.000 se mide en puntos de código Unicode después de `trim`. No se cuentan
grapheme clusters visuales.

La corrección de permisos de B15 está separada en
`20260726090100_b15_tasks_member_write.sql` y solo afecta a `project_tasks`.

Las garantías sobre tablas padre están en `20260726090200_parent_integrity.sql`:

- `protect_project_task_integrity`: `SECURITY DEFINER`, `search_path = pg_catalog, public`,
  trigger `BEFORE UPDATE` sobre `project_tasks`; impide cambiar organización y cambiar de
  proyecto cuando existen incidencias.
- `protect_project_organization_integrity`: `SECURITY INVOKER`, `search_path = pg_catalog, public`,
  trigger `BEFORE UPDATE` sobre `projects`; impide cambiar organización.

Ambas funciones tienen `EXECUTE` revocado para `PUBLIC` porque solo se utilizan como triggers.

## Validación local

```text
./node_modules/.bin/tsc --noEmit --incremental false
npm run lint
npm run test -- --no-cache
npm run build
```

La prueba de RLS requiere una instancia Supabase local o un entorno de pruebas con usuarios
de dos organizaciones. No se ejecutan migraciones remotas desde este bloque.

La verificación reproducible debe comprobar, con sesiones autenticadas de dos organizaciones:

1. `owner`, `admin` y `member` leen incidencias de su organización.
2. Ningún usuario lee incidencias de otra organización.
3. `owner`, `admin` y `member` insertan una incidencia válida.
4. Se rechaza una inserción con tarea de otra organización.
5. Se rechaza una inserción con proyecto que no contiene la tarea.
6. Se rechaza una inserción con `reporter_user_id` distinto de `auth.uid()`.
7. `UPDATE` y `DELETE` son rechazados porque no existen políticas para esas operaciones.

La comprobación debe ejecutarse después de aplicar las migraciones en una instancia local o
de pruebas y debe terminar con rollback de sus datos de fixture.

Antes de aplicar la migración, se diagnostican y se informan por cantidad las relaciones
incoherentes, descripciones inválidas y referencias inexistentes a proyectos, tareas o
perfiles. No se corrigen ni borran datos automáticamente.

Consultas de diagnóstico equivalentes:

```sql
select count(*)
from public.project_task_issues i
left join public.projects p
  on p.id = i.project_id and p.organization_id = i.organization_id
left join public.project_tasks t
  on t.id = i.task_id
 and t.project_id = i.project_id
 and t.organization_id = i.organization_id
where p.id is null or t.id is null;

select count(*)
from public.project_task_issues
where char_length(public.trim_project_task_issue_whitespace(description)) not between 1 and 2000;

select count(*)
from public.project_task_issues i
left join public.profiles p on p.user_id = i.reporter_user_id
where p.user_id is null;
```

El orden de aplicación es B16, permisos B15 y garantías de tablas padre. El rollback debe
ejecutarse en orden inverso: tablas padre, B15 y B16.

## Rollback

Los rollbacks correspondientes eliminan únicamente políticas, constraints, trigger y función
introducidos por las migraciones correctivas. El rollback B16 también desactiva RLS porque
el estado inicial conocido de esta tabla no tenía RLS. No eliminan la tabla ni sus datos.

## Contrato explícito de whitespace B16

La normalización elimina únicamente en los extremos `U+0009–U+000D`, `U+0020`,
`U+00A0`, `U+1680`, `U+2000–U+200A`, `U+2028`, `U+2029`, `U+202F`, `U+205F`,
`U+3000` y `U+FEFF`. Los espacios internos se conservan. El límite es de 2.000
puntos de código después de normalizar; no se aplica NFC ni NFD. TypeScript y
PostgreSQL usan implementaciones explícitas y no dependen de `trim()`, `\s`,
`[[:space:]]`, locale o collation. La función SQL es `IMMUTABLE`, no es
`SECURITY DEFINER` y conserva los permisos necesarios para su uso en constraint.

## Garantías de tareas padre

`protect_project_task_integrity` se ejecuta como `SECURITY DEFINER` en
`BEFORE INSERT OR UPDATE`. En ambos eventos valida proyecto-organización,
fase-proyecto-organización y responsable-organización. En UPDATE mantiene la
organización inmutable y bloquea el cambio de proyecto cuando existen incidencias,
incluso si el usuario no puede leerlas por RLS. El responsable solo necesita una
membresía en la organización.

## Casos SQL pendientes de ejecución

Todos los siguientes casos requieren PostgreSQL local o staging de pruebas y no
se afirma ningún resultado:

```sql
select public.trim_project_task_issue_whitespace(' ');
select public.trim_project_task_issue_whitespace(chr(9));
select public.trim_project_task_issue_whitespace(chr(10));
select public.trim_project_task_issue_whitespace(chr(160));
select public.trim_project_task_issue_whitespace(chr(5760));
select public.trim_project_task_issue_whitespace(chr(8199));
select public.trim_project_task_issue_whitespace(chr(8239));
select public.trim_project_task_issue_whitespace(chr(12288));
select public.trim_project_task_issue_whitespace(chr(65279));
select public.trim_project_task_issue_whitespace(chr(9) || chr(160) || chr(8200));
select public.trim_project_task_issue_whitespace(chr(160) || 'texto' || chr(8239));
select char_length(public.trim_project_task_issue_whitespace(repeat('a', 2000)));
select char_length(public.trim_project_task_issue_whitespace(repeat('a', 2001)));
```

También están pendientes los escenarios del trigger: INSERT con proyecto de otra
organización, fase de otro proyecto o responsable externo; UPDATE normal; cambio
de organización; cambio de proyecto sin incidencias; cambio conservando fase
anterior; cambio con incidencias; fase de otro proyecto; y responsable externo.
