'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, API } from '@/lib/api';
import { Check, ChevronRight, Copy, Globe2, ArrowRight, Mail, RefreshCw, UserRound, UsersRound } from 'lucide-react';

type Project = { id:string; name:string; domain:string; platform:string; tracking_key:string };
type Status = { connected:boolean; event_count:number; first_event_at:string|null; last_event:any; setup:any };
const guides:Record<string,{title:string;description:string;steps:string[];tip:string}> = {
  Website:{title:'Website',description:'Add one small script to your published website. No app changes are required.',steps:['Copy the DataTalk code below.','Paste it before the closing </head> tag.','Publish your website.','Return here and check the connection.'],tip:'If you use a website builder, choose the matching guide below.'},
  'Web App':{title:'React / Next.js',description:'For a web app, your developer can add the DataTalk SDK once at the app shell.',steps:['Add the DataTalk script to the root layout or document head.','Publish the latest build.','Open the app and visit one page.','Return here and check the connection.'],tip:'Use the developer handoff if you prefer to send this setup to your developer.'},
  'Mobile App':{title:'Mobile app',description:'Mobile SDK support is planned. For this release, keep the project ready and contact your developer.',steps:['Keep the project created.','Share the project key with your developer.','Native SDK setup will be enabled in a later release.'],tip:'Do not paste the web script into a native mobile app.'},
  'Figma Site':{title:'Figma Site',description:'For a published Figma Site, use its custom code area to add the DataTalk script.',steps:['Open your published Figma Site settings.','Add the script to the custom code / head area.','Publish the site.','Return here and check the connection.'],tip:'For a design-only Figma prototype that is not published, tracking cannot receive real website events yet.'}
};

