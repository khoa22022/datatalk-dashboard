'use client';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
export function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <main className="account-auth"><section className="account-auth-card">
    <div className="account-auth-top"><Link href="/login" className="brand-v2 account-brand"><span className="brand-symbol brand-logo"><img src="/datatalk-logo.png" alt="" /></span><strong>DataTalk</strong></Link><LanguageSwitcher/></div>
    <h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}{children}
  </section></main>;
}
