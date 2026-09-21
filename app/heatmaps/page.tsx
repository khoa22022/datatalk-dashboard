'use client';
import Link from 'next/link';
import { LiveBoundary, useLiveResource, DataTable } from '@/components/v2/LiveData';
import { useI18n } from '@/components/i18n';
type Point={page:string;event_type:string;x:number;y:number;viewport_width:number;viewport_height:number};
export default function Heatmaps(){const resource=useLiveResource<{points:Point[]}>('heatmaps');const {t}=useI18n();return <LiveBoundary title={t('heatmaps')} {...resource}><section className="account-panel"><h2>Recorded interaction points</h2><p className="muted">Real collected coordinates. A page-image overlay is not included in this account release; no sample website is presented as your project.</p><DataTable headings={['Page','Event','X','Y','Viewport']} rows={(resource.data?.points||[]).slice(0,100).map(p=>[p.page,p.event_type,p.x,p.y,`${p.viewport_width ?? '-'} x ${p.viewport_height ?? '-'}`])}/><p className="muted">Showing up to 100 points from the returned sample.</p><Link href="/try/heatmaps">Explore the separate heatmap demo</Link></section></LiveBoundary>}