export default function Connect(){
  const {id}=useParams<{id:string}>();
  const [project,setProject]=useState<Project|null>(null); const [status,setStatus]=useState<Status|null>(null);
  const [err,setErr]=useState(''); const [copied,setCopied]=useState(false); const [checking,setChecking]=useState(false); const [saved,setSaved]=useState(false);
  const [installation,setInstallation]=useState<'self'|'developer'|'handoff'>('self');
  useEffect(()=>{Promise.all([api<Project>(`/api/projects/${id}`),api<Status>(`/api/projects/${id}/tracking/status`)]).then(([p,s])=>{setProject(p);setStatus(s);}).catch(e=>setErr(e.message));},[id]);
  const guide=useMemo(()=>guides[project?.platform || 'Website'],[project?.platform]);
  if(err)return <div className="card onboarding-error"><h2>We couldn't load this project</h2><p>{err}</p></div>;
  if(!project || !status)return <div className="card">Loading project setup…</div>;
  const code=`<script defer src="${API}/sdk/datatalk.js" data-project="${project.tracking_key}"></script>`;
  async function saveSetup(setupStep:string){try{await api(`/api/projects/${project.id}/tracking/setup`,{method:'PATCH',body:JSON.stringify({installation_type:installation,setup_step:setupStep})});setSaved(true);}catch(e:any){setErr(e.message);}}
  async function verify(){
    setChecking(true); setErr(''); setSaved(false);
    try {
      const next:any = await api(`/api/projects/${project.id}/tracking/status`);
      setStatus(next);
      const setupStep = next.connected ? 'active' : 'installed';
      await api(`/api/projects/${project.id}/tracking/setup`, { method:'PATCH', body:JSON.stringify({installation_type:installation, setup_step:setupStep, first_event_at:next.first_event_at}) });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not check connection');
    } finally {
      setChecking(false);
    }
  }
  const copy=(text:string)=>navigator.clipboard?.writeText(text);
  return <div className="onboarding">
    <div className="onboarding-header"><div><span className="eyebrow">PROJECT ACTIVATION</span><h1>Connect {project.name}</h1><p>Follow the simplest path for your platform, then verify the first real event.</p></div><div className="onboarding-progress"><span className="done"><Check size={14}/>Project</span><ChevronRight size={14}/><span className="active">2 Connect</span><ChevronRight size={14}/><span>3 Ready</span></div></div>
    <div className="onboarding-grid">
      <aside className="onboarding-side"><div className="setup-summary"><div className="platform-icon"><Globe2 size={21}/></div><strong>{project.platform}</strong><span>{project.domain}</span></div><h3>Who will install DataTalk?</h3>
        <button className={`install-choice ${installation==='self'?'selected':''}`} onClick={()=>setInstallation('self')}><UserRound size={18}/><span><b>I will install it</b><small>I can edit the website or app.</small></span></button>
        <button className={`install-choice ${installation==='developer'?'selected':''}`} onClick={()=>setInstallation('developer')}><UsersRound size={18}/><span><b>I have a developer</b><small>Give them the technical checklist.</small></span></button>
        <button className={`install-choice ${installation==='handoff'?'selected':''}`} onClick={()=>setInstallation('handoff')}><Mail size={18}/><span><b>Send instructions</b><small>Copy a ready-to-share handoff.</small></span></button>
        <div className="setup-help"><strong>Not technical?</strong><span>You do not need to understand the code. Follow the guide or share it with your developer.</span></div>
      </aside>
      <section className="onboarding-main">
        <div className="onboarding-card"><div className="onboarding-card-head"><div><span className="step-number">01</span><h2>{guide.title}</h2><p>{guide.description}</p></div></div>
          {installation==='self' && <><div className="guide-steps">{guide.steps.map((text,index)=><div className="guide-step" key={text}><span>{index+1}</span><p>{text}</p></div>)}</div>{project.platform!=='Mobile App' && <div className="code-block-wrap"><div className="code-block-head"><span>DataTalk tracking code</span><button onClick={()=>{copy(code);setCopied(true)}}><Copy size={15}/>{copied?'Copied':'Copy code'}</button></div><pre className="code code-block">{code}</pre><div className="tracking-key-row"><span>Project key</span><code>{project.tracking_key}</code></div></div>}</>}
          {installation==='developer' && <div className="handoff-card"><h3>Developer checklist</h3><p>Send these requirements to your developer.</p><ol><li>Add the DataTalk script to the app shell.</li><li>Use this project key: <code>{project.tracking_key}</code></li><li>Publish a build and open the website once.</li></ol><button className="btn primary" onClick={()=>copy(`DataTalk project: ${project.name}\nPlatform: ${project.platform}\nProject key: ${project.tracking_key}\nAdd: ${code}\nThen publish and open the site once.`)}><Copy size={15}/>Copy developer checklist</button></div>}
          {installation==='handoff' && <div className="handoff-card"><h3>Ready-to-share instructions</h3><p>Copy this short brief and send it to whoever manages the website.</p><div className="share-copy">Please add DataTalk to <b>{project.name}</b>. Project key: <code>{project.tracking_key}</code>. Add the tracking script to the site head, publish it, then open the site once. Return to DataTalk and check the connection.</div><button className="btn primary" onClick={()=>copy(`Please add DataTalk to ${project.name}. Project key: ${project.tracking_key}. Add the tracking script to the site head, publish it, then open the site once. Return to DataTalk and check the connection.`)}><Copy size={15}/>Copy instructions</button></div>}
          <div className="guide-tip"><strong>Good to know</strong><span>{guide.tip}</span></div>
        </div>
        <div className="verify-card"><div><span className="eyebrow">STEP 02</span><h2>Check your connection</h2><p>Publish the change, open your website, then come back here.</p></div><div className={`connection-result ${status.connected?'connected':'pending'}`}>{status.connected?<><Check size={20}/><div><strong>DataTalk is receiving data</strong><span>{status.event_count} events received</span></div></>:<><RefreshCw size={20}/><div><strong>Waiting for your first event</strong><span>We have not seen a real visit yet.</span></div></>}</div><div className="verify-actions"><button className="btn outline" onClick={()=>saveSetup(status.connected?'verified':'installed')} disabled={saved}><Check size={15}/>{saved?'Saved':'Save setup progress'}</button><button className="btn primary" onClick={verify} disabled={checking}>{checking?'Checking…':'Check connection'}<ArrowRight size={15}/></button></div>{!status.connected&&<div className="verify-help">If it still does not connect, make sure the website is published and the script was added to the site head.</div>}</div>
      </section>
    </div>
  </div>;
}
