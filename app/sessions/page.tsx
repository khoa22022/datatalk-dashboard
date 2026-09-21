'use client';
import { LiveBoundary, useLiveResource, DataTable, duration } from '@/components/v2/LiveData';
import { useI18n } from '@/components/i18n';
type SessionRow={session_key:string;device:string;browser:string;country:string;durationMs:number;eventCount:number;pages:string[]};
export default function Sessions(){const resource=useLiveResource<SessionRow[]>('sessions');const {t}=useI18n();return <LiveBoundary title={t('sessions')} {...resource}><section className="account-panel"><p className="muted">Session metadata and observed events; this is not a video or DOM replay.</p><DataTable headings={['Session','Device','Browser','Country','Observed duration','Events in sample','Pages']} rows={(resource.data||[]).map(s=>[s.session_key,s.device,s.browser,s.country,duration(s.durationMs),s.eventCount,s.pages.join(', ')])}/></section></LiveBoundary>}
