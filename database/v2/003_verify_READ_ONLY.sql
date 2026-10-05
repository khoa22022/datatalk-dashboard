select id,email,role,status from public.users where id='1bc0d1b0-4de3-4243-964a-cf49aafee38c';
select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname in ('users','projects','events','workspace_members','workspace_invitations');
select table_name,grantee,privilege_type from information_schema.role_table_grants
 where table_schema='public' and grantee in ('anon','authenticated')
 and table_name in ('users','workspaces','workspace_members','projects','events','sessions','heatmap_events','feedback','ai_insights','funnels','audit_logs','workspace_invitations');
-- Expected: no rows above.
select p.proname,has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as server_execute
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'datatalk_%';
-- Expected: false, false, true for every V2 function.
select count(*) as preserved_event_count from public.events;
