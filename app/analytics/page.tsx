'use client';
import { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { LiveBoundary, useLiveResource, duration } from '@/components/v2/LiveData';
import AnalyticsFilters, { todayText, toIsoDate, type AnalyticsFilterValue } from '@/components/AnalyticsFilters';
import { useI18n } from '@/components/i18n';

type PageRow={pagePath:string;pageName?:string;pageTitle?:string;views:number;users:number;activeTimeMs:number;avgAttentionMs:number|null;avgDwellMs:number|null;rageClicks:number;deadClicks:number;scrollMax:number};
type Data={overview:{visitors:number;sessions:number;pageViews:number;activeTimeMs:number;avgAttentionMs:number|null;avgDwellMs:number|null;bounceRate:number|null};comparison:Record<string,number|null>;pages:PageRow[];trend:{date:string;visitors:number;pageViews:number;activeTimeMs:number}[]};
const baseFilter:AnalyticsFilterValue={from:'',to:'',compare:'previous',page:'',device:''};
export default function Analytics(){
 const {lang,t}=useI18n(); const vi=lang==='vi'; const [filter,setFilter]=useState(baseFilter);
 const query=useMemo(()=>{const q=new URLSearchParams();const from=toIsoDate(filter.from),to=toIsoDate(filter.to);if(from)q.set('from',from);if(to)q.set('to',to);q.set('compare',filter.compare);if(filter.page)q.set('page',filter.page);if(filter.device)q.set('device',filter.device);return q.toString()},[filter]);
 const resource=useLiveResource<Data>('analytics-v2',query); const data=resource.data;
 const cards=[
  [vi?'Người dùng hoạt động':'Active users',data?.overview.visitors],
  [vi?'Lượt xem trang':'Page views',data?.overview.pageViews],
  [vi?'Thời gian chú ý TB':'Avg. attention',data?.overview.avgAttentionMs==null?'--':duration(data.overview.avgAttentionMs)],
  [vi?'Dwell time TB':'Avg. dwell time',data?.overview.avgDwellMs==null?'--':duration(data.overview.avgDwellMs)],
  [vi?'Tỷ lệ thoát':'Bounce rate',data?.overview.bounceRate==null?'--':`${data.overview.bounceRate}%`]
 ];
 return <LiveBoundary title={t('analytics')} {...resource} subtitle={vi?'Traffic, attention và hiệu quả theo dữ liệu thật của từng trang.':'Real traffic, attention and efficiency by page.'}>
   <AnalyticsFilters value={filter} onChange={setFilter} pages={data?.pages||[]}/>
   <div className="analytics-kpi-grid">{cards.map(([label,value])=><div className="card analytics-kpi" key={String(label)}><span>{label}</span><strong>{value??'--'}</strong></div>)}</div>
   <div className="grid grid2 analytics-main-grid">
    <section className="card chart-card"><div className="card-header"><div><h2>{vi?'Người dùng hoạt động & Attention':'Active users & attention'}</h2><p>{vi?'Theo ngày trong khoảng thời gian đã chọn.':'Daily values for the selected period.'}</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.trend||[]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis/><Tooltip/><Line type="monotone" dataKey="visitors" name={vi?'Người dùng':'Users'} stroke="#696cff" strokeWidth={2}/><Line type="monotone" dataKey="activeTimeMs" name={vi?'Attention (ms)':'Attention (ms)'} stroke="#03c3ec" strokeWidth={2}/></LineChart></ResponsiveContainer></div></section>
    <section className="card chart-card"><div className="card-header"><div><h2>{vi?'Phân bổ Attention theo trang':'Attention distribution by page'}</h2><p>{vi?'Xếp hạng theo active time thật.':'Ranked by real active time.'}</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={(data?.pages||[]).slice(0,8)} layout="vertical"><CartesianGrid horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="pageName" width={110}/><Tooltip/><Bar dataKey="activeTimeMs" fill="#696cff" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></section>
   </div>
   <section className="card account-panel"><div className="card-header"><div><h2>{vi?'Dữ liệu theo trang':'Page analytics'}</h2><p>{vi?'Tìm và lọc trang ở bộ lọc phía trên.':'Search/filter pages using the controls above.'}</p></div></div><div className="account-table-wrap"><table className="account-table"><thead><tr><th>{vi?'Trang':'Page'}</th><th>Path</th><th>{vi?'Lượt xem':'Views'}</th><th>{vi?'Người dùng':'Users'}</th><th>Attention</th><th>Dwell</th><th>Rage</th><th>Dead</th><th>Scroll</th></tr></thead><tbody>{(data?.pages||[]).map(p=><tr key={p.pagePath}><td><b>{p.pageName||p.pageTitle||p.pagePath}</b></td><td><code>{p.pagePath}</code></td><td>{p.views}</td><td>{p.users}</td><td>{p.avgAttentionMs?duration(p.avgAttentionMs):'--'}</td><td>{p.avgDwellMs?duration(p.avgDwellMs):'--'}</td><td>{p.rageClicks}</td><td>{p.deadClicks}</td><td>{p.scrollMax?`${p.scrollMax}%`:'--'}</td></tr>)}</tbody></table></div></section>
 </LiveBoundary>
}
