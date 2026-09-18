'use client';
import Link from 'next/link';
import {Plus,FolderKanban,ArrowRight,CheckCircle2} from 'lucide-react';
import {useI18n} from '@/components/i18n';
export default function Projects(){const {t}=useI18n();return <>
  <div className="page-head page-head-v2"><div><div className="eyebrow">{t('projectsTitle')}</div><h1>{t('yourProducts')}</h1><p>{t('projectsSubtitle')}</p></div><Link className="btn primary btn-lg" href="/projects/new"><Plus size={17}/>{t('addProject')}</Link></div>
  <div className="empty-state-v2 card"><div className="empty-icon"><FolderKanban size={26}/></div><div><h2>{t('createNewProject')}</h2><p>{t('createProjectSubtitle')}</p></div><div className="empty-checks"><span><CheckCircle2 size={15}/>{t('guidedInstallation')}</span><span><CheckCircle2 size={15}/>{t('verifyBeforeFinish')}</span></div><Link className="btn primary btn-lg" href="/projects/new">{t('addProject')}<ArrowRight size={16}/></Link></div>
</>}
