-- Organization invitations (DB only)
-- Requirements:
-- - No token stored in cleartext: only token_hash.
-- - Owner/admin can create/manage invitations.
-- - Invitee can read only their own pending invitation (for future acceptance flow).

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  invitee_email text not null,
  invited_role text not null check (invited_role in ('admin', 'member')),

  -- Store only a hash of the invitation token (e.g., hex(sha256(token))).
  token_hash text not null,

  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),

  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users(id) on delete set null,

  constraint organization_invitations_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$')
);

-- Uniqueness: token hashes must be unique.
create unique index if not exists organization_invitations_token_hash_key
  on public.organization_invitations (token_hash);

-- Prevent duplicate pending invitations for the same email in the same org.
create unique index if not exists organization_invitations_org_email_pending_key
  on public.organization_invitations (organization_id, lower(invitee_email))
  where status = 'pending';

create index if not exists organization_invitations_org_id_idx
  on public.organization_invitations (organization_id);

create index if not exists organization_invitations_invitee_email_lower_idx
  on public.organization_invitations (lower(invitee_email));

create index if not exists organization_invitations_status_idx
  on public.organization_invitations (status);

create index if not exists organization_invitations_expires_at_idx
  on public.organization_invitations (expires_at);

alter table public.organization_invitations enable row level security;

-- Helper predicate: is owner/admin in org.
-- NOTE: memberships table is assumed to exist in this project.

create policy "org_invitations_select_owner_admin"
on public.organization_invitations
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.organization_id = organization_invitations.organization_id
      and m.role in ('owner', 'admin')
  )
);

-- Invitee can read only their own pending invite (future accept flow).
-- We use the authenticated user's email claim to avoid exposing invitations broadly.
create policy "org_invitations_select_invitee_pending"
on public.organization_invitations
for select
to authenticated
using (
  status = 'pending'
  and expires_at > now()
  and lower(invitee_email) = lower((auth.jwt() ->> 'email'))
);

create policy "org_invitations_insert_owner_admin"
on public.organization_invitations
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.organization_id = organization_invitations.organization_id
      and m.role in ('owner', 'admin')
  )
);

create policy "org_invitations_update_owner_admin"
on public.organization_invitations
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.organization_id = organization_invitations.organization_id
      and m.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.organization_id = organization_invitations.organization_id
      and m.role in ('owner', 'admin')
  )
);

create policy "org_invitations_delete_owner_admin"
on public.organization_invitations
for delete
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.organization_id = organization_invitations.organization_id
      and m.role in ('owner', 'admin')
  )
);
