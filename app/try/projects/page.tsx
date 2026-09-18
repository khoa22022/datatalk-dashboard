'use client';
import Link from 'next/link';
import {Globe2,ArrowUpRight,Plus,CheckCircle2,MoreHorizontal,LayoutGrid,Smartphone,PenTool} from 'lucide-react';
import {useI18n} from '@/components/i18n';

const items=[
  {name:'Sweet Pea Website',platform:'Next.js',visitors:'12,421',score:'86',progress:100,Icon:Globe2},
  {name:'Tan Khoa Portfolio',platform:'Figma Site',visitors:'3,842',score:'91',progress:100,Icon:PenTool},
  {name:'Datatalk Marketing',platform:'React',visitors:'1,284',score:'78',progress:82,Icon:LayoutGrid},
];

export default function TrialProjects(){const {t}=useI18n();return <>
  <header className="page-head page-head-v2">
    <div><div className="eyebrow">{t('projectsTitle')}</div><h1>{t('yourProducts')}</h1><p>{t('projectsSubtitle')}</p></div>
    <Link href="/projects/new" className="btn primary btn-lg"><Plus size={17}/>{t('addProject')}</Link>
  </header>
  <div className="project-grid project-grid-v2">
    {items.map(({name,platform,visitors,score,progress,Icon})=><article className="project-card project-card-v2" key={name}>
      <div className="project-card-top"><div className="project-icon project-icon-v2"><Icon size={19}/></div><button className="icon-btn" aria-label="More options"><MoreHorizontal size={18}/></button></div>
      <div className="project-card-title-row"><div><h2>{name}</h2><p>{platform}</p></div><span className="project-status"><CheckCircle2 size={14}/>{t('trackingActive')}</span></div>
      <div className="project-health"><div className="project-health-row"><span>{t('setupProgress')}</span><strong>{progress}%</strong></div><div className="progress-track"><i style={{width:`${progress}%`}}/></div></div>
      <div className="project-metrics"><div><small>{t('visitors')}</small><b>{visitors}</b></div><div><small>{t('uxScore')}</small><b>{score}</b></div><div><small>{t('lastEvent')}</small><b className="metric-small">2m</b></div></div>
      <div className="project-card-footer"><Link href="/try/analytics" className="project-link">{t('openAnalytics')}<ArrowUpRight size={15}/></Link><span>{t('connected')}</span></div>
    </article>)}
  </div>
</>}
