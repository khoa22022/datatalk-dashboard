'use client';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useV2Copy } from '@/components/v2/copy';
export default function Settings() {
  const { account, workspace } = useAuth(); const { c } = useV2Copy();
  return <><div className="page-head"><div><div className="eyebrow">ACCOUNT</div><h1>{c('settings')}</h1><p>{c('privateData')}</p></div></div>
    <div className="account-grid"><section className="account-panel"><h2>{c('myAccount')}</h2><dl className="account-details"><dt>{c('name')}</dt><dd>{account?.user.name || '-'}</dd><dt>{c('email')}</dt><dd>{account?.user.email}</dd><dt>{c('accountRole')}</dt><dd>{account?.user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'User'}</dd></dl><Link href="/forgot-password" className="btn outline">{c('reset')}</Link></section>
    <section className="account-panel"><h2>{workspace?.name}</h2><p>{c('workspaceRole')}: <strong>{workspace?.role}</strong></p><p className="muted">{c('privateData')}</p><Link href="/settings/members" className="btn primary">{c('team')}</Link>{account?.isSuperAdmin && <p><Link href="/admin/users">{c('systemUsers')}</Link></p>}</section></div>
  </>;
}
