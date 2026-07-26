begin;

grant usage on schema public to authenticated, service_role;

-- Explicit DML for the administrative Supabase role. This role is not used by
-- application code and is never exposed to browser or SSR user sessions.
grant select, insert, update, delete on table
  public.organizations, public.memberships, public.clients, public.projects,
  public.project_tasks, public.profiles, public.project_task_comments,
  public.project_documents, public.project_progress_updates,
  public.project_budgets, public.project_budget_lines, public.project_costs,
  public.project_purchases, public.project_purchase_items, public.project_phases,
  public.organization_invitations, public.project_templates,
  public.project_template_phases, public.project_template_tasks,
  public.project_task_issues
to service_role;

-- authenticated needs table privileges before RLS policies can evaluate.
grant select, insert, update, delete on table
  public.organizations, public.memberships, public.clients, public.projects,
  public.project_task_comments, public.project_progress_updates,
  public.project_budgets, public.project_budget_lines, public.project_costs,
  public.project_purchases, public.project_purchase_items, public.project_phases,
  public.organization_invitations, public.project_templates,
  public.project_template_phases, public.project_template_tasks
to authenticated;
grant select, insert, delete on table public.project_documents to authenticated;
grant select, insert, update on table public.project_tasks to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert on table public.project_task_issues to authenticated;

-- set_config(..., true) is transaction-local, not function-local. Save and
-- restore the value so helper calls cannot affect later statements.
create or replace function public.is_org_member(org_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare previous_row_security text; result boolean;
begin
  previous_row_security := current_setting('row_security', true);
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null then
      perform set_config('row_security', previous_row_security, true);
      return false;
    end if;
    result := exists (select 1 from public.memberships m where m.organization_id = org_id and m.user_id = auth.uid());
    perform set_config('row_security', previous_row_security, true);
    return result;
  exception when others then
    perform set_config('row_security', previous_row_security, true);
    raise;
  end;
end;
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare previous_row_security text; result boolean;
begin
  previous_row_security := current_setting('row_security', true);
  perform set_config('row_security', 'off', true);
  begin
    if auth.uid() is null then
      perform set_config('row_security', previous_row_security, true);
      return false;
    end if;
    result := exists (select 1 from public.memberships m where m.organization_id = org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'));
    perform set_config('row_security', previous_row_security, true);
    return result;
  exception when others then
    perform set_config('row_security', previous_row_security, true);
    raise;
  end;
end;
$$;

create or replace function public.org_has_any_membership(org_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare previous_row_security text; result boolean;
begin
  previous_row_security := current_setting('row_security', true);
  perform set_config('row_security', 'off', true);
  begin
    result := exists (select 1 from public.memberships m where m.organization_id = org_id);
    perform set_config('row_security', previous_row_security, true);
    return result;
  exception when others then
    perform set_config('row_security', previous_row_security, true);
    raise;
  end;
end;
$$;

create or replace function public.is_client_in_org(client_id uuid, org_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare previous_row_security text; result boolean;
begin
  previous_row_security := current_setting('row_security', true);
  perform set_config('row_security', 'off', true);
  begin
    result := exists (select 1 from public.clients c where c.id = client_id and c.organization_id = org_id);
    perform set_config('row_security', previous_row_security, true);
    return result;
  exception when others then
    perform set_config('row_security', previous_row_security, true);
    raise;
  end;
end;
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_admin(uuid) from public;
revoke all on function public.org_has_any_membership(uuid) from public;
revoke all on function public.is_client_in_org(uuid, uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.org_has_any_membership(uuid) to authenticated;
grant execute on function public.is_client_in_org(uuid, uuid) to authenticated;

commit;
