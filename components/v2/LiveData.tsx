'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useProjects } from '@/components/ProjectProvider';
import { useV2Copy } from './copy';
import { mayCreate } from '@/lib/auth-utils.mjs';
import { api } from '@/lib/api';
export function NoProjects() {
  const { workspace } = useAuth(); const { c } = useV2Copy();
  return <section className="empty-state-v2 card"><h2>{c('noProjects')}</h2><p>{c(mayCreate(workspace?.role) ? 'noProjectSub' : 'readOnly')}</p>{mayCreate(workspace?.role) && <Link href="/projects/new" className="btn primary">{c('addProject')}</Link>}</section>;
}
export function useLiveResource<T>(endpoint: string) {
  const { account, workspace } = useAuth(); const { project } = useProjects();
  const scope = `${account?.user.id}:${workspace?.id}:${project?.id}:${endpoint}`;
  const [result, setResult] = useState<{ scope: string; data: T } | null>(null); const [error, setError] = useState<unknown>(null); const [loading, setLoading] = useState(false); const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!account || !workspace || !project) return;
    let alive = true; const controller = new AbortController(); setLoading(true); setError(null);
    api<T>(`/api/projects/${project.id}/${endpoint}`, { signal: controller.signal }).then(data => { if (alive) setResult({ scope, data }); })
      .catch(e => { if (alive) setError(e); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; controller.abort(); };
  }, [scope, revision]);
  return { data: result?.scope === scope ? result.data : null, error, loading, retry: () => setRevision(n => n + 1) };
}
export function LiveBoundary({ title, loading, error, retry, children }: { title: string; loading?: boolean; error?: unknown; retry?: () => void; children: React.ReactNode }) {
  const { project, projects, loading: projectLoading, error: projectError, refresh } = useProjects(); const { c, errorText } = useV2Copy();
  const failure = projectError || error;
  return <><div className="page-head"><div><div className="eyebrow">{project?.name || c('liveData')}</div><h1>{title}</h1><p>{c('dataScope')}</p></div></div>
    {failure ? <div role="alert" className="account-alert error">{errorText(failure)}<button className="btn outline" onClick={projectError ? refresh : retry}>{c('retry')}</button></div>
      : projectLoading || loading ? <p className="account-panel" role="status">{c('working')}</p>
      : !projects.length ? <NoProjects/> : children}
  </>;
}
export function DataTable({ headings, rows }: { headings: string[]; rows: React.ReactNode[][] }) {
  const { c } = useV2Copy();
  return rows.length ? <div className="account-table-wrap"><table className="account-table"><thead><tr>{headings.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell ?? '-'}</td>)}</tr>)}</tbody></table></div> : <p className="muted">{c('noData')}</p>;
}
export function duration(ms: number | null | undefined) { return ms == null ? '-' : ms < 60000 ? `${Math.round(ms / 1000)}s` : `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`; }
