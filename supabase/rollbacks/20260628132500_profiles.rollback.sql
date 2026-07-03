begin;

drop trigger if exists on_auth_user_created_profiles on auth.users;
drop function if exists public.handle_new_auth_user();

drop table if exists public.profiles;

commit;
