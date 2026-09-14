'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bot, ChevronDown, ChevronRight, FolderKanban, Gauge, Globe2, Layers3, Map, PlaySquare, Route, Settings, ShieldCheck, Sparkles, Users } from 'lucide-react';

type NavItem = { href: string; label: string; icon: typeof Gauge; accent?: boolean };
type NavSection = { label: string; items: NavItem[] };

const sections: NavSection[] = [
  { label: 'PRODUCT', items: [
    { href:'/dashboard', label:'Overview', icon:Gauge },
    { href:'/projects', label:'Projects', icon:FolderKanban },
  ]},
  { label: 'BEHAVIOR', items: [
    { href:'/analytics', label:'Analytics', icon:BarChart3 },
    { href:'/heatmaps', label:'Heatmaps', icon:Map },
    { href:'/sessions', label:'Sessions', icon:PlaySquare },
    { href:'/funnels', label:'Funnels', icon:Route },
  ]},
  { label: 'INTELLIGENCE', items: [
    { href:'/ai', label:'AI Analyst', icon:Sparkles, accent:true },
  ]},
  { label: 'WORKSPACE', items: [
    { href:'/settings', label:'Settings', icon:Settings },
  ]},
];

export function Sidebar(){
  const pathname = usePathname();
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><Sparkles size={16}/></div><span>datatalk</span></div>
    <div className="workspace-switch"><div><span className="eyebrow">WORKSPACE</span><strong>Tan Khoa Workspace</strong></div><ChevronDown size={16}/></div>
    <nav>
      {sections.map(section => <div className="nav-section" key={section.label}>
        <div className="nav-section-label"><span></span>{section.label}</div>
        {section.items.map(item => { const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)); const Icon=item.icon; return <Link key={item.href} href={item.href} className={`nav-item ${active?'active':''} ${item.accent?'accent':''}`}><Icon size={18}/><span>{item.label}</span>{item.accent && <span className="ai-pill">AI</span>}</Link> })}
      </div>)}
    </nav>
    <div className="sidebar-bottom"><div className="pro-card"><div className="pro-icon"><ShieldCheck size={17}/></div><div><strong>Tracking health</strong><span><i></i> All systems operational</span></div></div></div>
  </aside>
}

export function MobileHeader(){ return <div className="mobile-header"><div className="brand"><div className="brand-mark"><Sparkles size={16}/></div><span>datatalk</span></div></div> }
