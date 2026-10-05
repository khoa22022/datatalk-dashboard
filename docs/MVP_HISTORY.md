# Historical notes - not deployment instructions

Read README.md and V2_DEPLOY.md at the repository root for this full-source release. The notes below describe older artifacts only.

# DataTalk V2.0.0-rc.1

**Release candidate: accounts, workspace isolation and roles. Not yet production-validated.**

Start with [V2 deployment and migration instructions](V2_DEPLOY.md). Apply this upgrade over the supplied V1 repository and keep unchanged assets.

This release has NOT been deployed to your services. Full dependency installation/build, PostgreSQL execution and live OAuth/email/browser acceptance remain mandatory. Do not follow the old V1 role bootstrap or direct browser-database instructions below for V2.

---

<details><summary>Archived V1 notes (historical reference only)</summary>

# Datatalk Backend v1.3.5 — Real UX Tracking + Trial Sandbox

Production tracking backend for Datatalk.

## v1.3.5
- Page and section attention events
- Active time / dwell time aggregation
- Click, rage-click, dead-click heatmap persistence
- Task events through `events.metadata` (no tasks/task_steps tables required)
- Feedback persistence
- Dashboard aggregation APIs
- Internal Trial Tracking Sandbox: `/api/try/*`

### Trial sandbox
The sandbox uses a dedicated `Datatalk Trial Sandbox` project inside the configured super-admin workspace. It is created automatically on first sandbox use and is intended only for product review/testing. It does not require Supabase Auth.

Endpoints:
- `GET /api/try/bootstrap`
- `POST /api/try/event`
- `POST /api/try/seed`
- `POST /api/try/reset`
- `POST /api/try/feedback`
- `GET /api/try/summary`

## Existing production APIs
Existing Auth, Workspace, Project, Tracking Key, Analytics, Sessions, Tasks, Heatmaps and Feedback APIs remain protected as before.

## Environment
Required existing variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPER_ADMIN_EMAIL`
- `CORS_ORIGINS`
- `PORT` (Render supplies this)

## v1.3.4 Trial reliability

- `/health/ready` is a lightweight readiness endpoint for cold-start checks.
- Trial project initialization is single-flight to avoid duplicate workspace/project creation.
- Trial scenario seeding is performed as one database batch after the backend is warmed.
- The scenario creates 16 events, 3 heatmap events, and one session.

## v1.3.5 Trial bootstrap hardening

- Removes PostgREST singular-response mode from the Trial Sandbox bootstrap, event insert, and feedback insert paths.
- Tolerates duplicate legacy trial workspace/project rows by selecting the oldest matching row deterministically.
- Uses the fixed tracking key `dt_trial_internal_sandbox` for idempotent project creation across concurrent server instances.
- Repairs the super-admin workspace membership on every bootstrap.
- Does not require a database cleanup or migration.

</details>
