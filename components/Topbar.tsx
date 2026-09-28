'use client';
import { useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, CircleHelp, LogOut, Search, Settings2 } from 'lucide-react';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from './AuthProvider';
import { useProjects } from './ProjectProvider';
import { useV2Copy } from './v2/copy';

function initials(name?: string | null, email?: string | null) {
  const value = (name || '').trim();
  if (value) return value.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  return (email || 'U').trim().slice(0, 1).toUpperCase();
}

export function Topbar({title='Overview',trialMode=false}:{title?:string;trialMode?:boolean}){
  const auth=useAuth();
  const projects=useProjects();
  const {c}=useV2Copy();
  const [open,setOpen]=useState(false);
  const menuRef=useRef<HTMLDivElement>(null);
  const user=auth.account?.user;
  const label=user?.name || user?.email || c('myAccount');

  async function signOut(){
    await auth.signOut();
    window.location.assign('/login');
  }

  return <header className="topbar topbar-v2">
    <div className="topbar-context"><div className="breadcrumb-v2"><span>Workspace</span><ChevronRight size={13}/><strong>{title}</strong></div></div>
    <div className="top-actions">
      <button className="icon-button-v2" aria-label="Search"><Search size={17}/></button>
      {trialMode ? <div className="sync-chip"><CalendarDays size={14}/><span>{c('demoLabel')}</span></div> : projects.projects.length>0 ? <label className="account-project-select"><span className="sr-only">{c('projects')}</span><select value={projects.project?.id || ''} onChange={e=>projects.select(e.target.value)}>{projects.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label> : null}
      <LanguageSwitcher/>
      {!trialMode&&<div className="account-menu" ref={menuRef} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false)}}>
        <button className="account-trigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label="Open account menu">
          <span className="avatar avatar-v2">{initials(user?.name,user?.email)}</span>
          <span className="account-trigger-copy"><strong>{label}</strong><small>{user?.email || ''}</small></span>
          <ChevronDown size={14}/>
        </button>
        {open&&<div className="account-dropdown">
          <div className="account-dropdown-head"><span className="avatar avatar-v2 avatar-lg">{initials(user?.name,user?.email)}</span><div><strong>{label}</strong><small>{user?.email || ''}</small></div></div>
          <div className="account-divider"/>
          <Link href="/settings" onClick={()=>setOpen(false)}><Settings2 size={16}/>{c('settings')}</Link>
          <Link href="/settings" onClick={()=>setOpen(false)}><CircleHelp size={16}/>Help</Link>
          <div className="account-divider"/>
          <button className="account-danger" onClick={()=>void signOut()}><LogOut size={16}/>{c('signOut')}</button>
        </div>}
      </div>}
    </div>
  </header>;
}
