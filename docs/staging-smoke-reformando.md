# Staging smoke plan — Reformando.app (MVP privado /app)

Fecha: 2026-06-28
Rama objetivo: `feature/app-consolidation`

Este documento define el **mínimo** necesario para poder ejecutar un smoke test funcional real del MVP privado (zona `/app`) sobre un entorno Supabase staging.

---

## 1) Variables de entorno necesarias

### Requeridas (para /app y SSR)
Config pública (segura para el navegador):

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase (staging)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key del proyecto Supabase (staging)

> Importante: el MVP **no** debe usar service role key.

### Opcionales (solo para la demo pública /projects)
La demo pública `/projects` tiene un modo “Supabase read” con fallback a mock (no afecta a `/app`).

- `NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID` — orgId a usar para leer Project Cards desde Supabase en `/projects`
- `NEXT_PUBLIC_SUPABASE_DEBUG=1` — habilita warnings del fallback (útil para diagnosticar)

---

## 2) Checklist DB (Supabase staging)

### 2.1 Migraciones
Aplicar todas las migraciones del repo (carpeta `supabase/migrations`).

Mínimo esperado para el MVP privado integrado:
- `20260628025000_project_tasks.sql`
- `20260628123300_project_tasks_assignee.sql`
- `20260628132500_profiles.sql`
- `20260628132600_project_tasks_assignee_fk_profiles.sql`
- `20260628133500_project_task_comments.sql`
- `20260628134000_project_documents.sql`
- `20260628134700_project_progress_updates.sql`
- `20260628135500_project_budgets.sql`
- `20260628141000_project_costs.sql`
- `20260628143000_project_purchases.sql`
- `20260628150000_project_phases.sql`
- `20260628152000_clients_address_notes.sql`

(…cada una con su rollback correspondiente en el repo.)

### 2.2 Bucket / Storage
- Bucket: `project-documents`
- Debe ser **private**.
- Deben existir políticas en `storage.objects` para:
  - SELECT: miembros de la org (vía `memberships`) y matching `project_documents.file_path`
  - INSERT: owner/admin y validación path `{org}/{project}/...` coherente
  - DELETE: uploader o owner/admin (resolviendo via `project_documents`)

### 2.3 RLS / Policies
Asegurar:
- RLS habilitado en tablas nuevas del MVP privado.
- Aislamiento por `organization_id`.
- Escrituras restringidas por rol (`owner/admin`) donde aplique.

---

## 3) Seed mínimo requerido (sin secretos)

### 3.1 Entidades mínimas
- 1 organización
- 2 usuarios (Supabase Auth):
  - `owner` o `admin`
  - `member`
- 2 memberships (uno por usuario)

Opcional:
- 1 cliente
- 1 obra
- 1 segunda organización + usuario (o el mismo usuario con membership distinta) para probar aislamiento.

### 3.2 Creación de usuarios (recomendado)
Crear usuarios desde el panel de Supabase Auth (staging):
- `owner@example.com`
- `member@example.com`

Tras crear usuarios, obtener sus `user_id` (UUID) desde Auth.

> Nota: existe tabla `public.profiles` con trigger para autoprovisionar/backfill desde `auth.users`. Aun así, tras crear usuarios conviene verificar que `profiles` contiene filas para ellos.

---

## 4) SQL orientativo de seed (sin secretos reales)

> Sustituye los placeholders `<<...>>` por valores reales del staging.

### 4.1 Organización
```sql
-- 1) Crear organización (ajusta nombres de columnas si tu tabla difiere)
insert into public.organizations (id, name, created_at)
values ('<<org_id_1>>'::uuid, 'Org Smoke 1', now());
```

### 4.2 Memberships
```sql
-- 2) Owner/admin membership
insert into public.memberships (organization_id, user_id, role, created_at)
values ('<<org_id_1>>'::uuid, '<<owner_user_id>>'::uuid, 'owner', now());

-- 3) Member membership
insert into public.memberships (organization_id, user_id, role, created_at)
values ('<<org_id_1>>'::uuid, '<<member_user_id>>'::uuid, 'member', now());
```

