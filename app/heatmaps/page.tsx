'use client';
import { useMemo, useState } from 'react';
import { LiveBoundary, useLiveResource, duration } from '@/components/v2/LiveData';
import AnalyticsFilters, { toIsoDate, type AnalyticsFilterValue } from '@/components/AnalyticsFilters';
import { useI18n } from '@/components/i18n';

type Point={id:string;page:string;event_type:string;x:number|null;y:number|null;viewport_width:number|null;viewport_height:number|null;element_text?:string|null;element_key?:string|null};
type ElementRow={key:string;page:string;label:string;clicks:number;rageClicks:number;deadClicks:number;confusionScore:number;signal:string};
type PageRow={pagePath:string;pageName?:string;pageTitle?:string;scrollMax:number};
type SectionRow={page:string;section:string;views:number;attentionMs:number;clicks:number;rageClicks:number;deadClicks:number};
type Data={pages:PageRow[];points:Point[];elements:ElementRow[];scroll:{page:string;scrollMax:number}[];sections:SectionRow[];issues:{key:string;type:string;page:string;element:string;occurrences:number}[]};
const initial:AnalyticsFilterValue={from:'',to:'',compare:'previous',page:'',device:''};
export default function Heatmaps(){
 const {lang,t}=useI18n();const vi=lang==='vi';const [filter,setFilter]=useState(initial);const [mode,setMode]=useState<'click'|'rage_click'|'dead_click'|'scroll'|'attention'>('click');
 const query=useMemo(()=>{const q=new URLSearchParams();const f=toIsoDate(filter.from),to=toIsoDate(filter.to);if(f)q.set('from',f);if(to)q.set('to',to);if(filter.page)q.set('page',filter.page);if(filter.device)q.set('device',filter.device);q.set('compare',filter.compare);return q.toString()},[filter]);
 const resource=useLiveResource<Data>('heatmaps-v2',query);const data=resource.data;
 const points=(data?.points||[]).filter(p=>mode==='click'?true:p.event_type===mode).filter(p=>p.x!=null&&p.y!=null&&p.viewport_width&&p.viewport_height).slice(0,300);
 const maxAttention=Math.max(1,...(data?.sections||[]).map(x=>x.attentionMs));
 return <LiveBoundary title={t('heatmaps')} {...resource} subtitle={vi?'Heatmap theo từng trang, nút nhấn, scroll, attention và tín hiệu gây nhầm lẫn.':'Page-level heatmaps for clicks, scroll, attention and confusion signals.'}>
  <AnalyticsFilters value={filter} onChange={setFilter} pages={data?.pages||[]}/>
  <div className="heatmap-mode-tabs">{([
   ['click',vi?'Click':'Clicks'],['attention','Attention'],['scroll',vi?'Cuộn trang':'Scroll'],['rage_click','Rage click'],['dead_click','Dead click']
  ] as const).map(([key,label])=><button key={key} className={mode===key?'active':''} onClick={()=>setMode(key)}>{label}</button>)}</div>
  <div className="grid grid2 heatmap-layout">
   <section className="card heatmap-canvas-card"><div className="card-header"><div><h2>{mode==='attention'?(vi?'Bản đồ Attention':'Attention map'):mode==='scroll'?(vi?'Độ sâu cuộn':'Scroll depth'):(vi?'Bản đồ tương tác':'Interaction heatmap')}</h2><p>{filter.page||(vi?'Tất cả trang':'All pages')}</p></div></div>
    {mode==='scroll'?<div className="scroll-heat-list">{(data?.scroll||[]).length?(data?.scroll||[]).map(row=><div className="scroll-heat-row" key={row.page}><div><b>{row.page}</b><span>{row.scrollMax?`${row.scrollMax}%`:'--'}</span></div><div className="scroll-track"><i style={{height:`${Math.max(0,Math.min(100,row.scrollMax||0))}%`}}/></div></div>):<Empty vi={vi} textVi="Chưa có dữ liệu scroll." textEn="No scroll data yet."/>}</div>
    :mode==='attention'?<div className="attention-heat-list">{(data?.sections||[]).length?(data?.sections||[]).map(row=><div className="attention-section-row" key={`${row.page}-${row.section}`}><div><b>{row.section}</b><small>{row.page}</small></div><div className="attention-section-bar"><i style={{width:`${Math.max(4,Math.round(row.attentionMs/maxAttention*100))}%`}}/></div><strong>{row.attentionMs?duration(row.attentionMs):'--'}</strong></div>):<Empty vi={vi} textVi="Chưa có section attention. Có thể đánh dấu section bằng data-datatalk-section." textEn="No section attention yet. Sections can be marked with data-datatalk-section."/>}</div>
    :<div className="heatmap-plot">{points.length?points.map(p=>{const x=Math.max(0,Math.min(100,(p.x!/(p.viewport_width||1))*100));const y=Math.max(0,Math.min(100,(p.y!/(p.viewport_height||1))*100));return <i key={p.id} className={`heat-dot ${p.event_type}`} style={{left:`${x}%`,top:`${y}%`}} title={`${p.element_text||p.event_type} · ${p.page}`}/>;}):<Empty vi={vi} textVi="Chưa có điểm tương tác trong bộ lọc này." textEn="No interaction points for this filter yet."/>}</div>}
   </section>
   <section className="card account-panel"><div className="card-header"><div><h2>{vi?'Xếp hạng nút / phần tử':'Button / element ranking'}</h2><p>{vi?'Nhận diện nút được dùng nhiều, ít và phần tử dễ gây nhầm lẫn.':'Identify high/low usage and confusing elements.'}</p></div></div><div className="element-ranking">{(data?.elements||[]).length?(data?.elements||[]).slice(0,16).map((e,i)=><div className="element-row" key={e.key}><div className="element-rank">{i+1}</div><div className="element-copy"><b>{e.label||'--'}</b><small>{e.page}</small></div><div className="element-metrics"><span>{e.clicks} {vi?'click':'clicks'}</span><span>{e.rageClicks} rage</span><span>{e.deadClicks} dead</span></div><span className={`pill ${e.confusionScore>2?'high':e.confusionScore>0?'medium':'good'}`}>{e.confusionScore>2?(vi?'Dễ gây nhầm':'Confusing'):e.confusionScore>0?(vi?'Cần xem':'Review'):(vi?'Ổn':'Healthy')}</span></div>):<Empty vi={vi} textVi="Chưa có dữ liệu phần tử." textEn="No element data yet."/>}</div></section>
  </div>
  <section className="card account-panel"><h2>{vi?'Vấn đề UX ghi nhận':'Observed UX issues'}</h2><div className="account-table-wrap"><table className="account-table"><thead><tr><th>{vi?'Loại':'Type'}</th><th>{vi?'Trang':'Page'}</th><th>{vi?'Phần tử':'Element'}</th><th>{vi?'Số lần':'Occurrences'}</th></tr></thead><tbody>{(data?.issues||[]).map(x=><tr key={x.key}><td>{x.type}</td><td>{x.page}</td><td>{x.element}</td><td>{x.occurrences}</td></tr>)}</tbody></table></div></section>
 </LiveBoundary>;
}
function Empty({vi,textVi,textEn}:{vi:boolean;textVi:string;textEn:string}){return <div className="dashboard-empty-chart"><strong>--</strong><span>{vi?textVi:textEn}</span></div>}
