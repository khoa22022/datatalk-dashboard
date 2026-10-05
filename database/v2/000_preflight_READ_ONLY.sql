-- Read-only inventory. Run before migration, save output and review on staging.
select table_name,column_name,data_type,is_nullable from information_schema.columns
 where table_schema='public' and table_name in ('users','workspaces','workspace_members','projects','events','sessions','audit_logs') order by table_name,ordinal_position;
select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public';
select conrelid::regclass as table_name,conname,pg_get_constraintdef(oid) as definition from pg_constraint
 where conrelid in ('public.users'::regclass,'public.workspace_members'::regclass,'public.sessions'::regclass);
select role,status,count(*) from public.users group by role,status;
select role,count(*) from public.workspace_members group by role;
select count(*) as projects_without_workspace from public.projects where workspace_id is null;
select count(*) as ownerless_workspaces from public.workspaces where owner_id is null;
select w.id as workspace_id,w.owner_id,m.role as owner_membership_role from public.workspaces w
 left join public.workspace_members m on m.workspace_id=w.id and m.user_id=w.owner_id where m.role is distinct from 'OWNER';
select lower(email) as normalized_email,count(*) from public.users group by lower(email) having count(*)>1;
select id,email,email_confirmed_at,last_sign_in_at from auth.users where id='1bc0d1b0-4de3-4243-964a-cf49aafee38c';
-- Never automatically assign orphaned projects to the first registered account.

-- Review any legacy view or security-definer function that could bypass an API-only boundary.
select schemaname,viewname,definition from pg_views where schemaname='public';
select p.proname,p.prosecdef,pg_get_function_identity_arguments(p.oid) as arguments,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef;
select table_name,grantee,privilege_type from information_schema.role_table_grants
 where table_schema='public' and grantee in ('PUBLIC','anon','authenticated') order by table_name,grantee;
