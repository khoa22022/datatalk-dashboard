-- STAGING ONLY: requires 001, executes real permission functions with temporary fixtures.
-- NOT a read-only script. Every fixture and mutation is inside this transaction and ROLLED BACK.
-- Does not create auth.users or send email. Bootstrap/OAuth/invitation-accept require separate live Auth tests.
-- Run as postgres in a staging SQL editor. Any TEST_FAILED exception is a failed release gate.
begin;
do $$
declare
  owner_a uuid := gen_random_uuid(); owner_b uuid := gen_random_uuid();
  admin_a uuid := gen_random_uuid(); editor_a uuid := gen_random_uuid(); viewer_a uuid := gen_random_uuid();
  platform_admin uuid := gen_random_uuid(); w_a uuid := gen_random_uuid(); w_b uuid := gen_random_uuid();
  p jsonb; invitation jsonb; f record; t text; n integer;
begin
  insert into public.users(id,email,role,status) values
    (owner_a,owner_a::text || '@example.invalid','USER','ACTIVE'),
    (owner_b,owner_b::text || '@example.invalid','USER','ACTIVE'),
    (admin_a,admin_a::text || '@example.invalid','USER','ACTIVE'),
    (editor_a,editor_a::text || '@example.invalid','USER','ACTIVE'),
    (viewer_a,viewer_a::text || '@example.invalid','USER','ACTIVE'),
    (platform_admin,platform_admin::text || '@example.invalid','SUPER_ADMIN','ACTIVE');
  insert into public.workspaces(id,name,owner_id) values (w_a,'V2 isolated fixture A',owner_a),(w_b,'V2 isolated fixture B',owner_b);
  insert into public.workspace_members(workspace_id,user_id,role) values
    (w_a,owner_a,'OWNER'),(w_a,admin_a,'ADMIN'),(w_a,editor_a,'EDITOR'),(w_a,viewer_a,'VIEWER'),(w_b,owner_b,'OWNER');

  if public.datatalk_workspace_role(owner_a,w_a) <> 'OWNER' then raise exception 'TEST_FAILED owner role'; end if;
  begin
    perform public.datatalk_workspace_role(owner_b,w_a);
    raise exception 'TEST_FAILED cross-workspace access';
  exception when insufficient_privilege then null; end;
  begin
    perform public.datatalk_workspace_role(platform_admin,w_a);
    raise exception 'TEST_FAILED platform role bypasses workspace membership';
  exception when insufficient_privilege then null; end;

  p := public.datatalk_create_project(editor_a,w_a,'Fixture project','https://example.invalid','Website','UX review');
  if p->>'workspace_id' <> w_a::text then raise exception 'TEST_FAILED project scope'; end if;
  begin
    perform public.datatalk_create_project(viewer_a,w_a,'Denied','https://example.invalid','Website','UX');
    raise exception 'TEST_FAILED viewer can create project';
  exception when insufficient_privilege then null; end;
  begin
    perform public.datatalk_create_project(owner_b,w_a,'Denied','https://example.invalid','Website','UX');
    raise exception 'TEST_FAILED cross-workspace write';
  exception when insufficient_privilege then null; end;

  perform public.datatalk_change_member(owner_a,w_a,viewer_a,'EDITOR');
  perform public.datatalk_change_member(admin_a,w_a,viewer_a,'VIEWER');
  begin
    perform public.datatalk_change_member(admin_a,w_a,viewer_a,'ADMIN');
    raise exception 'TEST_FAILED admin can grant admin';
  exception when insufficient_privilege then null; end;
  begin
    perform public.datatalk_change_member(admin_a,w_a,owner_a,'VIEWER');
    raise exception 'TEST_FAILED owner demotion';
  exception when insufficient_privilege then null; end;
  begin
    perform public.datatalk_change_member(owner_a,w_a,owner_a,'VIEWER');
    raise exception 'TEST_FAILED self demotion';
  exception when insufficient_privilege then null; end;
  begin
    perform public.datatalk_change_member(editor_a,w_a,viewer_a,'EDITOR');
    raise exception 'TEST_FAILED editor manages members';
  exception when insufficient_privilege then null; end;

  invitation := public.datatalk_invite_member(owner_a,w_a,gen_random_uuid()::text || '@example.invalid','ADMIN');
  begin
    perform public.datatalk_invite_member(admin_a,w_a,invitation->>'email','VIEWER');
    raise exception 'TEST_FAILED admin overwrites owner admin invite';
  exception when insufficient_privilege then null; end;
  perform public.datatalk_revoke_invitation(owner_a,w_a,(invitation->>'id')::uuid);

  perform public.datatalk_set_account_status(platform_admin,viewer_a,'SUSPENDED');
  begin
    perform public.datatalk_workspace_role(viewer_a,w_a);
    raise exception 'TEST_FAILED suspended account remains authorized';
  exception when insufficient_privilege then null; end;
  begin
    perform public.datatalk_set_account_status(owner_a,editor_a,'SUSPENDED');
    raise exception 'TEST_FAILED workspace owner can suspend platform accounts';
  exception when insufficient_privilege then null; end;
  begin
    perform public.datatalk_set_account_status(platform_admin,platform_admin,'SUSPENDED');
    raise exception 'TEST_FAILED super admin self suspension';
  exception when insufficient_privilege then null; end;

  foreach t in array array['users','workspaces','workspace_members','projects','events','sessions','heatmap_events','feedback','funnels','ai_insights','audit_logs','workspace_invitations'] loop
    if has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
       or has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') then
      raise exception 'TEST_FAILED direct browser privilege on %',t;
    end if;
  end loop;
  for f in select pr.oid,pr.proname from pg_proc pr join pg_namespace ns on ns.oid=pr.pronamespace
    where ns.nspname='public' and pr.proname like 'datatalk_%' loop
    if has_function_privilege('anon',f.oid,'EXECUTE') or has_function_privilege('authenticated',f.oid,'EXECUTE') then
      raise exception 'TEST_FAILED browser can call definer function %',f.proname;
    end if;
    if not has_function_privilege('service_role',f.oid,'EXECUTE') then raise exception 'TEST_FAILED API cannot call %',f.proname; end if;
  end loop;
  select count(*) into n from public.audit_logs where user_id in (owner_a,admin_a,editor_a,platform_admin);
  if n < 6 then raise exception 'TEST_FAILED audit trail missing'; end if;
  raise notice 'PASS: staged SQL permission assertions; all fixtures will be rolled back.';
end $$;
rollback;
