'use client';
import { useMemo, useState } from 'react';
import { LiveBoundary, useLiveResource, duration } from '@/components/v2/LiveData';
import AnalyticsFilters, { toIsoDate, type AnalyticsFilterValue } from '@/components/AnalyticsFilters';
import { useI18n } from '@/components/i18n';
import { pageDisplayName, pageSecondaryText } from '@/lib/page-label';

type Step={id:string;event:string;at:string;elapsedMs:number;page:string;pageTitle?:string|null;pageName?:string|null;element?:string|null;task?:string|null;step?:string|null;durationMs:number};
type Session={session_key:string;device?:string|null;country?:string|null;city?:string|null;region?:string|null;timezone?:string|null;startedAt?:string;endedAt?:string;durationMs:number;eventCount:number;firstPage:string;firstPageName?:string|null;lastPage:string;lastPageName?:string|null;firstAction?:Step|null;lastAction?:Step|null;pages:string[];pageCount?:number;timeline:Step[]};
type PageRow={pagePath:string;pageName?:string|null;pageTitle?:string|null;pageUrl?:string|null};
type DeviceRow={name:string;count:number};
type Data={sessions:Session[];pages:PageRow[];devices:DeviceRow[]};
const initial:AnalyticsFilterValue={from:'',to:'',compare:'previous',page:'',device:''};
export default function Sessions(){
 const {lang,t}=useI18n();const vi=lang==='vi';const [filter,setFilter]=useState(initial);const [selected,setSelected]=useState<string>('');
 const query=useMemo(()=>{const q=new URLSearchParams();const f=toIsoDate(filter.from),to=toIsoDate(filter.to);if(f)q.set('from',f);if(to)q.set('to',to);if(filter.page)q.set('page',filter.page);if(filter.device)q.set('device',filter.device);return q.toString()},[filter]);
 const resource=useLiveResource<Data>('sessions-v2',query);const rows=resource.data?.sessions||[];const current=rows.find(x=>x.session_key===selected)||rows[0]||null;
 const deviceLabel=(v?:string|null)=>v==='mobile'?(vi?'Điện thoại':'Mobile'):v==='tablet'?(vi?'Máy tính bảng':'Tablet'):v==='desktop'?(vi?'Máy tính':'Desktop'):(vi?'Chưa xác định thiết bị':'Unknown device');
 const unknown=(what:string)=>vi?`Chưa xác định ${what}`:`Unknown ${what}`;
 const sessionTime=(value?:string)=>value?new Date(value).toLocaleString(vi?'vi-VN':'en-US',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):(vi?'Chưa ghi nhận thời gian':'Time unavailable');
 return <LiveBoundary title={t('sessions')} {...resource} subtitle={vi?'Hành trình từ thao tác đầu tiên tới thao tác cuối cùng, kèm thời gian, trang và khu vực truy cập.':'Full journey from first to last action with page, timing and coarse location context.'}>
  <AnalyticsFilters value={filter} onChange={setFilter} pages={resource.data?.pages||[]} deviceCounts={resource.data?.devices||[]}/>
  <div className="session-layout">
   <section className="card session-list"><div className="card-header"><div><h2>{vi?'Danh sách phiên':'Session list'}</h2><p>{rows.length} {vi?'phiên trong khoảng lọc':'sessions in range'}</p></div></div>{rows.length?rows.map(s=>{
    const location=[s.city,s.region,s.country].filter(Boolean).join(', ')||unknown(vi?'khu vực':'location');const entry=pageDisplayName({pagePath:s.firstPage,pageName:s.firstPageName},lang),exit=pageDisplayName({pagePath:s.lastPage,pageName:s.lastPageName},lang);
    return <button key={s.session_key} className={`session-list-item ${current?.session_key===s.session_key?'active':''}`} onClick={()=>setSelected(s.session_key)}><div><b>{deviceLabel(s.device)} · {sessionTime(s.startedAt)}</b><small>{location}</small></div><span className="session-route">{entry} → {exit}</span><small>{duration(s.durationMs)} · {s.pageCount??s.pages.length} {vi?'trang':'pages'} · {s.eventCount} {vi?'sự kiện':'events'}</small></button>}) : <p className="muted">{vi?'Chưa có phiên trong bộ lọc này.':'No sessions in this filter.'}</p>}</section>
   <section className="card session-detail">{current?<><div className="card-header"><div><h2>{vi?'Chi tiết hành trình':'Journey detail'}</h2><p>{deviceLabel(current.device)} · {sessionTime(current.startedAt)} · {[current.city,current.region,current.country].filter(Boolean).join(', ')||unknown(vi?'khu vực':'location')}</p></div></div>
    <div className="session-summary-grid"><Summary label={vi?'Trang bắt đầu':'Entry page'} value={pageDisplayName({pagePath:current.firstPage,pageName:current.firstPageName},lang)} sub={pageSecondaryText(current.firstPage)}/><Summary label={vi?'Trang cuối':'Exit page'} value={pageDisplayName({pagePath:current.lastPage,pageName:current.lastPageName},lang)} sub={pageSecondaryText(current.lastPage)}/><Summary label={vi?'Thao tác đầu':'First action'} value={current.firstAction?eventLabel(current.firstAction.event,vi):(vi?'Chưa ghi nhận thao tác':'No action recorded')}/><Summary label={vi?'Thao tác cuối':'Last action'} value={current.lastAction?eventLabel(current.lastAction.event,vi):(vi?'Chưa ghi nhận thao tác':'No action recorded')}/><Summary label={vi?'Thời lượng':'Duration'} value={current.durationMs>0?duration(current.durationMs):(vi?'Chưa đủ dữ liệu':'Not enough data')}/><Summary label={vi?'Số sự kiện':'Events'} value={String(current.eventCount)}/></div>
    <div className="journey-timeline">{current.timeline.length?current.timeline.map(step=><div className="journey-step" key={step.id}><div className="journey-time">+{duration(step.elapsedMs)}</div><i/><div><b>{eventLabel(step.event,vi)}</b><span>{pageDisplayName({pagePath:step.page,pageName:step.pageName,pageTitle:step.pageTitle},lang)} · {step.page}{step.element?` · ${step.element}`:''}{step.task?` · ${vi?'Tác vụ':'Task'}: ${step.task}`:''}</span><small>{step.durationMs>0?`${vi?'Thời gian bước':'Step time'}: ${duration(step.durationMs)}`:(vi?'Không có thời lượng riêng cho sự kiện này':'No separate duration for this event')}</small></div></div>):<p className="muted">{vi?'Chưa có sự kiện hành trình.':'No journey events yet.'}</p>}</div>
   </>:<div className="dashboard-empty-chart"><strong>--</strong><span>{vi?'Chưa có phiên truy cập.':'No sessions yet.'}</span></div>}</section>
  </div>
 </LiveBoundary>;
}
function Summary({label,value,sub}:{label:string;value:string;sub?:string}){return <div><span>{label}</span><b>{value}</b>{sub&&<small className="session-summary-sub">{sub}</small>}</div>}
function eventLabel(event:string,vi:boolean){const map:Record<string,[string,string]>={page_view:['Xem trang','Page view'],click:['Nhấn phần tử','Click'],rage_click:['Click liên tục','Rage click'],dead_click:['Click không phản hồi','Dead click'],task_start:['Bắt đầu tác vụ','Task start'],task_step:['Bước tác vụ','Task step'],task_complete:['Hoàn thành tác vụ','Task complete'],task_error:['Lỗi tác vụ','Task error'],task_fail:['Tác vụ thất bại','Task failed'],task_abandon:['Bỏ dở tác vụ','Task abandoned'],feedback_submit:['Gửi phản hồi','Feedback submitted']};return map[event]?.[vi?0:1]||event.replaceAll('_',' ')}
