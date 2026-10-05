create extension if not exists pgcrypto;

create table if not exists users (
 id uuid primary key,
 email text unique not null,
 name text,
 avatar text,
 role text not null default 'USER' check (role in ('SUPER_ADMIN','OWNER','ADMIN','USER')),
 status text not null default 'ACTIVE' check (status in ('ACTIVE','INVITED','SUSPENDED')),
 created_at timestamptz default now(),
 last_login_at timestamptz
);

create table if not exists workspaces (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 owner_id uuid references users(id),
 created_at timestamptz default now()
);

create table if not exists workspace_members (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references workspaces(id) on delete cascade,
 user_id uuid not null references users(id) on delete cascade,
 role text not null default 'USER' check (role in ('OWNER','ADMIN','USER')),
 created_at timestamptz default now(),
 unique(workspace_id,user_id)
);

create table if not exists projects (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid references workspaces(id) on delete cascade,
 name text not null,
 domain text,
 platform text default 'Website',
 business_goal text,
 tracking_key text unique not null,
 created_at timestamptz default now()
);

create table if not exists sessions (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references projects(id) on delete cascade,
 visitor_id text,
 session_key text,
 device text,
 browser text,
 os text,
 country text,
 city text,
 started_at timestamptz default now(),
 ended_at timestamptz,
 last_seen_at timestamptz default now(),
 unique(project_id,session_key)
);

create table if not exists events (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references projects(id) on delete cascade,
 visitor_id text,
 session_id text,
 event text not null,
 page text,
 element text,
 element_text text,
 metadata jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);

create table if not exists heatmap_events (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references projects(id) on delete cascade,
 session_id text,
 event_type text not null,
 x numeric,
 y numeric,
 viewport_width integer,
 viewport_height integer,
 page text,
 element text,
 created_at timestamptz default now()
);

create table if not exists funnels (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references projects(id) on delete cascade,
 name text not null,
 steps jsonb not null default '[]'::jsonb,
 created_at timestamptz default now()
);

create table if not exists feedback (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references projects(id) on delete cascade,
 session_id text,
 page text,
 survey_type text not null default 'custom',
 score numeric,
 feedback text,
 metadata jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);

create table if not exists ai_insights (
 id uuid primary key default gen_random_uuid(),
 project_id uuid references projects(id) on delete cascade,
 severity text,
 title text,
 evidence jsonb,
 recommendation text,
 created_at timestamptz default now()
);

create table if not exists audit_logs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid,
 action text,
 target text,
 metadata jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);

-- Safe upgrades FIRST. Indexes below depend on these columns.
alter table if exists events add column if not exists metadata jsonb default '{}'::jsonb;
alter table if exists heatmap_events add column if not exists page text;
alter table if exists heatmap_events add column if not exists element text;
alter table if exists heatmap_events add column if not exists viewport_width integer;
alter table if exists heatmap_events add column if not exists viewport_height integer;

create index if not exists events_project_created_idx on events(project_id,created_at desc);
create index if not exists events_project_event_idx on events(project_id,event);
create index if not exists events_project_visitor_idx on events(project_id,visitor_id);
create index if not exists events_project_page_idx on events(project_id,page);
create index if not exists events_project_session_idx on events(project_id,session_id);
create index if not exists heatmap_project_created_idx on heatmap_events(project_id,created_at desc);
create index if not exists heatmap_project_page_idx on heatmap_events(project_id,page);
create index if not exists feedback_project_created_idx on feedback(project_id,created_at desc);
