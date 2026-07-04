-- Migration: fix_legacy_profiles_name_role_auth_users
-- Objetivo: permitir que la creacion/invitacion de usuarios via Supabase Auth no falle
-- por columnas legacy adicionales NOT NULL sin default en public.profiles: name y role.
-- El Auth log real mostro: null value in column "name" of relation "profiles" violates
-- not-null constraint. Tambien existe profiles.role NOT NULL sin default.
-- No se cambia el tipo de ninguna columna, no se toca projects.id, seed ni verify.
-- Ver tambien migraciones 20260704000000 y 20260704001000.

create extension if not exists pgcrypto;

-- Solo observabilidad: reporta el estado actual de las columnas legacy relevantes, sin modificar nada.
do $$
declare
  v_has_name boolean;
  v_has_role boolean;
begin
  select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'name'
    ) into v_has_name;

  select exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
      ) into v_has_role;

  raise notice 'public.profiles.name existe: %', v_has_name;
  raise notice 'public.profiles.role existe: %', v_has_role;
end;
$$;
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_id boolean;
  v_id_data_type text;
  v_has_name boolean;
  v_has_role boolean;
  v_name_value text;
  v_extra_cols text := '';
  v_extra_vals text := '';
begin
  select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'id'
    ) into v_has_id;

  if v_has_id then
    select data_type
      into v_id_data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id';
  end if;

  select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'name'
      ) into v_has_name;

  select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'role'
      ) into v_has_role;

  -- Caso profiles.name: si la columna existe (NOT NULL o nullable), se rellena con un
  -- fallback en cascada, sin depender de que el cliente de Supabase Auth envie metadata.
  if v_has_name then
    v_name_value := coalesce(
          nullif(new.raw_user_meta_data->>'name', ''),
          nullif(new.raw_user_meta_data->>'full_name', ''),
          nullif(split_part(new.email, '@', 1), ''),
          'Demo User'
        );
    v_extra_cols := v_extra_cols || ', name';
    v_extra_vals := v_extra_vals || ', ' || quote_nullable(v_name_value);
  end if;

  -- Caso profiles.role: si la columna existe, se rellena con 'admin' para altas desde
  -- el dashboard/invite en staging. El control canonico de permisos sigue en memberships.role.
  if v_has_role then
    v_extra_cols := v_extra_cols || ', role';
    v_extra_vals := v_extra_vals || ', ' || quote_literal('admin');
  end if;

  if not v_has_id then
    -- Caso A: profiles.id no existe. Modelo canonico basado en user_id.
    begin
      execute format(
            'insert into public.profiles (user_id, email%s) values ($1, $2%s) on conflict (user_id) do update set email = excluded.email',
            v_extra_cols, v_extra_vals
          ) using new.id, new.email;
    exception
      when invalid_column_reference then
        if not exists (select 1 from public.profiles where user_id = new.id) then
          execute format(
                  'insert into public.profiles (user_id, email%s) values ($1, $2%s)',
                  v_extra_cols, v_extra_vals
                ) using new.id, new.email;
        else
          update public.profiles set email = new.email where user_id = new.id;
        end if;
    end;

  elsif v_id_data_type = 'uuid' then
    -- Caso B: profiles.id existe y es uuid.
    begin
      execute format(
            'insert into public.profiles (user_id, email%s) values ($1, $2%s) on conflict (user_id) do update set email = excluded.email',
            v_extra_cols, v_extra_vals
          ) using new.id, new.email;
    exception
      when invalid_column_reference then
        if not exists (select 1 from public.profiles where user_id = new.id) then
          execute format(
                  'insert into public.profiles (user_id, email%s) values ($1, $2%s)',
                  v_extra_cols, v_extra_vals
                ) using new.id, new.email;
        else
          update public.profiles set email = new.email where user_id = new.id;
        end if;
      when not_null_violation then
        begin
          execute format(
                    'insert into public.profiles (id, user_id, email%s) values (gen_random_uuid(), $1, $2%s) on conflict (user_id) do update set email = excluded.email',
                    v_extra_cols, v_extra_vals
                  ) using new.id, new.email;
        exception
          when invalid_column_reference then
            if not exists (select 1 from public.profiles where user_id = new.id) then
              execute format(
                          'insert into public.profiles (id, user_id, email%s) values (gen_random_uuid(), $1, $2%s)',
                          v_extra_cols, v_extra_vals
                        ) using new.id, new.email;
            else
              update public.profiles set email = new.email where user_id = new.id;
            end if;
        end;
    end;

  elsif v_id_data_type in ('text', 'character varying', 'character') then
    -- Caso C: profiles.id existe y es text (o variante). Se usa new.id::text.
    begin
      execute format(
            'insert into public.profiles (id, user_id, email%s) values ($1, $2, $3%s) on conflict (user_id) do update set email = excluded.email',
            v_extra_cols, v_extra_vals
          ) using new.id::text, new.id, new.email;
    exception
      when invalid_column_reference then
        if not exists (select 1 from public.profiles where user_id = new.id) then
          execute format(
                  'insert into public.profiles (id, user_id, email%s) values ($1, $2, $3%s)',
                  v_extra_cols, v_extra_vals
                ) using new.id::text, new.id, new.email;
        else
          update public.profiles set email = new.email where user_id = new.id;
        end if;
    end;

  else
    -- Caso D: profiles.id existe con un tipo no soportado. No se inventa un valor.
    raise exception 'handle_new_auth_user: public.profiles.id tiene un tipo no soportado (%) sin default; no se genera un valor automaticamente', v_id_data_type;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Crea/actualiza public.profiles al crear un usuario en auth.users. Soporta profiles.id ausente, uuid o text sin cambiar el tipo de la columna, y rellena profiles.name (fallback en cascada desde metadata/email) y profiles.role (admin) cuando esas columnas legacy existen. Ver migraciones 20260704000000, 20260704001000 y 20260704002000.';
