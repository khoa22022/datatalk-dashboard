'use client';
import {useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {api} from '@/lib/api';
import {useI18n} from '@/components/i18n';
import {Globe2,LayoutGrid,Smartphone,PenTool,ArrowLeft,ArrowRight,Check,Target,MousePointerClick,Search,Repeat2} from 'lucide-react';

const platformOptions=[
  {id:'Website',key:'website',desc:'websiteDesc',Icon:Globe2},
  {id:'Web App',key:'webApp',desc:'webAppDesc',Icon:LayoutGrid},
  {id:'Mobile App',key:'mobileApp',desc:'mobileAppDesc',Icon:Smartphone},
  {id:'Figma Site',key:'figmaSite',desc:'figmaSiteDesc',Icon:PenTool},
] as const;
const goalOptions=[
  {id:'UX Improvement',key:'goalUx',Icon:Target},
  {id:'Conversion',key:'goalConversion',Icon:MousePointerClick},
  {id:'Product Research',key:'goalResearch',Icon:Search},
  {id:'Retention',key:'goalRetention',Icon:Repeat2},
] as const;

export default function NewProject(){
  const r=useRouter(); const {t}=useI18n();
  const[step,setStep]=useState(1); const[name,setName]=useState(''); const[domain,setDomain]=useState('');
  const[platform,setPlatform]=useState('Website'); const[goal,setGoal]=useState('UX Improvement');
  const[busy,setBusy]=useState(false); const[err,setErr]=useState('');
  const selected=useMemo(()=>platformOptions.find(x=>x.id===platform)!,[platform]);

  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setErr('');try{
    const p:any=await api('/api/projects',{method:'POST',body:JSON.stringify({name,domain,platform,business_goal:goal})});
    r.push(`/projects/${p.id}/connect`);
  }catch(e:any){setErr(e.message||t('couldNotCreateProject'))}finally{setBusy(false)}}

  return <div className="project-wizard">
    <div className="wizard-header">
      <div><div className="eyebrow">{t('projectSetup')}</div><h1>{t('createNewProject')}</h1><p>{t('createProjectSubtitle')}</p></div>
      <div className="wizard-steps" aria-label="Setup progress">
        {[1,2,3].map((n)=><div key={n} className={`wizard-step ${step===n?'active':''} ${step>n?'done':''}`}><span>{step>n?<Check size={14}/>:n}</span><b>{t(n===1?'choosePlatform':n===2?'projectDetails':'installTracking')}</b></div>)}
      </div>
    </div>

    <div className="wizard-layout">
      <aside className="wizard-guide">
        <div className="wizard-guide-icon"><selected.Icon size={22}/></div>
        <h2>{t('easySetup')}</h2><p>{t('easySetupText')}</p>
        <ul><li><Check size={15}/>{t('noCodeRequired')}</li><li><Check size={15}/>{t('guidedInstallation')}</li><li><Check size={15}/>{t('verifyBeforeFinish')}</li></ul>
        <div className="wizard-help">{t('needHelp')} <strong>{t('setupAssistant')}</strong></div>
      </aside>

      <section className="wizard-card">
        {step===1 && <div className="wizard-panel"><div className="wizard-panel-head"><span>01</span><div><h2>{t('whatTrack')}</h2><p>{t('whatTrackSubtitle')}</p></div></div>
          <div className="platform-grid">{platformOptions.map(({id,key,desc,Icon})=><button type="button" key={id} onClick={()=>setPlatform(id)} className={`platform-card ${platform===id?'selected':''}`}><div className="platform-icon"><Icon size={22}/></div><div><strong>{t(key)}</strong><span>{t(desc)}</span></div>{platform===id&&<i><Check size={13}/></i>}</button>)}</div>
          <div className="wizard-actions"><span></span><button className="btn primary btn-lg" type="button" onClick={()=>setStep(2)}>{t('continue')}<ArrowRight size={16}/></button></div>
        </div>}

        {step===2 && <form onSubmit={submit} className="wizard-panel"><div className="wizard-panel-head"><span>02</span><div><h2>{t('projectDetails')}</h2><p>{t('projectDetailsSubtitle')}</p></div></div>
          <div className="form-grid">
            <div className="field"><label>{t('projectName')}</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Sweet Pea Website"/><small>{t('projectNameHint')}</small></div>
            <div className="field"><label>{t('websiteUrl')}</label><input required value={domain} onChange={e=>setDomain(e.target.value)} placeholder="https://example.com"/><small>{t('websiteUrlHint')}</small></div>
          </div>
          <div className="field"><label>{t('businessGoal')}</label><div className="goal-grid">{goalOptions.map(({id,key,Icon})=><button type="button" key={id} onClick={()=>setGoal(id)} className={`goal-card ${goal===id?'selected':''}`}><Icon size={17}/><span>{t(key)}</span>{goal===id&&<Check size={14}/>}</button>)}</div></div>
          <div className="selection-summary"><div><small>{t('platform')}</small><strong>{t(selected.key)}</strong></div><div><small>{t('businessGoal')}</small><strong>{t(goalOptions.find(x=>x.id===goal)?.key||'goalUx')}</strong></div></div>
          {err&&<div className="error wizard-error">{err}</div>}
          <div className="wizard-actions"><button className="btn outline btn-lg" type="button" onClick={()=>setStep(1)}><ArrowLeft size={16}/>{t('back')}</button><button className="btn primary btn-lg" disabled={busy}>{busy?t('creatingProject'):t('createProject')}<ArrowRight size={16}/></button></div>
        </form>}
      </section>
    </div>
  </div>;
}
