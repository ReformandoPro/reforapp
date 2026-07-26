begin;

revoke select, insert, update, delete on table
  public.organizations, public.memberships, public.clients, public.projects,
  public.project_tasks, public.profiles, public.project_task_comments,
  public.project_documents, public.project_progress_updates,
  public.project_budgets, public.project_budget_lines, public.project_costs,
  public.project_purchases, public.project_purchase_items, public.project_phases,
  public.organization_invitations, public.project_templates,
  public.project_template_phases, public.project_template_tasks,
  public.project_task_issues
from authenticated, service_role;

revoke execute on function public.is_org_member(uuid) from authenticated;
revoke execute on function public.is_org_admin(uuid) from authenticated;
revoke execute on function public.org_has_any_membership(uuid) from authenticated;
revoke execute on function public.is_client_in_org(uuid, uuid) from authenticated;
grant execute on function public.is_org_member(uuid) to public;
grant execute on function public.is_org_admin(uuid) to public;
grant execute on function public.org_has_any_membership(uuid) to public;
grant execute on function public.is_client_in_org(uuid, uuid) to public;

-- Restore the historical definitions. Rolling back this correction also rolls
-- back the helper fix, so the pre-existing behavior is intentionally restored.
create or replace function public.is_org_member(org_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);
  if auth.uid() is null then return false; end if;
  return exists (select 1 from public.memberships m where m.organization_id = org_id and m.user_id = auth.uid());
end;
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);
  if auth.uid() is null then return false; end if;
  return exists (select 1 from public.memberships m where m.organization_id = org_id and m.user_id = auth.uid() and m.role in ('owner','admin'));
end;
$$;

create or replace function public.org_has_any_membership(org_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);
  return exists (select 1 from public.memberships m where m.organization_id = org_id);
end;
$$;

create or replace function public.is_client_in_org(client_id uuid, org_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);
  return exists (select 1 from public.clients c where c.id = client_id and c.organization_id = org_id);
end;
$$;

commit;
