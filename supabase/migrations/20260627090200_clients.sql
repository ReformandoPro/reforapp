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

-- RLS/policies are applied in a later migration once all core tables exist.

commit;
