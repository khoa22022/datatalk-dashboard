'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Clock3, Plus, Users, Wrench } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useProjects } from '@/components/ProjectProvider';
import { useI18n } from '@/components/i18n';
import { useV2Copy } from '@/components/v2/copy';
import { NoProjects } from '@/components/v2/LiveData';
import { mayCreate } from '@/lib/auth-utils.mjs';
import { api } from '@/lib/api';

type Summary = {
  id:string; name:string; domain?:string|null; platform?:string|null; business_goal?:string|null;
  metrics:{users:number;sessions:number;uxHealthScore:number|null;issueCount:number;lastEventAt:string|null;connected:boolean;setupProgress:number}
};

export default function Projects() {
  const { workspace } = useAuth(); const { projects, loading, error, select, refresh } = useProjects(); const { c, errorText } = useV2Copy(); const {lang}=useI18n(); const vi=lang==='vi'; const router = useRouter();
  const [summaries,setSummaries]=useState<Summary[]|null>(null); const [summaryError,setSummaryError]=useState('');
  useEffect(()=>{if(!workspace?.id)return;let alive=true;api<Summary[]>(`/api/workspaces/${workspace.id}/project-summaries`).then(x=>alive&&setSummaries(x)).catch(e=>alive&&setSummaryError(e?.code||'NETWORK_ERROR'));return()=>{alive=false}},[workspace?.id,projects.length]);
  const rows=summaries||projects.map(p=>({...p,metrics:{users:0,sessions:0,uxHealthScore:null,issueCount:0,lastEventAt:null,connected:false,setupProgress:20}} as Summary));
  const lastEvent=(iso:string|null)=>!iso?'--':new Intl.RelativeTimeFormat(vi?'vi':'en',{numeric:'auto'}).format(-Math.max(1,Math.round((Date.now()-new Date(iso).getTime())/60000)),'minute');
  return <>
    <div className="page-head page-head-v2"><div><div className="eyebrow">{workspace?.name}</div><h1>{c('projects')}</h1><p>{vi?'Theo dõi tình trạng cài đặt và các KPI chính của từng sản phẩm bằng dữ liệu thật.':'Track setup state and core real-data KPIs for every product.'}</p></div>{mayCreate(workspace?.role)&&<Link className="btn primary btn-lg" href="/projects/new"><Plus size={17}/>{c('addProject')}</Link>}</div>
    {(error||summaryError)?<div role="alert" className="account-alert error">{error?errorText(error):summaryError}<button className="btn outline" onClick={()=>{refresh();setSummaries(null)}}>{c('retry')}</button></div>:loading?<p role="status">{c('working')}</p>:!projects.length?<NoProjects/>:
      <div className="project-summary-grid">{rows.map(p=><section key={p.id} className="card project-summary-card">
        <div className="project-card-top"><div><span className="account-badge">{p.platform||'Website'}</span><h2>{p.name}</h2><p>{p.domain||'--'}</p></div><span className={`project-status ${p.metrics.connected?'connected':'pending'}`}>{p.metrics.connected?(vi?'Đang theo dõi':'Tracking'):(vi?'Chờ kết nối':'Waiting')}</span></div>
        <div className="project-setup-row"><span>{vi?'Tiến độ cài đặt':'Setup progress'}</span><strong>{p.metrics.setupProgress}%</strong></div><div className="project-progress"><i style={{width:`${p.metrics.setupProgress}%`}}/></div>
        <div className="project-kpi-grid">
          <div><Users size={16}/><span>{vi?'Người dùng':'Users'}</span><b>{p.metrics.connected?p.metrics.users:'--'}</b></div>
          <div><Activity size={16}/><span>{vi?'Điểm UX':'UX score'}</span><b>{p.metrics.connected&&p.metrics.uxHealthScore!=null?p.metrics.uxHealthScore:'--'}</b></div>
          <div><Clock3 size={16}/><span>{vi?'Event gần nhất':'Last event'}</span><b>{lastEvent(p.metrics.lastEventAt)}</b></div>
          <div><Wrench size={16}/><span>{vi?'Vấn đề UX':'UX issues'}</span><b>{p.metrics.connected?p.metrics.issueCount:'--'}</b></div>
        </div>
        <div className="account-actions"><Link href={`/projects/${p.id}/connect`} className="btn outline">{c('setup')}</Link><button className="btn primary" onClick={()=>{select(p.id);router.push('/dashboard')}}>{vi?'Mở phân tích':'Open analytics'}</button></div>
      </section>)}</div>}
  </>;
}
