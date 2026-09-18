"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Flame, PlaySquare, ListChecks, MessageSquareText,
  GitBranch, Sparkles, Radio, FolderKanban, Settings, CircleHelp, LogOut,
  Activity, ChevronRight
} from "lucide-react";
import {useI18n} from "./i18n";
import LanguageSwitcher from "./LanguageSwitcher";

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
  const authPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/auth/");
  if(authPage) return <>{children}</>;

  const trialMode = pathname === "/try" || pathname.startsWith("/try/");
  const items = trialMode ? trialItems : appItems;
  const active = items.find(item => isActive(pathname,item));
  const pageLabel = active ? t(active.key) : t("productExperience");

  return <div className="shell app-shell-v2">
    <aside className="sidebar sidebar-v2">
      <Link href={trialMode?"/try":"/dashboard"} className="brand brand-v2" aria-label="Datatalk home">
        <span className="brand-symbol"><Sparkles size={16}/></span>
        <span className="brand-word">datatalk</span>
      </Link>

      <div className="workspace-card">
        <div className="workspace-kicker">{trialMode?t("trialWorkspace"):t("workspace")}</div>
        <div className="workspace-name">{trialMode?"Sweet Pea Website":"Tan Khoa Workspace"}</div>
        <div className="workspace-status"><i></i>{t("trackingActive")}</div>
      </div>

      <div className="nav-title">{trialMode?t("analyze"):t("product")}</div>
      <nav className="nav nav-v2" aria-label="Primary navigation">
        {items.map(item=>{
          const Icon=item.icon; const selected=isActive(pathname,item);
          return <Link href={item.href} key={item.href} className={`nav-item ${selected?"active":""}`} aria-current={selected?"page":undefined}>
            <Icon size={18}/><span>{t(item.key)}</span>{selected&&<ChevronRight size={15} className="nav-chevron"/>}
          </Link>
        })}
      </nav>

      <div className="sidebar-footer">
        <Link className="sidebar-link" href="/settings"><CircleHelp size={17}/><span>{t("help")}</span></Link>
        {trialMode && <Link className="sidebar-link" href="/login"><LogOut size={17}/><span>{t("exitTrial")}</span></Link>}
      </div>
    </aside>

    <div className="content content-v2">
      <header className="topbar topbar-v2">
        <div className="topbar-context">
          <div className="breadcrumb-v2"><span>{t("workspace")}</span><ChevronRight size={13}/><strong>{pageLabel}</strong></div>
          {trialMode && <div className="project-context"><span className="project-context-name">Sweet Pea Website</span><span className="live-status"><i></i>{t("trackingActive")}</span></div>}
        </div>
        <div className="top-actions">
          <div className="sync-chip"><Activity size={14}/><span>{t("lastSync")}</span></div>
          <LanguageSwitcher/>
        </div>
      </header>
      <main className="main main-v2"><div className="page-transition" key={pathname}>{children}</div></main>
    </div>
  </div>
}
