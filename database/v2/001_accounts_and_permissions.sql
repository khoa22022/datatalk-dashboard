-- DataTalk V2.0.0-rc.1. Apply to a STAGING copy first, after the V1 schema.
-- API-only authorization model: browser roles have no direct table/RPC access.
-- Additive schema; legacy global OWNER/ADMIN -> USER, workspace USER -> EDITOR.
-- No projects, events, sessions or accounts are deleted. All changes are atomic.
begin;

alter table public.users drop constraint if exists users_role_check;
update public.users set role = 'USER' where role in ('OWNER','ADMIN');
alter table public.users add constraint users_role_check check (role in ('SUPER_ADMIN','USER'));
alter table public.workspace_members drop constraint if exists workspace_members_role_check;
update public.workspace_members set role = 'EDITOR' where role = 'USER';
alter table public.workspace_members add constraint workspace_members_role_check check (role in ('OWNER','ADMIN','EDITOR','VIEWER'));
alter table public.workspace_members alter column role set default 'VIEWER';
-- V1 sometimes assigned USER to the workspace's actual owner. Repair that legacy case.
insert into public.workspace_members(workspace_id,user_id,role)
  select w.id,w.owner_id,'OWNER' from public.workspaces w join public.users u on u.id=w.owner_id
  on conflict(workspace_id,user_id) do update set role='OWNER';

alter table public.workspaces add column if not exists personal_owner_id uuid references public.users(id);
create unique index if not exists workspaces_personal_owner_v2 on public.workspaces(personal_owner_id) where personal_owner_id is not null;
create index if not exists workspace_members_user_v2 on public.workspace_members(user_id,workspace_id);
create index if not exists projects_workspace_v2 on public.projects(workspace_id);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (email = lower(btrim(email))),
  role text not null check (role in ('ADMIN','EDITOR','VIEWER')),
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','REVOKED')),
  invited_by uuid not null references public.users(id),
  accepted_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  unique (workspace_id,email)
);
create index if not exists workspace_invitations_email_v2 on public.workspace_invitations(email,status);

