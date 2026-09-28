'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { AuthGate } from '@/components/v2/AuthGate';
import { ConfirmDialog } from '@/components/v2/ConfirmDialog';
import { useV2Copy } from '@/components/v2/copy';
import { api } from '@/lib/api';
import type { Profile } from '@/lib/account-types';
type Result = { users: Profile[]; total: number; page: number; page_size: number };
type Audit = { id: string; action: string; target: string; created_at: string };
export default function AdminUsers() {
  const { account } = useAuth(); const { c, errorText } = useV2Copy();
  const [data, setData] = useState<Result | null>(null); const [audit, setAudit] = useState<Audit[]>([]);
  const [search, setSearch] = useState(''); const [query, setQuery] = useState(''); const [page, setPage] = useState(1);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [revision, setRevision] = useState(0); const [target, setTarget] = useState<Profile | null>(null);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (!account?.isSuperAdmin) return;
    let alive = true; const controller = new AbortController(); setLoading(true); setError('');
    Promise.all([api<Result>(`/api/admin/users?page=${page}&search=${encodeURIComponent(query)}`,{signal:controller.signal}),api<Audit[]>('/api/admin/audit',{signal:controller.signal})])
      .then(([users,logs]) => { if (alive) { setData(users); setAudit(logs); } }).catch(e => { if (alive) setError(errorText(e)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive=false; controller.abort(); };
  }, [account?.isSuperAdmin, page, query, revision]);
  async function updateStatus() {
    if (!target || busy) return; setBusy(true); setError('');
    try { await api(`/api/admin/users/${target.id}/status`, {method:'PATCH',body:JSON.stringify({status:target.status==='SUSPENDED'?'ACTIVE':'SUSPENDED'})}); setTarget(null); setRevision(n => n+1); }
    catch(e) { setTarget(null); setError(errorText(e)); } finally { setBusy(false); }
  }
  return <AuthGate admin><div className="page-head"><div><div className="eyebrow">SUPER ADMIN</div><h1>{c('systemUsers')}</h1><p>{c('adminSub')}</p></div></div>
    {error && <div className="account-alert error" role="alert">{error}<button className="btn outline" onClick={()=>setRevision(n=>n+1)}>{c('retry')}</button></div>}
    <section className="account-panel"><label className="account-search">{c('search')}<input type="search" value={search} onChange={e=>setSearch(e.target.value)} maxLength={100}/></label>
    {loading ? <p role="status">{c('working')}</p> : <><div className="account-table-wrap"><table className="account-table"><thead><tr><th>{c('member')}</th><th>{c('accountRole')}</th><th>{c('status')}</th><th>{c('actions')}</th></tr></thead><tbody>{data?.users.map(user=><tr key={user.id}><td><strong>{user.name || user.email}</strong><small>{user.email}</small></td><td>{user.role==='SUPER_ADMIN'?'Super Admin':'User'}</td><td><span className={`account-badge ${user.status==='SUSPENDED'?'danger':''}`}>{user.status==='SUSPENDED'?c('suspended'):c('active')}</span></td><td>{user.id===account?.user.id || user.role==='SUPER_ADMIN'?<span className="muted">{c('adminProtected')}</span>:<button className="btn outline" disabled={busy} onClick={()=>setTarget(user)}>{c(user.status==='SUSPENDED'?'activate':'suspend')}</button>}</td></tr>)}</tbody></table>{!data?.users.length&&<p>{c('emptyUsers')}</p>}</div><div className="account-pagination"><button className="btn outline" disabled={page===1} onClick={()=>setPage(p=>p-1)}>{c('previous')}</button><span>{page} / {Math.max(1,Math.ceil((data?.total||0)/25))}</span><button className="btn outline" disabled={page*25 >= (data?.total||0)} onClick={()=>setPage(p=>p+1)}>{c('next')}</button></div></>}
    </section><section className="account-panel"><h2>{c('audit')}</h2>{!audit.length?<p className="muted">{c('noAudit')}</p>:<div className="account-table-wrap"><table className="account-table"><thead><tr><th>{c('actions')}</th><th>ID</th><th>Time</th></tr></thead><tbody>{audit.slice(0,20).map(row=><tr key={row.id}><td>{row.action}</td><td><code>{row.target}</code></td><td>{new Date(row.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</section>
    {target&&<ConfirmDialog title={c(target.status==='SUSPENDED'?'activate':'suspend')} description={`${target.email}. ${c(target.status==='SUSPENDED'?'activateConfirm':'suspendConfirm')}`} busy={busy} onConfirm={()=>void updateStatus()} onCancel={()=>setTarget(null)}/>}
  </AuthGate>;
}
