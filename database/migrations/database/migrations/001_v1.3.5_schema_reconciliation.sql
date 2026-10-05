-- Datatalk v1.3.5 production schema reconciliation
-- Safe migration for existing databases.
-- Does not delete or rewrite existing data.

create extension if not exists pgcrypto;

-- users
alter table if exists public.users
  add column if not exists last_login_at timestamptz;

-- workspaces
alter table if exists public.workspaces
  add column if not exists owner_id uuid;

-- projects
alter table if exists public.projects
  add column if not exists workspace_id uuid;
alter table if exists public.projects
  add column if not exists platform text default 'Website';
alter table if exists public.projects
  add column if not exists business_goal text;

-- sessions: full v1.3.5 lifecycle
alter table if exists public.sessions
  add column if not exists session_key text;
alter table if exists public.sessions
  add column if not exists ended_at timestamptz;
alter table if exists public.sessions
  add column if not exists last_seen_at timestamptz default now();
alter table if exists public.sessions
  add column if not exists duration_seconds integer default 0;
alter table if exists public.sessions
  add column if not exists os text;

-- events
alter table if exists public.events
  add column if not exists metadata jsonb default '{}'::jsonb;
alter table if exists public.events
  add column if not exists element_text text;

-- heatmaps
alter table if exists public.heatmap_events
  add column if not exists page text;
alter table if exists public.heatmap_events
  add column if not exists element text;
alter table if exists public.heatmap_events
  add column if not exists viewport_width integer;
alter table if exists public.heatmap_events
  add column if not exists viewport_height integer;

-- feedback
alter table if exists public.feedback
  add column if not exists metadata jsonb default '{}'::jsonb;

-- indexes
create index if not exists projects_workspace_id_idx
  on public.projects(workspace_id);

create index if not exists sessions_session_key_idx
  on public.sessions(session_key);

create index if not exists events_project_session_idx
  on public.events(project_id, session_id);

create index if not exists heatmap_project_page_idx
  on public.heatmap_events(project_id, page);

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';