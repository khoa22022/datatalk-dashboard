'use client';
import { LiveBoundary, useLiveResource, DataTable, duration } from '@/components/v2/LiveData';
import { useI18n } from '@/components/i18n';
type Page = {page:string;views:number;activeTimeMs:number;dwellTimeMs:number;clicks:number;rageClicks:number;deadClicks:number;scrollMax:number};
export default function Analytics() {
 const resource=useLiveResource<{pages:Page[]}>('analytics');const {t}=useI18n();
 return <LiveBoundary title={t('analytics')} {...resource}><section className="account-panel"><h2>Page attention</h2><DataTable headings={['Page','Views','Active time','Dwell time','Rage clicks','Dead clicks','Max scroll']} rows={(resource.data?.pages||[]).map(p=>[p.page,p.views,duration(p.activeTimeMs),duration(p.dwellTimeMs),p.rageClicks,p.deadClicks,`${p.scrollMax}%`])}/></section></LiveBoundary>;
}
