'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { api, ApiError } from '@/lib/api';
import { projectStorageKey } from '@/lib/auth-utils.mjs';
import type { Project } from '@/lib/account-types';
type Value = { projects: Project[]; project: Project | null; loading: boolean; error: string; select: (id: string) => void; refresh: () => void };
const Context = createContext<Value | null>(null);
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { account, workspace } = useAuth();
  const scope = account && workspace ? `${account.user.id}:${workspace.id}` : '';
  const [result, setResult] = useState<{ scope: string; projects: Project[] }>({ scope: '', projects: [] });
  const [selected, setSelected] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    if (!account || !workspace) { setResult({ scope: '', projects: [] }); return; }
    let alive = true; const controller = new AbortController();
    setBusy(true); setError('');
    api<Project[]>(`/api/projects?workspace_id=${workspace.id}`, { signal: controller.signal }).then(projects => {
      if (!alive) return;
      setResult({ scope, projects });
      let saved = ''; try { saved = localStorage.getItem(projectStorageKey(account.user.id, workspace.id)) || ''; } catch {}
      setSelected(prev => projects.some(p => p.id === prev) ? prev : projects.some(p => p.id === saved) ? saved : projects[0]?.id || '');
    }).catch(e => { if (alive) { setResult({ scope, projects: [] }); setError(e instanceof ApiError ? e.code : 'NETWORK_ERROR'); } })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; controller.abort(); };
  }, [scope, revision]);
  const projects = result.scope === scope ? result.projects : [];
  const select = (id: string) => {
    if (!account || !workspace || !projects.some(p => p.id === id)) return;
    setSelected(id);
    try { localStorage.setItem(projectStorageKey(account.user.id, workspace.id), id); } catch {}
  };
  return <Context.Provider value={{ projects, project: projects.find(p => p.id === selected) || null, loading: busy || (!!scope && result.scope !== scope), error, select, refresh }}>{children}</Context.Provider>;
}
export function useProjects() { const value = useContext(Context); if (!value) throw new Error('ProjectProvider missing'); return value; }
