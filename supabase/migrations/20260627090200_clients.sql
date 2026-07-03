begin;

-- Core bootstrap: clients.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_org_display_name_idx
  on public.clients (organization_id, display_name);

create index if not exists clients_org_updated_at_idx
  on public.clients (organization_id, updated_at desc);

-- updated_at trigger
drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
before update on public.clients
for each row
execute function public.set_updated_at();

alter table public.clients enable row level security;

-- RLS policies

-- SELECT: org members
Drop policy if exists clients_select_member on public.clients;
create policy clients_select_member
  on public.clients
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
    )
  );

-- INSERT: owner/admin only
Drop policy if exists clients_insert_owner_admin on public.clients;
create policy clients_insert_owner_admin
  on public.clients
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- UPDATE: owner/admin only
Drop policy if exists clients_update_owner_admin on public.clients;
create policy clients_update_owner_admin
  on public.clients
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- DELETE: owner/admin only
Drop policy if exists clients_delete_owner_admin on public.clients;
create policy clients_delete_owner_admin
  on public.clients
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = clients.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

commit;
