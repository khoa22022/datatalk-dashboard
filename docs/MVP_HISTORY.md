# Historical notes - not deployment instructions

Read README.md and V2_DEPLOY.md at the repository root for this full-source release. The notes below describe older artifacts only.

# DataTalk V2.0.0-rc.1

**Release candidate: accounts, workspace isolation and roles. Not yet production-validated.**

Start with [V2 deployment and migration instructions](V2_DEPLOY.md). Apply this upgrade over the supplied V1 repository and keep unchanged assets.

This release has NOT been deployed to your services. Full dependency installation/build, PostgreSQL execution and live OAuth/email/browser acceptance remain mandatory. Do not follow the old V1 role bootstrap or direct browser-database instructions below for V2.

---

<details><summary>Archived V1 notes (historical reference only)</summary>

# Datatalk Dashboard v1.4.0 — UI Redesign

Frontend release focused on a cleaner Product Analytics / UX Intelligence experience.

## What changed
- Single responsive application shell (removed nested Trial shell)
- Path-aware sidebar active state with motion feedback
- Clean project context header and EN/VI language switcher
- Refined KPI cards and chart presentation
- Fixed Device Mix donut/legend overlap
- Redesigned Projects cards
- New platform-first Add Project setup flow for non-technical users
- EN/VI copy for the new project/setup experience
- Preserves Trial Sandbox, tracking proxy, existing API contract, Poppins fonts and analytics pages

Backend contract remains compatible with Datatalk Backend v1.3.5.

</details>
