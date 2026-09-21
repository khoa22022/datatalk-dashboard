"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Flame, PlaySquare, ListChecks, MessageSquareText,
  GitBranch, Sparkles, Radio, FolderKanban, Settings, CircleHelp, LogOut,
  Activity, ChevronRight, Users, ShieldCheck
} from "lucide-react";
import {useI18n} from "./i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from './AuthProvider';
import { useProjects } from './ProjectProvider';
import { AuthGate } from './v2/AuthGate';
import { useV2Copy } from './v2/copy';

type Item = { href:string; key:string; icon:typeof LayoutDashboard; match?:string[] };

const trialItems: Item[] = [
  {href:"/try",key:"overview",icon:LayoutDashboard},
  {href:"/try/projects",key:"projectsTitle",icon:FolderKanban},
  {href:"/try/analytics",key:"analytics",icon:BarChart3},
  {href:"/try/heatmaps",key:"heatmaps",icon:Flame},
  {href:"/try/sessions",key:"sessions",icon:PlaySquare},
  {href:"/try/tasks",key:"tasks",icon:ListChecks},
  {href:"/try/feedback",key:"feedback",icon:MessageSquareText},
  {href:"/try/funnels",key:"funnels",icon:GitBranch},
  {href:"/try/ai",key:"ai",icon:Sparkles},
  {href:"/try/sandbox",key:"sandbox",icon:Radio},
];

const appItems: Item[] = [
  {href:"/dashboard",key:"overview",icon:LayoutDashboard},
  {href:"/projects",key:"projectsTitle",icon:FolderKanban,match:["/projects"]},
  {href:"/analytics",key:"analytics",icon:BarChart3},
  {href:"/heatmaps",key:"heatmaps",icon:Flame},
  {href:"/sessions",key:"sessions",icon:PlaySquare},
  {href:"/tasks",key:"tasks",icon:ListChecks},
  {href:"/feedback",key:"feedback",icon:MessageSquareText},
  {href:"/funnels",key:"funnels",icon:GitBranch},
  {href:"/ai",key:"ai",icon:Sparkles},
  {href:"/settings",key:"settings",icon:Settings},
];

function isActive(pathname:string,item:Item){
  if(item.href === "/try") return pathname === "/try";
  if(item.href === "/dashboard") return pathname === "/dashboard";
  const roots = item.match || [item.href];
  return roots.some(root => pathname === root || pathname.startsWith(`${root}/`));
}

export default function LayoutShell({children}:{children:React.ReactNode}){
  const pathname = usePathname();
  const {t} = useI18n();
  const auth = useAuth(); const projectScope = useProjects(); const { c } = useV2Copy();
  const labelFor = (key: string) => key.startsWith('v2.') ? c(key.slice(3)) : t(key);
  const authPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/auth/") || pathname === "/forgot-password" || pathname === "/reset-password";
  if(authPage) return <>{children}</>;

  const trialMode = pathname === "/try" || pathname.startsWith("/try/");
  const items: Item[] = trialMode ? trialItems : [...appItems,
    { href:'/settings/members', key:'v2.team', icon:Users },
    ...(auth.account?.isSuperAdmin ? [{ href:'/admin/users', key:'v2.systemUsers', icon:ShieldCheck }] : [])
  ];
  const active = items.find(item => (item.href === "/settings" ? pathname === "/settings" : isActive(pathname,item)));
  const pageLabel = active ? labelFor(active.key) : t("productExperience");

  const shell = <div className="shell app-shell-v2">
    <aside className="sidebar sidebar-v2">
      <Link href={trialMode?"/try":"/dashboard"} className="brand brand-v2" aria-label="Datatalk home">
        <span className="brand-symbol"><Sparkles size={16}/></span>
        <span className="brand-word">datatalk</span>
      </Link>

      <div className="workspace-card">
        <div className="workspace-kicker">{trialMode?t("trialWorkspace"):t("workspace")}</div>
        {trialMode ? <div className="workspace-name">Sweet Pea Website</div> : <label className="account-workspace-select"><span className="sr-only">{c('workspace')}</span><select value={auth.workspace?.id || ''} onChange={e => auth.selectWorkspace(e.target.value)}>{auth.account?.workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
        <div className="workspace-status">{trialMode ? c('demoLabel') : auth.workspace?.role}</div>
      </div>

      <div className="nav-title">{trialMode?t("analyze"):t("product")}</div>
      <nav className="nav nav-v2" aria-label="Primary navigation">
        {items.map(item=>{
          const Icon=item.icon; const selected=(item.href === "/settings" ? pathname === "/settings" : isActive(pathname,item));
          return <Link href={item.href} key={item.href} className={`nav-item ${selected?"active":""}`} aria-current={selected?"page":undefined}>
            <Icon size={18}/><span>{labelFor(item.key)}</span>{selected&&<ChevronRight size={15} className="nav-chevron"/>}
          </Link>
        })}
      </nav>

      <div className="sidebar-footer">
        <Link className="sidebar-link" href="/settings"><CircleHelp size={17}/><span>{t("help")}</span></Link>
        {trialMode ? <Link className="sidebar-link" href="/login"><LogOut size={17}/><span>{t("exitTrial")}</span></Link> : <button type="button" className="sidebar-link account-logout" onClick={() => void auth.signOut().then(() => window.location.assign('/login'))}><LogOut size={17}/><span>{c('signOut')}</span></button>}
      </div>
    </aside>

    <div className="content content-v2">
      <header className="topbar topbar-v2">
        <div className="topbar-context">
          <div className="breadcrumb-v2"><span>{t("workspace")}</span><ChevronRight size={13}/><strong>{pageLabel}</strong></div>
          {trialMode && <div className="project-context"><span className="project-context-name">Sweet Pea Website</span><span className="live-status"><i></i>{t("trackingActive")}</span></div>}
        </div>
        <div className="top-actions">
          {trialMode ? <div className="sync-chip"><Activity size={14}/><span>{c('demoLabel')}</span></div> : <><span className="account-identity" title={auth.account?.user.email}>{auth.account?.user.email}</span>{projectScope.projects.length > 0 && <label className="account-project-select"><span className="sr-only">{c('projects')}</span><select value={projectScope.project?.id || ''} onChange={e => projectScope.select(e.target.value)}>{projectScope.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}</>}
          <LanguageSwitcher/>
        </div>
      </header>
      <main className="main main-v2">{trialMode && <div className="account-alert demo">{c('demoLabel')}</div>}<div className="page-transition" key={`${pathname}:${auth.account?.user.id || 'demo'}:${auth.workspace?.id || ''}:${projectScope.project?.id || ''}`}>{children}</div></main>
    </div>
  </div>;
  return trialMode ? shell : <AuthGate>{shell}</AuthGate>;
}
