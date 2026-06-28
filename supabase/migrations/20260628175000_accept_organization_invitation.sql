-- Accept organization invitation via token
-- This RPC is SECURITY DEFINER to keep token validation server-side without service role.
-- It validates sha256(token) against organization_invitations.token_hash,
-- checks status/expires, checks that the authenticated user's email matches invitee_email,
-- creates memberships row, and marks the invitation as accepted.

create or replace function public.accept_organization_invitation(invitation_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_token_hash text;
  v_inv public.organization_invitations%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return 'not_authenticated';
  end if;

  v_user_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_user_email = '' then
    return 'not_authenticated';
  end if;

  if invitation_token is null or length(trim(invitation_token)) = 0 then
    return 'invalid';
  end if;

  v_token_hash := encode(digest(invitation_token, 'sha256'), 'hex');

  select *
  into v_inv
  from public.organization_invitations
  where token_hash = v_token_hash
  limit 1
  for update;

  if not found then
    return 'invalid';
  end if;

  if v_inv.expires_at <= now() then
    return 'expired';
  end if;

  if v_inv.status = 'revoked' then
    return 'revoked';
  end if;

  if v_inv.status = 'accepted' then
    return 'used';
  end if;

  if v_inv.status <> 'pending' then
    return 'error';
  end if;

  if lower(v_inv.invitee_email) <> v_user_email then
    return 'forbidden';
  end if;

  begin
    insert into public.memberships (organization_id, user_id, role)
    values (v_inv.organization_id, v_user_id, v_inv.invited_role);
  exception
    when unique_violation then
      return 'used';
  end;

  update public.organization_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_by_user_id = v_user_id,
      updated_at = now()
  where id = v_inv.id;

  return 'accepted';
end;
$$;

revoke all on function public.accept_organization_invitation(text) from public;
grant execute on function public.accept_organization_invitation(text) to authenticated;
