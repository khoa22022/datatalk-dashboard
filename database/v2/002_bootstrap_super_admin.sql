-- Execute only in the Supabase SQL editor / trusted migration channel AFTER 001.
-- The UUID AND email must match the intended VERIFIED Auth principal.
-- Does not create passwords, auto-confirm email or reset the user's credentials.
begin;
do $$
declare
  expected_id constant uuid := '1bc0d1b0-4de3-4243-964a-cf49aafee38c';
  expected_email constant text := 'khoa3815@gmail.com';
  a auth.users%rowtype;
  previous_role text;
begin
  select * into a from auth.users where id=expected_id;
  if not found or lower(btrim(a.email)) is distinct from expected_email then
    raise exception 'STOP: Auth UUID/email do not match the intended super admin. Verify Authentication > Users before editing this script.';
  end if;
  if a.email_confirmed_at is null then
    raise exception 'STOP: Verify ownership of this email through Supabase Auth first. This script will not auto-confirm it.';
  end if;
  perform public.datatalk_bootstrap(expected_id);
  select role into previous_role from public.users where id=expected_id for update;
  update public.users set role='SUPER_ADMIN' where id=expected_id;
  if previous_role is distinct from 'SUPER_ADMIN' then
    insert into public.audit_logs(user_id,action,target,metadata)
      values(expected_id,'BOOTSTRAP_SUPER_ADMIN',expected_id::text,'{"channel":"trusted_sql_migration"}'::jsonb);
  end if;
end $$;
commit;
select id,email,role,status from public.users where id='1bc0d1b0-4de3-4243-964a-cf49aafee38c';
