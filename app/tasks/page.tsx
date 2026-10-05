'use client';
import { useMemo, useState } from 'react';
import { LiveBoundary, useLiveResource, duration } from '@/components/v2/LiveData';
import AnalyticsFilters, { toIsoDate, type AnalyticsFilterValue } from '@/components/AnalyticsFilters';
import { useI18n } from '@/components/i18n';

type Step={step:string;count:number;durationMs:number;errors:number;dropoffs:number};
type Task={task:string;starts:number;completes:number;fails:number;abandons:number;errors:number;backtracks:number;retries:number;users:number;sessions:number;successRate:number|null;dropoffRate:number|null;medianCompletionTimeMs:number|null;steps:Step[]};
const initial:AnalyticsFilterValue={from:'',to:'',compare:'previous',page:'',device:''};
export default function Tasks(){
 const {lang,t}=useI18n();const vi=lang==='vi';const [filter,setFilter]=useState(initial);
 const query=useMemo(()=>{const q=new URLSearchParams();const f=toIsoDate(filter.from),to=toIsoDate(filter.to);if(f)q.set('from',f);if(to)q.set('to',to);if(filter.page)q.set('page',filter.page);if(filter.device)q.set('device',filter.device);return q.toString()},[filter]);
 const resource=useLiveResource<Task[]>('tasks-v2',query);const rows=resource.data||[];
 return <LiveBoundary title={t('tasks')} {...resource} subtitle={vi?'Đo tốc độ, tỷ lệ hoàn thành, rớt bước, retry và friction của từng tác vụ thật.':'Measure real task speed, completion, drop-off, retries and friction.'}>
  <AnalyticsFilters value={filter} onChange={setFilter}/>
  {rows.length?<div className="task-grid">{rows.map(task=><section className="card task-card-v22" key={task.task}><div className="card-header"><div><h2>{task.task}</h2><p>{task.users} {vi?'người dùng':'users'} · {task.sessions} {vi?'phiên':'sessions'}</p></div><span className={`pill ${(task.successRate||0)>=80?'good':(task.successRate||0)>=60?'medium':'high'}`}>{task.successRate==null?'--':`${task.successRate}%`}</span></div>
   <div className="task-metrics"><div><span>{vi?'Bắt đầu':'Started'}</span><b>{task.starts}</b></div><div><span>{vi?'Hoàn thành':'Completed'}</span><b>{task.completes}</b></div><div><span>{vi?'Bỏ dở':'Abandoned'}</span><b>{task.abandons}</b></div><div><span>{vi?'Thất bại':'Failed'}</span><b>{task.fails}</b></div><div><span>{vi?'Retry':'Retries'}</span><b>{task.retries}</b></div><div><span>{vi?'Trung vị thời gian':'Median time'}</span><b>{task.medianCompletionTimeMs==null?'--':duration(task.medianCompletionTimeMs)}</b></div></div>
   <div className="account-table-wrap"><table className="account-table"><thead><tr><th>{vi?'Bước':'Step'}</th><th>{vi?'Lượt':'Count'}</th><th>{vi?'Thời gian':'Time'}</th><th>{vi?'Lỗi':'Errors'}</th><th>{vi?'Rớt':'Drop-offs'}</th></tr></thead><tbody>{task.steps.map(s=><tr key={s.step}><td>{s.step}</td><td>{s.count}</td><td>{s.durationMs?duration(s.durationMs):'--'}</td><td>{s.errors}</td><td>{s.dropoffs}</td></tr>)}</tbody></table></div>
  </section>)}</div>:<section className="card dashboard-empty-chart"><strong>--</strong><span>{vi?'Chưa có task tracking. SDK hỗ trợ taskStart, taskStep, taskComplete, taskFail và taskAbandon.':'No task tracking yet. SDK supports taskStart, taskStep, taskComplete, taskFail and taskAbandon.'}</span></section>}
 </LiveBoundary>;
}
