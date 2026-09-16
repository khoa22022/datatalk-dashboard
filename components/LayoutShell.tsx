"use client";
import Link from "next/link";
import {LayoutDashboard, BarChart3, Flame, PlaySquare, ListChecks, MessageSquareText, GitBranch, Sparkles, Radio} from "lucide-react";
import {useI18n} from "./i18n";
import LanguageSwitcher from "./LanguageSwitcher";
const items=[['/try','overview',LayoutDashboard],['/try/analytics','analytics',BarChart3],['/try/heatmaps','heatmaps',Flame],['/try/sessions','sessions',PlaySquare],['/try/tasks','tasks',ListChecks],['/try/feedback','feedback',MessageSquareText],['/try/funnels','funnels',GitBranch],['/try/ai','ai',Sparkles],['/try/sandbox','sandbox',Radio]] as const;
export default function LayoutShell({children}:{children:React.ReactNode}){const {t}=useI18n();return <div className="shell"><aside className="sidebar"><div className="brand"><span>✦</span> datatalk</div><div className="trial">{t('trial')}</div><div className="nav-title">{t('analyze')}</div><nav className="nav">{items.map(([href,key,Icon])=><Link href={href} key={href}><Icon size={17}/>{t(key)}</Link>)}</nav></aside><div className="content"><header className="topbar"><div className="breadcrumb">{t('workspace')} / {t('productExperience')}</div><div className="top-actions"><span className="breadcrumb hide-mobile">{t('demoDataset')}</span><LanguageSwitcher/></div></header><main className="main">{children}</main></div></div>}
