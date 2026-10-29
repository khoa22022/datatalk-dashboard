'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, authConfigured } from '@/lib/supabase';
import { api, ApiError } from '@/lib/api';
import { workspaceStorageKey } from '@/lib/auth-utils.mjs';
import type { Account, Workspace } from '@/lib/account-types';

type AuthValue = { session: Session | null; account: Account | null; workspace: Workspace | null; loading: boolean; error: string; selectWorkspace: (id: string) => void; refresh: () => void; signOut: () => Promise<void> };
const Context = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [accountResult, setAccount] = useState<Account | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    if (!supabase) { setError('AUTH_NOT_CONFIGURED'); setSessionReady(true); return; }
    let alive = true; let authEventSeen = false;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!alive || authEventSeen) return;
      if (error) setError('SESSION_INVALID');
      setSession(data.session); setSessionReady(true);
    }).catch(() => { if (alive) { setError('NETWORK_ERROR'); setSessionReady(true); } });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      // Never await Supabase calls inside this callback (Auth may hold its lock).
      authEventSeen = true; setSession(next); setSessionReady(true);
      if (!next) { setAccount(null); setSelected(''); setError(''); }
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!session) { setBusy(false); return; }
    let alive = true;
    const controller = new AbortController();
    setBusy(true); setError('');
    api<Account>('/api/auth/bootstrap', { method: 'POST', accessToken: session.access_token, signal: controller.signal })
      .then(data => {
        if (!alive) return;
        setAccount(data);
        let saved = ''; try { saved = localStorage.getItem(workspaceStorageKey(data.user.id)) || ''; } catch {}
        setSelected(previous => data.workspaces.some(w => w.id === previous) ? previous : data.workspaces.some(w => w.id === saved) ? saved : data.personal_workspace_id);
      }).catch(e => { if (alive) { setAccount(null); setError(e instanceof ApiError ? e.code : 'NETWORK_ERROR'); } })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; controller.abort(); };
  }, [session?.access_token, revision]);
  useEffect(() => {
    if (!session) return;
    const onFocus = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [session?.user.id, refresh]);
  // Do not render account A's data during a session switch to account B.
  const account = accountResult?.user.id === session?.user.id ? accountResult : null;
  const workspace = account?.workspaces.find(w => w.id === selected) || null;
  const selectWorkspace = useCallback((id: string) => {
    if (!account?.workspaces.some(w => w.id === id)) return;
    setSelected(id);
    try { localStorage.setItem(workspaceStorageKey(account.user.id), id); } catch {}
  }, [account]);
  const signOut = useCallback(async () => {
    setAccount(null); setSelected(''); setSession(null);
    await supabase?.auth.signOut({ scope: 'local' });
  }, []);
  const value = useMemo(() => ({ session, account, workspace, loading: !sessionReady || (!account && (busy || (!!session && !error))), error: error || (!authConfigured ? 'AUTH_NOT_CONFIGURED' : ''), selectWorkspace, refresh, signOut }), [session, account, workspace, sessionReady, busy, error, selectWorkspace, refresh, signOut]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider missing'); return value; }
