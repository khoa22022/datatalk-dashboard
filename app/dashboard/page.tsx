'use client';
import { useState } from 'react';
import RealOverviewDashboard, { type RealDashboardData } from '@/components/RealOverviewDashboard';
import { LiveBoundary, useLiveResource } from '@/components/v2/LiveData';
import { useI18n } from '@/components/i18n';

export default function Dashboard() {
  const { lang, t } = useI18n();
  const [days, setDays] = useState(30);
  const resource = useLiveResource<RealDashboardData>(`dashboard?days=${days}`);
  const vi = lang === 'vi';
  return <LiveBoundary
    title={t('overviewTitle')}
    eyebrow="UX INTELLIGENCE"
    subtitle={t('overviewSubtitle')}
    className="page-head-v2"
    actions={<div className="toolbar"><select className="select" value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={30}>{t('last30')}</option><option value={7}>{t('last7')}</option></select></div>}
    {...resource}
  >
    {resource.data ? <RealOverviewDashboard data={resource.data} /> : <div className="dashboard-empty-inline">--<small>{vi ? 'Chưa có dữ liệu.' : 'No data yet.'}</small></div>}
  </LiveBoundary>;
}
