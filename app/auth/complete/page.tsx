'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { safeNext } from '@/lib/auth-utils.mjs';
import { AuthFrame } from '@/components/v2/AuthFrame';
import { useV2Copy } from '@/components/v2/copy';
// StrictMode can mount effects twice; auth codes are single-use.
const exchanges = new Map<string, Promise<boolean>>();
function exchange(code: string) {
  if (!exchanges.has(code)) {
    const promise = supabase ? supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => !error && !!data.session).catch(() => false) : Promise.resolve(false);
    exchanges.set(code, promise);
    setTimeout(() => exchanges.delete(code), 60000);
  }
  return exchanges.get(code)!;
}
export default function CompleteAuth() {
  const { c, errorText } = useV2Copy(); const router = useRouter(); const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true; const params = new URLSearchParams(window.location.search); const code = params.get('code');
    if (!code || params.has('error')) { setFailed(true); return; }
    void exchange(code).then(ok => {
      if (!alive) return;
      window.history.replaceState({}, '', '/auth/complete');
      if (ok) router.replace(safeNext(params.get('next'))); else setFailed(true);
    });
    return () => { alive = false; };
  }, [router]);
  return <AuthFrame title={c(failed ? 'login' : 'working')}>
    {failed ? <><p className="account-alert error" role="alert">{errorText('CALLBACK_FAILED')}</p><Link className="btn primary" href="/login">{c('backLogin')}</Link></> : <p role="status">{c('working')}</p>}
  </AuthFrame>;
}
