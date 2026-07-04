-- Migration: fix_legacy_profiles_text_id_auth_users
-- Objetivo: permitir que la creacion/invitacion de usuarios via Supabase Auth
-- no falle cuando public.profiles.id es una columna legacy NOT NULL de tipo text,
-- sin cambiar el tipo de profiles.id y sin romper el modelo canonico basado en
-- profiles.user_id = auth.users.id. Ver tambien migracion 20260704000000.

create extension if not exists pgcrypto;

-- Solo observabilidad: reporta el estado actual de public.profiles.id sin modificar nada.
do $$
declare
  v_has_id boolean;
  v_id_data_type text;
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

    raise notice 'public.profiles.id existe con tipo %', v_id_data_type;
  else
    raise notice 'public.profiles.id no existe; se usa el modelo canonico basado en profiles.user_id';
  end if;
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

  if not v_has_id then
    -- Caso A: profiles.id no existe. Modelo canonico basado en user_id.
    begin
      insert into public.profiles (user_id, email)
      values (new.id, new.email)
      on conflict (user_id) do update set email = excluded.email;
    exception
      when invalid_column_reference then
        if not exists (select 1 from public.profiles where user_id = new.id) then
          insert into public.profiles (user_id, email) values (new.id, new.email);
        else
          update public.profiles set email = new.email where user_id = new.id;
        end if;
    end;

  elsif v_id_data_type = 'uuid' then
    -- Caso B: profiles.id existe y es uuid.
    begin
      insert into public.profiles (user_id, email)
      values (new.id, new.email)
      on conflict (user_id) do update set email = excluded.email;
    exception
      when invalid_column_reference then
        if not exists (select 1 from public.profiles where user_id = new.id) then
          insert into public.profiles (user_id, email) values (new.id, new.email);
        else
          update public.profiles set email = new.email where user_id = new.id;
        end if;
      when not_null_violation then
        begin
          insert into public.profiles (id, user_id, email)
          values (gen_random_uuid(), new.id, new.email)
          on conflict (user_id) do update set email = excluded.email;
        exception
          when invalid_column_reference then
            if not exists (select 1 from public.profiles where user_id = new.id) then
              insert into public.profiles (id, user_id, email)
              values (gen_random_uuid(), new.id, new.email);
            else
              update public.profiles set email = new.email where user_id = new.id;
            end if;
        end;
    end;

  elsif v_id_data_type in ('text', 'character varying', 'character') then
    -- Caso C: profiles.id existe y es text (o variante). Se usa new.id::text, nunca gen_random_uuid() sin cast.
    begin
      insert into public.profiles (id, user_id, email)
      values (new.id::text, new.id, new.email)
      on conflict (user_id) do update set email = excluded.email;
    exception
      when invalid_column_reference then
        if not exists (select 1 from public.profiles where user_id = new.id) then
          insert into public.profiles (id, user_id, email)
          values (new.id::text, new.id, new.email);
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
  'Crea/actualiza public.profiles al crear un usuario en auth.users. Soporta profiles.id ausente, uuid o text sin cambiar el tipo de la columna. Ver migraciones 20260704000000 y 20260704001000.';
