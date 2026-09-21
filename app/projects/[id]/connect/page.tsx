'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, API } from '@/lib/api';
import type { Project } from '@/lib/account-types';
import { useProjects } from '@/components/ProjectProvider';
import { useV2Copy } from '@/components/v2/copy';
export default function ConnectProject(){
 const {id}=useParams<{id:string}>();const router=useRouter();const projectScope=useProjects();const {c,errorText}=useV2Copy();
 const [project,setProject]=useState<Project|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [copied,setCopied]=useState(false);const [last,setLast]=useState<{connected:boolean;last_event:{created_at:string}|null}|null>(null);
 useEffect(()=>{let alive=true;api<Project>(`/api/projects/${id}`).then(p=>{if(alive)setProject(p)}).catch(e=>{if(alive)setError(errorText(e))});return()=>{alive=false}},[id]);
 async function check(){if(busy)return;setBusy(true);setError('');try{setLast(await api(`/api/projects/${id}/connection`))}catch(e){setError(errorText(e))}finally{setBusy(false)}}
 const snippet=project?`<script defer src="${API}/sdk/datatalk.js" data-project="${project.tracking_key}"></script>`:'';
 async function copy(){try{await navigator.clipboard.writeText(snippet);setCopied(true)}catch{setError('Select the code below and copy it manually.')}}
 return <><div className="page-head"><div><div className="eyebrow">03 / 03</div><h1>{c('setup')}</h1><p>{project?.name}</p></div></div>{error&&<div className="account-alert error" role="alert">{error}</div>}{!project?<p role="status">{c('working')}</p>:<section className="account-panel">{project.platform==='Mobile App'?<p className="account-alert">{c('mobilePending')}</p>:<><p>{c('webScript')}</p>{project.platform==='Figma Site'&&<p className="muted">For a published Figma Site with custom code support; not for an interactive design prototype.</p>}<pre className="account-code"><code>{snippet}</code></pre><button className="btn outline" onClick={()=>void copy()}>{c(copied?'copied':'copy')}</button></>}
 <hr/><p>{c('trackingHint')}</p>{last&&<div role="status" className={`account-alert ${last.connected?'success':''}`}><strong>{c(last.connected?'trackingReceived':'trackingWaiting')}</strong>{last.last_event&&<p>{new Date(last.last_event.created_at).toLocaleString()}</p>}</div>}
 <div className="account-actions"><button className="btn outline" onClick={()=>void check()} disabled={busy}>{c(busy?'working':'connection')}</button><button className="btn primary" onClick={()=>{projectScope.select(project.id);router.push('/dashboard')}}>{c('viewData')}</button></div></section>}</>;
}
