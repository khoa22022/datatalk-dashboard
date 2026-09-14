# Datatalk Dashboard v1

Designer-first frontend for Datatalk UX Analytics.

## Stack
- Next.js 16
- React 19
- TypeScript
- CSS design system adapted from the provided Sneat dashboard UI kit
- Recharts
- Supabase Auth client

## Run locally

1. Copy `.env.example` to `.env.local`
2. Fill:
   - `NEXT_PUBLIC_API_URL=https://datatalk-api-h4a1.onrender.com`
   - `NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your Supabase publishable key>`
3. `npm install`
4. `npm run dev`
5. Open http://localhost:3000

## Routes
- `/login`
- `/register`
- `/dashboard`
- `/projects`
- `/analytics`
- `/heatmaps`
- `/sessions`
- `/funnels`
- `/ai`
- `/settings`

## Design direction
The UI adapts the provided Sneat dashboard patterns: 260px sidebar, compact topbar, dense dashboard grids, rounded cards, subtle shadows, indigo primary, compact typography, stat cards, tables, dialogs and reusable controls. The information architecture is redesigned for Datatalk: Overview, Projects, Analytics, Heatmaps, Sessions, Funnels and AI Analyst.

## Backend
The project API is preconfigured for the deployed Datatalk backend:
`https://datatalk-api-h4a1.onrender.com`
