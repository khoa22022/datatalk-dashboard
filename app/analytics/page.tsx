'use client';
import { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { LiveBoundary, useLiveResource, duration } from '@/components/v2/LiveData';
import AnalyticsFilters, { toIsoDate, type AnalyticsFilterValue } from '@/components/AnalyticsFilters';
import { useI18n } from '@/components/i18n';
import { pageDisplayName, pageSecondaryText } from '@/lib/page-label';

type PageRow={pagePath:string;pageName?:string|null;pageTitle?:string|null;pageUrl?:string|null;views:number;users:number;activeTimeMs:number;avgAttentionMs:number|null;avgDwellMs:number|null;rageClicks:number;deadClicks:number;scrollMax:number};
type Data={overview:{visitors:number;sessions:number;pageViews:number;activeTimeMs:number;avgAttentionMs:number|null;avgDwellMs:number|null;bounceRate:number|null};comparison:Record<string,number|null>;pages:PageRow[];pageCatalog?:PageRow[];trend:{date:string;visitors:number;pageViews:number;activeTimeMs:number}[]};
const baseFilter:AnalyticsFilterValue={from:'',to:'',compare:'previous',page:'',device:''};
export default function Analytics(){
 const {lang,t}=useI18n(); const vi=lang==='vi'; const [filter,setFilter]=useState(baseFilter);
 const query=useMemo(()=>{const q=new URLSearchParams();const from=toIsoDate(filter.from),to=toIsoDate(filter.to);if(from)q.set('from',from);if(to)q.set('to',to);q.set('compare',filter.compare);if(filter.page)q.set('page',filter.page);if(filter.device)q.set('device',filter.device);return q.toString()},[filter]);
 const resource=useLiveResource<Data>('analytics-v2',query); const data=resource.data;
 const cards=[[vi?'Người dùng hoạt động':'Active users',data?.overview.visitors],[vi?'Lượt xem trang':'Page views',data?.overview.pageViews],[vi?'Thời gian chú ý TB':'Avg. attention',data?.overview.avgAttentionMs==null?'--':duration(data.overview.avgAttentionMs)],[vi?'Thời gian ở lại TB':'Avg. dwell time',data?.overview.avgDwellMs==null?'--':duration(data.overview.avgDwellMs)],[vi?'Tỷ lệ thoát':'Bounce rate',data?.overview.bounceRate==null?'--':`${data.overview.bounceRate}%`]];
 const chartPages=(data?.pages||[]).slice(0,8).map(p=>({...p,label:pageDisplayName(p,lang)}));
 return <LiveBoundary title={t('analytics')} {...resource} subtitle={vi?'Lưu lượng, mức chú ý và hiệu quả theo dữ liệu thật của từng trang.':'Real traffic, attention and efficiency by page.'}>
   <AnalyticsFilters value={filter} onChange={setFilter} pages={data?.pageCatalog||data?.pages||[]}/>
   <div className="analytics-kpi-grid">{cards.map(([label,value])=><div className="card analytics-kpi" key={String(label)}><span>{label}</span><strong>{value??'--'}</strong></div>)}</div>
   <div className="grid grid2 analytics-main-grid">
    <section className="card chart-card"><div className="card-header"><div><h2>{vi?'Người dùng hoạt động & mức chú ý':'Active users & attention'}</h2><p>{vi?'Theo ngày trong khoảng thời gian đã chọn.':'Daily values for the selected period.'}</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.trend||[]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis/><Tooltip/><Line type="monotone" dataKey="visitors" name={vi?'Người dùng':'Users'} stroke="#696cff" strokeWidth={2}/><Line type="monotone" dataKey="activeTimeMs" name={vi?'Thời gian hoạt động (ms)':'Active time (ms)'} stroke="#03c3ec" strokeWidth={2}/></LineChart></ResponsiveContainer></div></section>
    <section className="card chart-card"><div className="card-header"><div><h2>{vi?'Phân bổ mức chú ý theo trang':'Attention distribution by page'}</h2><p>{vi?'Xếp hạng theo thời gian hoạt động thực tế.':'Ranked by real active time.'}</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartPages} layout="vertical"><CartesianGrid horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="label" width={130}/><Tooltip formatter={(v)=>[duration(Number(v)),vi?'Thời gian hoạt động':'Active time']}/><Bar dataKey="activeTimeMs" fill="#696cff" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></section>
   </div>
   <section className="card account-panel"><div className="card-header"><div><h2>{vi?'Dữ liệu theo trang':'Page analytics'}</h2><p>{vi?'Tìm và lọc trang ở bộ lọc phía trên.':'Search/filter pages using the controls above.'}</p></div></div><div className="account-table-wrap"><table className="account-table"><thead><tr><th>{vi?'Trang':'Page'}</th><th>{vi?'Đường dẫn':'Path'}</th><th>{vi?'Lượt xem':'Views'}</th><th>{vi?'Người dùng':'Users'}</th><th>{vi?'Mức chú ý':'Attention'}</th><th>{vi?'Thời gian ở lại':'Dwell'}</th><th>{vi?'Click liên tục':'Rage'}</th><th>{vi?'Click không phản hồi':'Dead'}</th><th>{vi?'Độ sâu cuộn':'Scroll'}</th></tr></thead><tbody>{(data?.pages||[]).map(p=><tr key={p.pagePath}><td><b>{pageDisplayName(p,lang)}</b></td><td><code>{pageSecondaryText(p)}</code></td><td>{p.views}</td><td>{p.users}</td><td>{p.avgAttentionMs?duration(p.avgAttentionMs):'--'}</td><td>{p.avgDwellMs?duration(p.avgDwellMs):'--'}</td><td>{p.rageClicks}</td><td>{p.deadClicks}</td><td>{p.scrollMax?`${p.scrollMax}%`:'--'}</td></tr>)}</tbody></table></div></section>
 </LiveBoundary>
}
