-- Rollback: accept organization invitation RPC

revoke all on function public.accept_organization_invitation(text) from authenticated;
drop function if exists public.accept_organization_invitation(text);
