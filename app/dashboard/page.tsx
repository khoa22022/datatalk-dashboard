'use client';
import { useMemo, useState } from 'react';
import RealOverviewDashboard, { type RealDashboardData } from '@/components/RealOverviewDashboard';
import { LiveBoundary, useLiveResource } from '@/components/v2/LiveData';
import AnalyticsFilters, { toIsoDate, type AnalyticsFilterValue } from '@/components/AnalyticsFilters';
import { useI18n } from '@/components/i18n';

const initial:AnalyticsFilterValue={from:'',to:'',compare:'previous',page:'',device:''};
export default function Dashboard() {
  const { lang, t } = useI18n(); const vi = lang === 'vi'; const [filter,setFilter]=useState(initial);
  const query=useMemo(()=>{const q=new URLSearchParams();const f=toIsoDate(filter.from),to=toIsoDate(filter.to);if(f)q.set('from',f);if(to)q.set('to',to);q.set('compare',filter.compare);if(filter.page)q.set('page',filter.page);if(filter.device)q.set('device',filter.device);return q.toString()},[filter]);
  const resource = useLiveResource<RealDashboardData>('dashboard',query);
  const pages=(resource.data?.pages||[]).map(p=>({pagePath:p.page,pageName:p.page}));
  return <LiveBoundary title={t('overviewTitle')} eyebrow="UX INTELLIGENCE" subtitle={t('overviewSubtitle')} className="page-head-v2" {...resource}>
    <AnalyticsFilters value={filter} onChange={setFilter} pages={pages}/>
    {resource.data ? <RealOverviewDashboard data={resource.data} /> : <div className="dashboard-empty-inline">--<small>{vi ? 'Chưa có dữ liệu.' : 'No data yet.'}</small></div>}
  </LiveBoundary>;
}
