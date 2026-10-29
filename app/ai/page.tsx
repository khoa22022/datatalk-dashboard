'use client';
import { LiveBoundary, useLiveResource } from '@/components/v2/LiveData';
import { useV2Copy } from '@/components/v2/copy';
import { useI18n } from '@/components/i18n';
type Insight={severity:string;title:string;evidence:Record<string,unknown>;recommendation:string};
export default function AI(){const resource=useLiveResource<{insights:Insight[]}>('ai-insights');const {t}=useI18n();const {c}=useV2Copy();return <LiveBoundary title={t('ai')} {...resource}><div className="account-alert">{c('ruleBased')}</div>{!resource.data?.insights.length?<section className="account-panel">{c('noInsights')}</section>:resource.data.insights.map((i,index)=><section key={index} className="account-panel"><span className="account-badge">{i.severity}</span><h2>{i.title}</h2><p>{i.recommendation}</p><dl className="account-details">{Object.entries(i.evidence).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl></section>)}</LiveBoundary>}
