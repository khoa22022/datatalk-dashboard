'use client';
import { LiveBoundary, useLiveResource, DataTable } from '@/components/v2/LiveData';
import { useI18n } from '@/components/i18n';
type Feedback={id:string;page:string;score:number|null;feedback:string;created_at:string};
export default function FeedbackPage(){const resource=useLiveResource<{responses:number;averageScore:number|null;feedback:Feedback[]}>('feedback');const {t}=useI18n();return <LiveBoundary title={t('feedback')} {...resource}><section className="account-panel"><p className="muted">Latest 500 feedback responses. Averages reflect the returned sample.</p><DataTable headings={['Page','Score','Feedback','Time']} rows={(resource.data?.feedback||[]).map(f=>[f.page,f.score,f.feedback,new Date(f.created_at).toLocaleString()])}/></section></LiveBoundary>}