### 4.3 (Opcional) Cliente
```sql
insert into public.clients (id, organization_id, display_name, email, phone, address, notes, created_at)
values (
  '<<client_id_1>>'::uuid,
  '<<org_id_1>>'::uuid,
  'Cliente Smoke 1',
  'cliente1@example.com',
  '+34 600 000 001',
  'Calle Falsa 123',
  'Notas de smoke',
  now()
);
```

### 4.4 (Opcional) Obra
> `projects` mantiene campos legacy obligatorios (`title`, `client_name`, `start_date`). Si tu esquema en staging los mantiene NOT NULL, rellénalos.

```sql
insert into public.projects (
  id, organization_id, client_id, name,
  title, client_name,
  status, address, type, progress,
  start_date, created_at
)
values (
  '<<project_id_1>>'::uuid,
  '<<org_id_1>>'::uuid,
  '<<client_id_1>>'::uuid,
  'Obra Smoke 1',
  'Obra Smoke 1',
  'Cliente Smoke 1',
  'in_progress',
  'Dirección Smoke',
  'Reforma integral',
  0,
  now(),
  now()
);
```

### 4.5 (Opcional) Segunda org para aislamiento
```sql
insert into public.organizations (id, name, created_at)
values ('<<org_id_2>>'::uuid, 'Org Smoke 2', now());

insert into public.memberships (organization_id, user_id, role, created_at)
values ('<<org_id_2>>'::uuid, '<<other_user_id>>'::uuid, 'owner', now());
```

---

## 5) Checklist smoke funcional (owner/admin)

1. Login owner/admin.
2. Entrar a `/app`.
3. Crear cliente en `/app/clients/new`.
4. Ver detalle cliente.
5. Crear obra con cliente existente (`/app/projects/new`).
6. Crear obra con “cliente rápido” (`/app/projects/new` → toggle “Crear cliente rápido”).
7. Editar obra (`/app/projects/[id]/edit`).
8. Crear fase (`/app/projects/[id]/phases/new`).
9. Crear tarea asociada a fase y responsable (`/app/projects/[id]/tasks/new`).
10. Entrar al detalle de tarea.
11. Añadir comentario.
12. Editar comentario propio.
13. Borrar comentario propio.
14. Subir documento (`/app/projects/[id]/documents`).
15. Descargar documento (signed URL).
16. Borrar documento.
17. Registrar avance y comprobar que actualiza `projects.progress`.
18. Crear presupuesto con líneas.
19. Cambiar presupuesto a aceptado.
20. Crear coste real.
21. Crear compra/pedido con líneas.
22. Marcar compra como recibida.
23. Crear coste desde pedido.
24. Revisar dashboard `/app` y comprobar métricas principales.

---

## 6) Checklist smoke funcional (member)

1. Login member.
2. Puede ver dashboard, obras, clientes y módulos de obra.
3. Puede comentar en tarea.
4. No puede:
   - crear/editar obra
   - crear/editar cliente
   - crear/editar tarea
   - subir documento
   - registrar avance
   - crear presupuesto
   - crear coste
   - crear compra
   - crear/editar fase
5. Intentar acceso directo a rutas restringidas y confirmar bloqueo/error.

---

## 7) Logs: dónde mirar y qué buscar

### Dónde revisar
- **Supabase Logs** (SQL / API / Auth / Storage) en el dashboard del proyecto staging.
- **Logs del hosting** (Vercel/Netlify/Docker) donde esté desplegado Next.js.

### Qué buscar
- Tokens/secrets:
  - Cualquier string tipo JWT que empiece por `eyJ...` en logs.
- RLS:
  - Errores de permiso (PostgREST) al hacer SELECT/INSERT/UPDATE/DELETE.
  - 401/403 inesperados en rutas `/app`.
- Storage:
  - Errores al subir/descargar/borrar en bucket `project-documents`.
  - Signed URL fallando (403) o path mismatch.
- Auth:
  - Redirects incorrectos (ej. bucle login, `redirectTo` mal formado).

---

## 8) Nota operativa
Este plan está pensado para ejecutarse:
- **después** de mergear `feature/app-consolidation` a `main`, o
- sobre un staging que despliegue explícitamente `feature/app-consolidation`.
