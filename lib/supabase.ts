'use client';
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Browser Auth only. The API verifies tokens and authorizes every data request.
// Never put service_role / secret keys in NEXT_PUBLIC_* environment variables.
export const supabase = typeof window !== 'undefined' && url && key ? createClient(url, key, {
  auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true }
}) : null;
export const authConfigured = Boolean(url && key);
