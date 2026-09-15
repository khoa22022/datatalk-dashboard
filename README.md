# Datatalk Dashboard v1.1

Designer-first frontend for Datatalk UX Analytics.

Auth:
- Supabase email/password
- Google OAuth
- Protected dashboard session
- Super Admin bootstrap handled by backend

Required Vercel environment variables:
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Super Admin email is enforced server-side in the backend via SUPER_ADMIN_EMAIL.
