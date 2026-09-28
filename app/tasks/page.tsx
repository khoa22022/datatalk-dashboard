'use client';
import { LiveBoundary, useLiveResource, DataTable, duration } from '@/components/v2/LiveData';
import { useI18n } from '@/components/i18n';
type Task={task:string;starts:number;completes:number;successRate:number;errors:number;backtracks:number;medianCompletionTimeMs:number};
export default function Tasks(){const resource=useLiveResource<Task[]>('tasks');const {t}=useI18n();return <LiveBoundary title={t('tasks')} {...resource}><section className="account-panel"><DataTable headings={['Task','Started','Completed','Success','Errors','Backtracks','Median duration']} rows={(resource.data||[]).map(t=>[t.task,t.starts,t.completes,`${t.successRate}%`,t.errors,t.backtracks,duration(t.medianCompletionTimeMs)])}/></section></LiveBoundary>}
