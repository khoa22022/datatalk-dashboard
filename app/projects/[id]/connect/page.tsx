'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, API } from '@/lib/api';
import type { Project } from '@/lib/account-types';
import { useProjects } from '@/components/ProjectProvider';
import { Check, ChevronRight, Copy, Globe2, ArrowRight, Mail, RefreshCw, UserRound, UsersRound } from 'lucide-react';

type Status = { connected:boolean; event_count:number; first_event_at:string|null; last_event:{created_at?:string}|null; setup:any };
type Installation = 'self'|'developer'|'handoff';
const guides:Record<string,{title:string;description:string;steps:string[];tip:string}> = {
  Website:{title:'Website',description:'Add one small script to your published website.',steps:['Copy the DataTalk code below.','Paste it before the closing </head> tag.','Publish your website.','Return here and check the connection.'],tip:'If you use a website builder, the same script can usually be added in the custom code or head area.'},
  'Web App':{title:'React / Next.js',description:'Add the DataTalk SDK once at the app shell.',steps:['Add the DataTalk script to the root layout or document head.','Publish the latest build.','Open the app and visit one page.','Return here and check the connection.'],tip:'Use the developer handoff if someone else manages deployment.'},
  'Mobile App':{title:'Mobile app',description:'Native mobile SDK support is planned.',steps:['Keep the project created.','Share the project key with your developer.','Native SDK setup will be enabled in a later release.'],tip:'Do not paste the web script into a native mobile app.'},
  'Figma Site':{title:'Figma Site',description:'Use the published site custom-code area.',steps:['Open your published Figma Site settings.','Add the script to the custom code / head area.','Publish the site.','Return here and check the connection.'],tip:'A design-only prototype that is not published cannot send real website events.'}
};

