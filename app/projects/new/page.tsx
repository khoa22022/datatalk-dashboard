'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/AppShell';
import { supabase } from '../../../lib/supabase';
import { Check, ChevronLeft, ChevronRight, Copy, Globe2, Smartphone, ShieldCheck } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://datatalk-api-h4a1.onrender.com';
type Platform = 'Website' | 'Mobile App';

export default function NewProjectPage(){
  const router=useRouter();
  const [step,setStep]=useState(1); const [platform,setPlatform]=useState<Platform>('Website');
  const [name,setName]=useState(''); const [domain,setDomain]=useState('');
  const [businessGoal,setBusinessGoal]=useState('Understand user behavior'); const [project,setProject]=useState<any>(null);
  const [copied,setCopied]=useState(false); const [verifying,setVerifying]=useState(false); const [error,setError]=useState('');
  async function createProject(){
    setError(''); const session=await supabase?.auth.getSession(); const token=session?.data.session?.access_token;
    if(!token){router.push('/login');return;} if(!name.trim()){setError('Give your project a name first.');return;}
    const r=await fetch(`${API}/api/projects`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({name:name.trim(),domain:domain.trim(),platform,business_goal:businessGoal})});
    const data=await r.json(); if(!r.ok){setError(data?.error||'Could not create the project.');return;} setProject(data);setStep(2);
  }
  const code=project?`<script src="${API}/sdk/datatalk.js" data-project="${project.tracking_key}"></script>`:'';
  async function verify(){
    if(!project)return; setVerifying(true);setError('');
    try{const r=await fetch(`${API}/api/track/verify?tracking_key=${encodeURIComponent(project.tracking_key)}`);const data=await r.json();if(!r.ok||!data?.connected)throw new Error(data?.error||'Tracker endpoint is not ready.');setStep(3);}catch(e:any){setError(e?.message||'Verification failed.');}finally{setVerifying(false);}
  }
  return <AppShell title="Connect project"><div className="page-intro"><div><span className="eyebrow">NEW PROJECT</span><h1>Connect a product</h1><p>Set it up once. Datatalk takes care of the tracking layer behind the scenes.</p></div></div>
    <div className="setup-shell">
      <div className="setup-steps"><div className={`setup-step ${step>=1?'active':''}`}><span>01</span><div><strong>Project</strong><small>Tell us what you're tracking</small></div></div><div className={`setup-step ${step>=2?'active':''}`}><span>02</span><div><strong>Install</strong><small>Add the Datatalk tracker</small></div></div><div className={`setup-step ${step>=3?'active':''}`}><span>03</span><div><strong>Verify</strong><small>Make sure data can arrive</small></div></div></div>
      {step===1&&<section className="setup-card card"><div className="setup-heading"><div><span className="eyebrow">STEP 01</span><h2>What do you want to track?</h2><p>Start with a website or mobile product. You can add more sources later.</p></div></div>
        <div className="platform-grid"><button className={`platform-card ${platform==='Website'?'selected':''}`} onClick={()=>setPlatform('Website')}><Globe2 size={24}/><strong>Website</strong><span>Next.js, React, Figma Sites, HTML and more.</span></button><button className={`platform-card ${platform==='Mobile App'?'selected':''}`} onClick={()=>setPlatform('Mobile App')}><Smartphone size={24}/><strong>Mobile App</strong><span>React Native, Flutter, iOS or Android.</span></button></div>
        <div className="form-grid"><label>Project name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sweet Pea Website"/></label><label>{platform==='Website'?'Website URL':'App identifier'}<input value={domain} onChange={e=>setDomain(e.target.value)} placeholder={platform==='Website'?'https://example.com':'com.example.app'}/></label><label>Primary goal<select value={businessGoal} onChange={e=>setBusinessGoal(e.target.value)}><option>Understand user behavior</option><option>Improve conversion</option><option>Increase engagement</option><option>Improve onboarding</option><option>Reduce UX friction</option></select></label></div>
        {error&&<div className="setup-error">{error}</div>}<div className="setup-actions"><button className="secondary-button" onClick={()=>router.push('/projects')}><ChevronLeft size={16}/> Cancel</button><button className="primary-button" onClick={createProject}>Create project <ChevronRight size={16}/></button></div>
      </section>}
      {step===2&&project&&<section className="setup-card card"><div className="setup-heading"><div><span className="eyebrow">STEP 02 · INSTALL</span><h2>Add the tracker to {project.name}</h2><p>Copy this once. The tracker will start collecting page views, sessions, clicks and scroll behavior.</p></div><div className="tracker-status"><ShieldCheck size={16}/> Secure project key</div></div>
        <div className="code-panel"><div className="code-panel-head"><span>Website tracker</span><button className="copy-button" onClick={()=>{navigator.clipboard?.writeText(code);setCopied(true)}}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?'Copied':'Copy code'}</button></div><pre><code>{code}</code></pre></div>
        <div className="install-notes"><div><strong>Where does it go?</strong><span>Place it before the closing &lt;/body&gt; tag, or use your platform's custom code area.</span></div><div><strong>Project ID</strong><span>{project.tracking_key}</span></div></div>
        {error&&<div className="setup-error">{error}</div>}<div className="setup-actions"><button className="secondary-button" onClick={()=>setStep(1)}><ChevronLeft size={16}/> Back</button><button className="primary-button" onClick={verify} disabled={verifying}>{verifying?'Checking…':'Verify connection'} <ChevronRight size={16}/></button></div>
      </section>}
      {step===3&&project&&<section className="setup-card card success-setup"><div className="success-icon"><Check size={26}/></div><span className="eyebrow">TRACKING READY</span><h2>{project.name} is ready to collect data.</h2><p>Datatalk can now receive tracking events for this project. Once real traffic arrives, Analytics, Heatmaps and Sessions will begin to populate.</p><div className="verify-grid"><div><Check size={16}/> Project created</div><div><Check size={16}/> Tracker endpoint ready</div><div><Check size={16}/> Project key valid</div></div><div className="setup-actions"><button className="secondary-button" onClick={()=>router.push('/projects')}><ChevronLeft size={16}/> Back to projects</button><button className="primary-button" onClick={()=>router.push('/analytics')}>Open analytics <ChevronRight size={16}/></button></div></section>}
    </div></AppShell>
}