create or replace function public.datatalk_workspace_role(p_actor uuid, p_workspace uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  if not exists(select 1 from public.users where id=p_actor and status='ACTIVE') then
    raise exception using errcode='42501',message='ACCOUNT_SUSPENDED';
  end if;
  select role into v_role from public.workspace_members where workspace_id=p_workspace and user_id=p_actor;
  if v_role is null then raise exception using errcode='42501',message='WORKSPACE_NOT_FOUND'; end if;
  return v_role;
end $$;

create or replace function public.datatalk_check_grant(p_actor uuid,p_workspace uuid,p_target_role text,p_next_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  v_role := public.datatalk_workspace_role(p_actor,p_workspace);
  if p_target_role='OWNER' then raise exception using errcode='42501',message='OWNER_PROTECTED'; end if;
  if p_next_role is not null and p_next_role not in ('ADMIN','EDITOR','VIEWER') then
    raise exception using errcode='22023',message='INVALID_ROLE';
  end if;
  if v_role='OWNER' then return; end if;
  if v_role='ADMIN' and coalesce(p_target_role,'')<>'ADMIN' and (p_next_role is null or p_next_role in ('EDITOR','VIEWER')) then return; end if;
  raise exception using errcode='42501',message='FORBIDDEN';
end $$;

create or replace function public.datatalk_bootstrap(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a auth.users%rowtype; u public.users%rowtype; w public.workspaces%rowtype; ws jsonb;
begin
  -- Serialize parallel bootstrap requests for this principal (not for their email).
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,7319));
  select * into a from auth.users where id=p_user_id;
  if not found or a.email is null then raise exception using errcode='42501',message='NOT_AUTHENTICATED'; end if;
  if a.email_confirmed_at is null then raise exception using errcode='42501',message='EMAIL_NOT_VERIFIED'; end if;
  if a.banned_until > now() then raise exception using errcode='42501',message='ACCOUNT_SUSPENDED'; end if;
  select * into u from public.users where id=p_user_id;
  if found and u.status='SUSPENDED' then raise exception using errcode='42501',message='ACCOUNT_SUSPENDED'; end if;
  insert into public.users(id,email,name,avatar,role,status,last_login_at)
    values(a.id,lower(btrim(a.email)),left(coalesce(a.raw_user_meta_data->>'name',a.raw_user_meta_data->>'full_name',''),100),
      left(coalesce(a.raw_user_meta_data->>'avatar_url',''),2048),'USER','ACTIVE',a.last_sign_in_at)
    on conflict(id) do update set email=excluded.email,name=excluded.name,avatar=excluded.avatar,
      last_login_at=excluded.last_login_at,status=case when public.users.status='INVITED' then 'ACTIVE' else public.users.status end
    returning * into u;
  -- Never promote from email, metadata or a client-supplied role.
  select * into w from public.workspaces where personal_owner_id=u.id;
  if not found then
    -- Reuse an owned V1 workspace, but do not adopt a shared public trial workspace.
    select * into w from public.workspaces candidate where candidate.owner_id=u.id and candidate.personal_owner_id is null
      and not exists(select 1 from public.projects p where p.workspace_id=candidate.id and (p.platform='Trial Sandbox' or p.tracking_key='dt_trial_internal_sandbox'))
      order by candidate.created_at,candidate.id limit 1 for update;
    if found then
      update public.workspaces set personal_owner_id=u.id where id=w.id returning * into w;
    else
      insert into public.workspaces(name,owner_id,personal_owner_id)
        values(coalesce(nullif(u.name,''),'My') || ' Workspace',u.id,u.id) returning * into w;
    end if;
  end if;
  insert into public.workspace_members(workspace_id,user_id,role) values(w.id,u.id,'OWNER')
    on conflict(workspace_id,user_id) do update set role='OWNER';
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'role',m.role,'is_personal',x.personal_owner_id=u.id) order by x.created_at,x.id),'[]'::jsonb)
    into ws from public.workspace_members m join public.workspaces x on x.id=m.workspace_id where m.user_id=u.id;
  return jsonb_build_object('user',to_jsonb(u),'isSuperAdmin',u.role='SUPER_ADMIN','personal_workspace_id',w.id,'workspaces',ws);
end $$;