export default function ConnectProject(){
  const {id}=useParams<{id:string}>();
  const router=useRouter();
  const projectScope=useProjects();
  const [project,setProject]=useState<Project|null>(null);
  const [status,setStatus]=useState<Status|null>(null);
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  const [checking,setChecking]=useState(false);
  const [saved,setSaved]=useState(false);
  const [installation,setInstallation]=useState<Installation>('self');

  useEffect(()=>{
    let alive=true;
    Promise.all([api<Project>(`/api/projects/${id}`),api<Status>(`/api/projects/${id}/tracking/status`)]).then(([p,s])=>{
      if(!alive)return;
      setProject(p);setStatus(s);
      const existing=s.setup?.installation_type;
      if(existing==='self'||existing==='developer'||existing==='handoff')setInstallation(existing);
    }).catch(e=>{if(alive)setError(e instanceof Error?e.message:'Could not load project setup')});
    return()=>{alive=false};
  },[id]);

  const guide=useMemo(()=>guides[project?.platform || 'Website'] || guides.Website,[project?.platform]);
  if(error)return <div className="card onboarding-error"><h2>We couldn't load this project</h2><p>{error}</p><button className="btn outline" onClick={()=>location.reload()}>Try again</button></div>;
  if(!project || !status)return <div className="card onboarding-error" role="status">Loading project setup...</div>;

  const projectId=project.id;
  const code=`<script defer src="${API}/sdk/datatalk.js" data-project="${project.tracking_key}"></script>`;

  async function saveSetup(setupStep:string){
    try{
      setError('');
      await api(`/api/projects/${projectId}/tracking/setup`,{method:'PATCH',body:JSON.stringify({installation_type:installation,setup_step:setupStep})});
      setSaved(true);
    }catch(e){setError(e instanceof Error?e.message:'Could not save setup progress')}
  }

  async function verify(){
    setChecking(true);setError('');setSaved(false);
    try{
      const next=await api<Status>(`/api/projects/${projectId}/tracking/status`);
      setStatus(next);
      const setupStep=next.connected?'active':'installed';
      await api(`/api/projects/${projectId}/tracking/setup`,{method:'PATCH',body:JSON.stringify({installation_type:installation,setup_step:setupStep,first_event_at:next.first_event_at})});
    }catch(e){setError(e instanceof Error?e.message:'Could not check connection')}
    finally{setChecking(false)}
  }

  async function copy(text:string){
    try{await navigator.clipboard.writeText(text);setCopied(true)}catch{setError('Select the code below and copy it manually.')}
  }

  return <div className="onboarding">
    <div className="onboarding-header"><div><span className="eyebrow">PROJECT ACTIVATION</span><h1>Connect {project.name}</h1><p>Follow the simplest path for your platform, then verify the first real event.</p></div><div className="onboarding-progress"><span className="done"><Check size={14}/>Project</span><ChevronRight size={14}/><span className="active">2 Connect</span><ChevronRight size={14}/><span>3 Ready</span></div></div>
    <div className="onboarding-grid">
      <aside className="onboarding-side"><div className="setup-summary"><div className="platform-icon"><Globe2 size={21}/></div><strong>{project.platform}</strong><span>{project.domain || 'No domain provided'}</span></div><h3>Who will install DataTalk?</h3>
        <button className={`install-choice ${installation==='self'?'selected':''}`} onClick={()=>{setInstallation('self');setSaved(false)}}><UserRound size={18}/><span><b>I will install it</b><small>I can edit the website or app.</small></span></button>
        <button className={`install-choice ${installation==='developer'?'selected':''}`} onClick={()=>{setInstallation('developer');setSaved(false)}}><UsersRound size={18}/><span><b>I have a developer</b><small>Give them the technical checklist.</small></span></button>
        <button className={`install-choice ${installation==='handoff'?'selected':''}`} onClick={()=>{setInstallation('handoff');setSaved(false)}}><Mail size={18}/><span><b>Send instructions</b><small>Copy a ready-to-share handoff.</small></span></button>
        <div className="setup-help"><strong>Not technical?</strong><span>You do not need to understand the code. Follow the guide or share it with your developer.</span></div>
      </aside>
      <section className="onboarding-main">
        {error&&<div className="account-alert error" role="alert">{error}</div>}
        <div className="onboarding-card"><div className="onboarding-card-head"><div><span className="step-number">01</span><h2>{guide.title}</h2><p>{guide.description}</p></div></div>
          {installation==='self'&&<><div className="guide-steps">{guide.steps.map((text,index)=><div className="guide-step" key={text}><span>{index+1}</span><p>{text}</p></div>)}</div>{project.platform!=='Mobile App'&&<div className="code-block-wrap"><div className="code-block-head"><span>DataTalk tracking code</span><button onClick={()=>void copy(code)}><Copy size={15}/>{copied?'Copied':'Copy code'}</button></div><pre className="code code-block">{code}</pre><div className="tracking-key-row"><span>Project key</span><code>{project.tracking_key}</code></div></div>}</>}
          {installation==='developer'&&<div className="handoff-card"><h3>Developer checklist</h3><p>Send these requirements to your developer.</p><ol><li>Add the DataTalk script to the app shell.</li><li>Use this project key: <code>{project.tracking_key}</code></li><li>Publish a build and open the website once.</li></ol><button className="btn primary" onClick={()=>void copy(`DataTalk project: ${project.name}\nPlatform: ${project.platform}\nProject key: ${project.tracking_key}\nAdd: ${code}\nThen publish and open the site once.`)}><Copy size={15}/>Copy developer checklist</button></div>}
          {installation==='handoff'&&<div className="handoff-card"><h3>Ready-to-share instructions</h3><p>Copy this short brief and send it to whoever manages the website.</p><div className="share-copy">Please add DataTalk to <b>{project.name}</b>. Project key: <code>{project.tracking_key}</code>. Add the tracking script to the site head, publish it, then open the site once.</div><button className="btn primary" onClick={()=>void copy(`Please add DataTalk to ${project.name}. Project key: ${project.tracking_key}. Add the tracking script to the site head, publish it, then open the site once. Return to DataTalk and check the connection.`)}><Copy size={15}/>Copy instructions</button></div>}
          <div className="guide-tip"><strong>Good to know</strong><span>{guide.tip}</span></div>
        </div>
        <div className="verify-card"><div><span className="eyebrow">STEP 02</span><h2>Check your connection</h2><p>Publish the change, open your website, then come back here.</p></div><div className={`connection-result ${status.connected?'connected':'pending'}`}>{status.connected?<><Check size={20}/><div><strong>DataTalk is receiving data</strong><span>{status.event_count} events received</span></div></>:<><RefreshCw size={20}/><div><strong>Waiting for your first event</strong><span>We have not seen a real visit yet.</span></div></>}</div><div className="verify-actions"><button className="btn outline" onClick={()=>void saveSetup(status.connected?'verified':'installed')} disabled={saved}><Check size={15}/>{saved?'Saved':'Save setup progress'}</button><button className="btn primary" onClick={()=>void verify()} disabled={checking}>{checking?'Checking...':'Check connection'}<ArrowRight size={15}/></button>{status.connected&&<button className="btn primary" onClick={()=>{projectScope.select(projectId);router.push('/dashboard')}}>Open dashboard</button>}</div>{!status.connected&&<div className="verify-help">If it still does not connect, make sure the website is published and the script was added to the site head.</div>}</div>
      </section>
    </div>
  </div>;
}
