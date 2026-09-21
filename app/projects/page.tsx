'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useProjects } from '@/components/ProjectProvider';
import { useV2Copy } from '@/components/v2/copy';
import { NoProjects } from '@/components/v2/LiveData';
import { mayCreate } from '@/lib/auth-utils.mjs';
export default function Projects() {
  const { workspace } = useAuth(); const { projects, loading, error, select, refresh } = useProjects(); const { c, errorText } = useV2Copy(); const router = useRouter();
  return <><div className="page-head page-head-v2"><div><div className="eyebrow">{workspace?.name}</div><h1>{c('projects')}</h1><p>{c('privateData')}</p></div>{mayCreate(workspace?.role) && <Link className="btn primary btn-lg" href="/projects/new"><Plus size={17}/>{c('addProject')}</Link>}</div>
    {error ? <div role="alert" className="account-alert error">{errorText(error)}<button className="btn outline" onClick={refresh}>{c('retry')}</button></div> : loading ? <p role="status">{c('working')}</p> : !projects.length ? <NoProjects/> : <div className="account-project-grid">{projects.map(p => <section key={p.id} className="card account-project-card"><span className="account-badge">{p.platform}</span><h2>{p.name}</h2><p>{p.domain || '-'}</p><p>{p.business_goal}</p><div className="account-actions"><Link href={`/projects/${p.id}/connect`} className="btn outline">{c('setup')}</Link><button className="btn primary" onClick={() => { select(p.id); router.push('/dashboard'); }}>{c('open')}</button></div></section>)}</div>}
  </>;
}