create or replace function public.datatalk_create_project(p_actor uuid,p_workspace uuid,p_name text,p_domain text,p_platform text,p_goal text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_role text; p public.projects%rowtype;
begin
  perform 1 from public.workspaces where id=p_workspace for update;
  v_role := public.datatalk_workspace_role(p_actor,p_workspace);
  if v_role not in ('OWNER','ADMIN','EDITOR') then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  if p_name is null or btrim(p_name)='' or length(p_name)>120 then raise exception using errcode='22023',message='INVALID_NAME'; end if;
  if p_platform not in ('Website','Web App','Mobile App','Figma Site') then raise exception using errcode='22023',message='INVALID_NAME'; end if;
  insert into public.projects(workspace_id,name,domain,platform,business_goal,tracking_key)
    values(p_workspace,btrim(p_name),left(p_domain,2048),p_platform,left(p_goal,200),'dt_' || replace(gen_random_uuid()::text,'-','')) returning * into p;
  insert into public.audit_logs(user_id,action,target,metadata) values(p_actor,'CREATE_PROJECT',p.id::text,jsonb_build_object('workspace_id',p_workspace));
  return to_jsonb(p);
end $$;

create or replace function public.datatalk_invite_member(p_actor uuid,p_workspace uuid,p_email text,p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text:=lower(btrim(p_email)); i public.workspace_invitations%rowtype;
begin
  perform 1 from public.workspaces where id=p_workspace for update;
  if p_role is null or p_role not in ('ADMIN','EDITOR','VIEWER') then raise exception using errcode='22023',message='INVALID_ROLE'; end if;
  perform public.datatalk_check_grant(p_actor,p_workspace,null,p_role);
  if v_email is null or length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception using errcode='22023',message='INVALID_EMAIL'; end if;
  if exists(select 1 from public.workspace_members m join public.users u on u.id=m.user_id where m.workspace_id=p_workspace and lower(u.email)=v_email) then
    raise exception using errcode='23505',message='ALREADY_MEMBER';
  end if;
  -- An ADMIN cannot overwrite a pending ADMIN invitation made by the OWNER.
  if exists(select 1 from public.workspace_invitations where workspace_id=p_workspace and email=v_email and role='ADMIN' and status='PENDING') then
    perform public.datatalk_check_grant(p_actor,p_workspace,'ADMIN',p_role);
  end if;
  insert into public.workspace_invitations(workspace_id,email,role,invited_by) values(p_workspace,v_email,p_role,p_actor)
    on conflict(workspace_id,email) do update set role=excluded.role,invited_by=excluded.invited_by,status='PENDING',
      expires_at=now()+interval '7 days',created_at=now(),accepted_at=null,accepted_by=null returning * into i;
  insert into public.audit_logs(user_id,action,target,metadata) values(p_actor,'INVITE_MEMBER',i.id::text,jsonb_build_object('workspace_id',p_workspace,'role',p_role));
  return to_jsonb(i);
end $$;

create or replace function public.datatalk_accept_invitation(p_actor uuid,p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.workspace_invitations%rowtype; v_workspace uuid; a auth.users%rowtype;
begin
  select workspace_id into v_workspace from public.workspace_invitations where id=p_id;
  if not found then raise exception using errcode='42501',message='INVITATION_NOT_FOUND'; end if;
  perform 1 from public.workspaces where id=v_workspace for update;
  select * into i from public.workspace_invitations where id=p_id for update;
  select * into a from auth.users where id=p_actor;
  if a.email is null or a.email_confirmed_at is null then raise exception using errcode='42501',message='EMAIL_NOT_VERIFIED'; end if;
  if lower(btrim(a.email))<>i.email then raise exception using errcode='42501',message='INVITATION_EMAIL_MISMATCH'; end if;
  if not exists(select 1 from public.users where id=p_actor and status='ACTIVE') then raise exception using errcode='42501',message='ACCOUNT_SUSPENDED'; end if;
  if i.status='ACCEPTED' and i.accepted_by=p_actor then return jsonb_build_object('workspace_id',i.workspace_id,'accepted',true); end if;
  if i.status<>'PENDING' then raise exception using errcode='42501',message='INVITATION_NOT_FOUND'; end if;
  if i.expires_at<=now() then raise exception using errcode='42501',message='INVITATION_EXPIRED'; end if;
  -- Re-check the inviter's CURRENT permissions. Revoked/downgraded admins cannot leave privilege-granting invites behind.
  begin
    perform public.datatalk_check_grant(i.invited_by,i.workspace_id,null,i.role);
  exception when insufficient_privilege then
    raise exception using errcode='42501',message='INVITATION_NO_LONGER_VALID';
  end;
  insert into public.workspace_members(workspace_id,user_id,role) values(i.workspace_id,p_actor,i.role)
    on conflict(workspace_id,user_id) do nothing; -- Never demote an existing OWNER or overwrite a later grant.
  update public.workspace_invitations set status='ACCEPTED',accepted_by=p_actor,accepted_at=now() where id=i.id;
  insert into public.audit_logs(user_id,action,target,metadata) values(p_actor,'ACCEPT_INVITATION',i.id::text,jsonb_build_object('workspace_id',i.workspace_id));
  return jsonb_build_object('workspace_id',i.workspace_id,'accepted',true);
end $$;

create or replace function public.datatalk_change_member(p_actor uuid,p_workspace uuid,p_target uuid,p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old text;
begin
  perform 1 from public.workspaces where id=p_workspace for update;
  if p_actor=p_target then raise exception using errcode='42501',message='SELF_CHANGE_FORBIDDEN'; end if;
  select role into v_old from public.workspace_members where workspace_id=p_workspace and user_id=p_target;
  if not found then raise exception using errcode='42501',message='WORKSPACE_NOT_FOUND'; end if;
  perform public.datatalk_check_grant(p_actor,p_workspace,v_old,p_role);
  if p_role is null then delete from public.workspace_members where workspace_id=p_workspace and user_id=p_target;
  else update public.workspace_members set role=p_role where workspace_id=p_workspace and user_id=p_target; end if;
  insert into public.audit_logs(user_id,action,target,metadata) values(p_actor,
    case when p_role is null then 'REMOVE_MEMBER' else 'CHANGE_MEMBER_ROLE' end,p_target::text,
    jsonb_build_object('workspace_id',p_workspace,'old_role',v_old,'new_role',p_role));
  return jsonb_build_object('success',true);
end $$;

create or replace function public.datatalk_revoke_invitation(p_actor uuid,p_workspace uuid,p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare i public.workspace_invitations%rowtype;
begin
  perform 1 from public.workspaces where id=p_workspace for update;
  select * into i from public.workspace_invitations where id=p_id and workspace_id=p_workspace for update;
  if not found or i.status<>'PENDING' then raise exception using errcode='42501',message='INVITATION_NOT_FOUND'; end if;
  perform public.datatalk_check_grant(p_actor,p_workspace,i.role,null);
  update public.workspace_invitations set status='REVOKED' where id=p_id;
  insert into public.audit_logs(user_id,action,target,metadata) values(p_actor,'REVOKE_INVITATION',p_id::text,jsonb_build_object('workspace_id',p_workspace));
  return jsonb_build_object('success',true);
end $$;

create or replace function public.datatalk_set_account_status(p_actor uuid,p_target uuid,p_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.users%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(7319,2000);
  if not exists(select 1 from public.users where id=p_actor and role='SUPER_ADMIN' and status='ACTIVE') then
    raise exception using errcode='42501',message='FORBIDDEN';
  end if;
  if p_actor=p_target then raise exception using errcode='42501',message='SELF_CHANGE_FORBIDDEN'; end if;
  if p_status is null or p_status not in ('ACTIVE','SUSPENDED') then raise exception using errcode='22023',message='INVALID_STATUS'; end if;
  select * into u from public.users where id=p_target for update;
  if not found then raise exception using errcode='42501',message='WORKSPACE_NOT_FOUND'; end if;
  if u.role='SUPER_ADMIN' then raise exception using errcode='42501',message='SUPER_ADMIN_PROTECTED'; end if;
  update public.users set status=p_status where id=p_target;
  insert into public.audit_logs(user_id,action,target,metadata) values(p_actor,'CHANGE_ACCOUNT_STATUS',p_target::text,jsonb_build_object('old_status',u.status,'new_status',p_status));
  return jsonb_build_object('id',p_target,'status',p_status);
end $$;

-- Defense in depth. Supabase's public key must never bypass the API's tenant checks.
-- Restrictive policies also defeat old permissive policies on these known DataTalk tables.
do $$
declare v_name text; f record;
begin
  foreach v_name in array array['users','workspaces','workspace_members','projects','sessions','events','heatmap_events','funnels','feedback','ai_insights','audit_logs','workspace_invitations'] loop
    execute format('alter table public.%I enable row level security',v_name);
    execute format('revoke all on table public.%I from public, anon, authenticated',v_name);
    execute format('grant select,insert,update,delete on table public.%I to service_role',v_name);
    execute format('drop policy if exists datatalk_api_only_v2 on public.%I',v_name);
    execute format('create policy datatalk_api_only_v2 on public.%I as restrictive for all to anon,authenticated using (false) with check (false)',v_name);
  end loop;
  for f in select p.oid::regprocedure as signature from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('datatalk_workspace_role','datatalk_check_grant','datatalk_bootstrap','datatalk_create_project','datatalk_invite_member','datatalk_accept_invitation','datatalk_change_member','datatalk_revoke_invitation','datatalk_set_account_status') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
