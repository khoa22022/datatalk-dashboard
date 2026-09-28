# DataTalk V2.1 Frontend hotfix

Fixes the Vercel Turbopack errors from commit fe8b76a:
- restores `ApiError` export in `lib/api.ts`
- restores `authConfigured` export in `lib/supabase.ts`
- keeps the V2 auth/workspace compatibility files from GD01 while retaining V2.1 UI/onboarding changes

Expected package version: `2.1.0-rc.1`.
