begin;

-- Core bootstrap: memberships.

create table if not exists public.memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.memberships
  add constraint memberships_role_check
  check (role in ('owner','admin','member'));

create index if not exists memberships_user_id_idx
  on public.memberships (user_id);

create index if not exists memberships_org_role_idx
  on public.memberships (organization_id, role);

-- updated_at trigger
drop trigger if exists set_updated_at_memberships on public.memberships;
create trigger set_updated_at_memberships
before update on public.memberships
for each row
execute function public.set_updated_at();

alter table public.memberships enable row level security;

-- RLS policies

-- SELECT: members can read memberships within their org.
drop policy if exists memberships_select_member on public.memberships;
create policy memberships_select_member
  on public.memberships
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
    )
  );

-- INSERT: owner/admin can add members.
-- Bootstrap exception: allow a user to insert *their own* owner membership
-- only if the organization currently has no memberships.
drop policy if exists memberships_insert_owner_admin_or_bootstrap on public.memberships;
create policy memberships_insert_owner_admin_or_bootstrap
  on public.memberships
  for insert
  to authenticated
  with check (
    (
      -- Normal path: owner/admin in org
      exists (
        select 1
        from public.memberships m
        where m.organization_id = memberships.organization_id
          and m.user_id = auth.uid()
          and m.role in ('owner','admin')
      )
    )
    or
    (
      -- Bootstrap: first owner for a freshly created org
      memberships.user_id = auth.uid()
      and memberships.role = 'owner'
      and not exists (
        select 1
        from public.memberships m2
        where m2.organization_id = memberships.organization_id
      )
    )
  );

-- UPDATE: owner/admin only.
drop policy if exists memberships_update_owner_admin on public.memberships;
create policy memberships_update_owner_admin
  on public.memberships
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
    and memberships.role in ('owner','admin','member')
  );

-- DELETE: owner/admin only.
drop policy if exists memberships_delete_owner_admin on public.memberships;
create policy memberships_delete_owner_admin
  on public.memberships
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.organization_id = memberships.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

commit;
