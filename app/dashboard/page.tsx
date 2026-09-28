'use client';
import { LiveBoundary, useLiveResource, duration } from '@/components/v2/LiveData';
import { useI18n } from '@/components/i18n';
type Overview = { visitors: number; sessions: number; pageViews: number; clicks: number; activeTimeMs: number; rageClicks: number; deadClicks: number; taskSuccessRate: number | null };
export default function Dashboard() {
  const resource = useLiveResource<Overview>('overview'); const data = resource.data; const { t } = useI18n();
  return <LiveBoundary title={t('overview')} {...resource}><div className="account-metrics">{[
    [t('visitors'),data?.visitors ?? 0], [t('sessions'),data?.sessions ?? 0], ['Page views',data?.pageViews ?? 0], ['Active time',duration(data?.activeTimeMs ?? 0)], ['Clicks',data?.clicks ?? 0], ['Rage clicks',data?.rageClicks ?? 0], ['Dead clicks',data?.deadClicks ?? 0], ['Task success',data?.taskSuccessRate == null ? '-' : `${data.taskSuccessRate}%`]
  ].map(([label,value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div></LiveBoundary>;
}
