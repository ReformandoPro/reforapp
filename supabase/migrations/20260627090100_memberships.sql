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

DO $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'memberships_role_check'
      and conrelid = 'public.memberships'::regclass
  ) then
    alter table public.memberships
      add constraint memberships_role_check
      check (role in ('owner','admin','member'));
  end if;
end $$;

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

-- RLS/policies are applied in a later migration once all core tables exist.

commit;
