'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, ChevronDown, ChevronRight, CircleHelp, LogOut, Search, Settings2, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import LanguageSwitcher from './LanguageSwitcher';

function initials(name?: string | null, email?: string | null) {
  const value = (name || '').trim();
  if (value) return value.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  return (email || 'U').trim().slice(0, 1).toUpperCase();
}

export function Topbar({title='Overview'}:{title?:string}){
  const [user, setUser] = useState<{name?:string;email?:string}|null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mounted = true;
    (async () => { if (!supabase) return; const {data} = await supabase.auth.getUser(); if (mounted && data.user) setUser({name:data.user.user_metadata?.name || data.user.user_metadata?.full_name || undefined, email:data.user.email || undefined}); })();
    const {data: listener} = supabase?.auth.onAuthStateChange((_event, session) => { if (mounted) setUser(session?.user ? {name:session.user.user_metadata?.name || session.user.user_metadata?.full_name || undefined, email:session.user.email || undefined} : null); }) || {data:{subscription:{unsubscribe(){}}}};
    const onClick = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => { mounted=false; listener?.subscription?.unsubscribe(); document.removeEventListener('mousedown', onClick); };
  }, []);
  async function signOut(){ if (supabase) await supabase.auth.signOut(); window.location.href='/login'; }
  const label = user?.name || user?.email || 'Account';
  return <header className="topbar topbar-v2">
    <div className="topbar-context"><div className="breadcrumb-v2"><span>Workspace</span><ChevronRight size={13}/><strong>{title}</strong></div></div>
    <div className="top-actions">
      <button className="icon-button-v2" aria-label="Search"><Search size={17}/></button>
      <div className="sync-chip"><CalendarDays size={14}/><span>Last 30 days</span></div><LanguageSwitcher/>
      <div className="account-menu" ref={menuRef}>
        <button className="account-trigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label="Open account menu">
          <span className="avatar avatar-v2">{initials(user?.name,user?.email)}</span>
          <span className="account-trigger-copy"><strong>{label}</strong><small>{user?.email || 'Manage account'}</small></span>
          <ChevronDown size={14}/>
        </button>
        {open && <div className="account-dropdown">
          <div className="account-dropdown-head"><span className="avatar avatar-v2 avatar-lg">{initials(user?.name,user?.email)}</span><div><strong>{label}</strong><small>{user?.email || ''}</small></div></div>
          <div className="account-divider"/>
          <Link href="/settings" onClick={()=>setOpen(false)}><Settings2 size={16}/>Quản lý tài khoản</Link>
          <Link href="/settings" onClick={()=>setOpen(false)}><CircleHelp size={16}/>Trợ giúp</Link>
          <div className="account-divider"/>
          <button className="account-danger" onClick={signOut}><LogOut size={16}/>Đăng xuất</button>
        </div>}
      </div>
    </div>
  </header>
}
