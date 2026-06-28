-- Rollback: organization invitations

drop policy if exists "org_invitations_delete_owner_admin" on public.organization_invitations;
drop policy if exists "org_invitations_update_owner_admin" on public.organization_invitations;
drop policy if exists "org_invitations_insert_owner_admin" on public.organization_invitations;
drop policy if exists "org_invitations_select_invitee_pending" on public.organization_invitations;
drop policy if exists "org_invitations_select_owner_admin" on public.organization_invitations;

drop index if exists public.organization_invitations_expires_at_idx;
drop index if exists public.organization_invitations_status_idx;
drop index if exists public.organization_invitations_invitee_email_lower_idx;
drop index if exists public.organization_invitations_org_id_idx;
drop index if exists public.organization_invitations_org_email_pending_key;
drop index if exists public.organization_invitations_token_hash_key;

drop table if exists public.organization_invitations;
