'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useV2Copy } from '@/components/v2/copy';
import { ConfirmDialog } from '@/components/v2/ConfirmDialog';
import { api } from '@/lib/api';
import { assignableRoles, mayChangeMember } from '@/lib/auth-utils.mjs';
import type { Profile, Invitation, WorkspaceRole } from '@/lib/account-types';
type Member = { id: string; user_id: string; role: WorkspaceRole; user?: Profile };
type MembersResult = { members: Member[]; invitations: Invitation[]; my_role: WorkspaceRole };
type Change = { path: string; method: string; body?: object; title: string; description: string };
export default function MembersPage() {
  const auth = useAuth(); const workspace = auth.workspace; const { c, errorText } = useV2Copy();
  const [data, setData] = useState<MembersResult | null>(null); const [incoming, setIncoming] = useState<Invitation[]>([]);
  const [email, setEmail] = useState(''); const [role, setRole] = useState('VIEWER'); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [revision, setRevision] = useState(0); const [change, setChange] = useState<Change | null>(null);
  const roles = assignableRoles(data?.my_role || workspace?.role);
  useEffect(() => {
    if (!workspace) return;
    let alive = true; const controller = new AbortController(); setLoading(true); setError('');
    Promise.all([api<MembersResult>(`/api/workspaces/${workspace.id}/members`, { signal: controller.signal }), api<Invitation[]>('/api/invitations', { signal: controller.signal })])
      .then(([members, invites]) => { if (alive) { setData(members); setIncoming(invites); } })
      .catch(e => { if (alive) setError(errorText(e)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; controller.abort(); };
  }, [workspace?.id, workspace?.role, revision]);
  async function invite(e: React.FormEvent) {
    e.preventDefault(); if (!workspace || busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await api(`/api/workspaces/${workspace.id}/invitations`, { method: 'POST', body: JSON.stringify({ email, role }) }); setEmail(''); setNotice(c('inviteCreated')); setRevision(n => n + 1); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  async function commit() {
    if (!change || busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await api(change.path, { method: change.method, body: change.body ? JSON.stringify(change.body) : undefined }); setChange(null); setNotice(c('saved')); setRevision(n => n + 1); }
    catch (e) { setChange(null); setError(errorText(e)); } finally { setBusy(false); }
  }
  async function accept(id: string) {
    if (busy) return; setBusy(true); setError('');
    try { await api(`/api/invitations/${id}/accept`, { method: 'POST' }); auth.refresh(); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  const roleName = (value: string) => c(`role${value[0]}${value.slice(1).toLowerCase()}`);
  return <><div className="page-head"><div><div className="eyebrow">{workspace?.name}</div><h1>{c('team')}</h1><p>{c('permissionScope')}</p></div></div>
    {error && <div className="account-alert error" role="alert">{error}<button className="btn outline" onClick={() => setRevision(n => n + 1)}>{c('retry')}</button></div>}
    {notice && <div className="account-alert success" role="status">{notice}<p><code>{typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register'}</code></p></div>}
    {incoming.length > 0 && <section className="account-panel"><h2>{c('invitedYou')}</h2>{incoming.map(i => <div className="account-invitation" key={i.id}><div><strong>{i.workspace_name}</strong><p>{roleName(i.role)} - {i.email}</p></div><button className="btn primary" disabled={busy} onClick={() => void accept(i.id)}>{c('join')}</button></div>)}</section>}
    <div className="account-role-guide">{['OWNER','ADMIN','EDITOR','VIEWER'].map(r => <div key={r}><strong>{roleName(r)}</strong><p>{c(`role${r[0]}${r.slice(1).toLowerCase()}Desc`)}</p></div>)}</div>
    {roles.length > 0 && <section className="account-panel"><h2>{c('invite')}</h2><form className="account-invite-form" onSubmit={invite}><label>{c('email')}<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@company.com"/></label><label>{c('role')}<select value={role} onChange={e => setRole(e.target.value)}>{roles.map(r => <option key={r} value={r}>{roleName(r)}</option>)}</select></label><button className="btn primary" disabled={busy}>{busy ? c('working') : c('invite')}</button></form><p className="muted">{c('invitationNotice')}</p></section>}
    <section className="account-panel"><h2>{c('member')}</h2>{loading ? <p role="status">{c('working')}</p> : <div className="account-table-wrap"><table className="account-table"><thead><tr><th>{c('member')}</th><th>{c('role')}</th><th>{c('status')}</th><th>{c('actions')}</th></tr></thead><tbody>{data?.members.map(m => {
      const editable = m.user_id !== auth.account?.user.id && mayChangeMember(data.my_role, m.role);
      return <tr key={m.id}><td><strong>{m.user?.name || m.user?.email}</strong><small>{m.user?.email}</small></td><td>{editable ? <select aria-label={`${c('role')}: ${m.user?.email}`} value={m.role} disabled={busy} onChange={e => setChange({ path:`/api/workspaces/${workspace?.id}/members/${m.user_id}`, method:'PATCH', body:{role:e.target.value}, title:c('changeRole'), description:`${m.user?.email}: ${roleName(m.role)} -> ${roleName(e.target.value)}. ${c('roleConfirm')}` })}>{roles.map(r => <option key={r} value={r}>{roleName(r)}</option>)}</select> : <span className="account-badge">{roleName(m.role)}</span>}</td><td>{m.user?.status === 'SUSPENDED' ? c('suspended') : c('active')}</td><td>{editable ? <button className="btn outline" disabled={busy} onClick={() => setChange({path:`/api/workspaces/${workspace?.id}/members/${m.user_id}`,method:'DELETE',title:c('remove'),description:`${m.user?.email}. ${c('removeConfirm')}`})}>{c('remove')}</button> : <span className="muted">{m.role === 'OWNER' ? c('ownerHint') : '-'}</span>}</td></tr>;
    })}</tbody></table></div>}</section>
    {roles.length > 0 && <section className="account-panel"><h2>{c('pending')}</h2>{!data?.invitations.length ? <p className="muted">{c('noInvites')}</p> : data.invitations.map(i => <div className="account-invitation" key={i.id}><div><strong>{i.email}</strong><p>{roleName(i.role)} - {c('expires')}: {new Date(i.expires_at).toLocaleString()}</p></div>{mayChangeMember(data.my_role, i.role) && <button className="btn outline" disabled={busy} onClick={() => setChange({path:`/api/workspaces/${workspace?.id}/invitations/${i.id}`,method:'DELETE',title:c('revoke'),description:i.email})}>{c('revoke')}</button>}</div>)}</section>}
    {change && <ConfirmDialog title={change.title} description={change.description} busy={busy} onConfirm={() => void commit()} onCancel={() => setChange(null)}/>}
  </>;
}
