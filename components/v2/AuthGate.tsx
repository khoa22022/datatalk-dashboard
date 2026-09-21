'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useV2Copy } from './copy';
import { AuthFrame } from './AuthFrame';
import { safeNext } from '@/lib/auth-utils.mjs';
export function AuthGate({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const auth = useAuth(); const { c, errorText } = useV2Copy(); const router = useRouter(); const path = usePathname();
  useEffect(() => { if (!auth.loading && !auth.session && !auth.error) router.replace(`/login?next=${encodeURIComponent(safeNext(path))}`); }, [auth.loading, auth.session, auth.error, path, router]);
  if (auth.error) return <AuthFrame title={c('login')}><div className="account-alert error" role="alert">{errorText(auth.error)}</div><div className="account-actions"><button className="btn primary" onClick={auth.refresh}>{c('retry')}</button><button className="btn outline" onClick={() => void auth.signOut().then(() => router.replace('/login'))}>{c('backLogin')}</button></div></AuthFrame>;
  if (auth.loading || !auth.account) return <AuthFrame title={c('loading')} subtitle={c('serverWait')}><div className="account-loading" role="status" aria-live="polite">{c('working')}</div></AuthFrame>;
  if (admin && !auth.account.isSuperAdmin) return <div className="account-panel"><h1>{c('forbidden')}</h1><Link href="/dashboard" className="btn outline">{c('continue')}</Link></div>;
  return <>{children}</>;
}
