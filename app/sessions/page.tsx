'use client';
import { useMemo, useState } from 'react';
import { LiveBoundary, useLiveResource, duration } from '@/components/v2/LiveData';
import AnalyticsFilters, { toIsoDate, type AnalyticsFilterValue } from '@/components/AnalyticsFilters';
import { useI18n } from '@/components/i18n';

type Step={id:string;event:string;at:string;elapsedMs:number;page:string;pageTitle?:string|null;element?:string|null;task?:string|null;step?:string|null;durationMs:number};
type Session={session_key:string;device?:string|null;browser?:string|null;os?:string|null;country?:string|null;city?:string|null;region?:string|null;timezone?:string|null;durationMs:number;eventCount:number;firstPage:string;lastPage:string;firstAction?:Step|null;lastAction?:Step|null;pages:string[];timeline:Step[]};
const initial:AnalyticsFilterValue={from:'',to:'',compare:'previous',page:'',device:''};
export default function Sessions(){
 const {lang,t}=useI18n();const vi=lang==='vi';const [filter,setFilter]=useState(initial);const [selected,setSelected]=useState<string>('');
 const query=useMemo(()=>{const q=new URLSearchParams();const f=toIsoDate(filter.from),to=toIsoDate(filter.to);if(f)q.set('from',f);if(to)q.set('to',to);if(filter.page)q.set('page',filter.page);if(filter.device)q.set('device',filter.device);return q.toString()},[filter]);
 const resource=useLiveResource<Session[]>('sessions-v2',query);const rows=resource.data||[];const current=rows.find(x=>x.session_key===selected)||rows[0]||null;
 return <LiveBoundary title={t('sessions')} {...resource} subtitle={vi?'Hành trình từ thao tác đầu tiên tới thao tác cuối cùng, kèm thời gian và khu vực truy cập.':'Full journey from first to last action with timing and coarse location.'}>
  <AnalyticsFilters value={filter} onChange={setFilter}/>
  <div className="session-layout">
   <section className="card session-list"><div className="card-header"><div><h2>{vi?'Danh sách phiên':'Session list'}</h2><p>{rows.length} {vi?'phiên trong khoảng lọc':'sessions in range'}</p></div></div>{rows.map(s=><button key={s.session_key} className={`session-list-item ${current?.session_key===s.session_key?'active':''}`} onClick={()=>setSelected(s.session_key)}><div><b>{s.device||'--'} · {s.browser||'--'}</b><small>{[s.city,s.country].filter(Boolean).join(', ')||'--'} · {duration(s.durationMs)}</small></div><span>{s.firstPage} → {s.lastPage}</span></button>)}</section>
   <section className="card session-detail">{current?<><div className="card-header"><div><h2>{vi?'Chi tiết hành trình':'Journey detail'}</h2><p>{current.device||'--'} · {current.browser||'--'} · {current.os||'--'} · {[current.city,current.region,current.country].filter(Boolean).join(', ')||'--'}</p></div></div>
    <div className="session-summary-grid"><div><span>{vi?'Trang bắt đầu':'Entry page'}</span><b>{current.firstPage||'--'}</b></div><div><span>{vi?'Trang cuối':'Exit page'}</span><b>{current.lastPage||'--'}</b></div><div><span>{vi?'Thao tác đầu':'First action'}</span><b>{current.firstAction?.event||'--'}</b></div><div><span>{vi?'Thao tác cuối':'Last action'}</span><b>{current.lastAction?.event||'--'}</b></div><div><span>{vi?'Thời lượng':'Duration'}</span><b>{duration(current.durationMs)}</b></div><div><span>{vi?'Số event':'Events'}</span><b>{current.eventCount}</b></div></div>
    <div className="journey-timeline">{current.timeline.length?current.timeline.map(step=><div className="journey-step" key={step.id}><div className="journey-time">+{duration(step.elapsedMs)}</div><i/><div><b>{step.event}</b><span>{step.page}{step.element?` · ${step.element}`:''}{step.task?` · ${step.task}`:''}</span><small>{step.durationMs?`${vi?'Thời gian bước':'Step time'}: ${duration(step.durationMs)}`:''}</small></div></div>):<p className="muted">--</p>}</div>
   </>:<div className="dashboard-empty-chart"><strong>--</strong><span>{vi?'Chưa có session.':'No sessions yet.'}</span></div>}</section>
  </div>
 </LiveBoundary>;
}
