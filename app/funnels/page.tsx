'use client';
import Link from 'next/link';
import { useI18n } from '@/components/i18n';
import { useV2Copy } from '@/components/v2/copy';
export default function Funnels(){const {t}=useI18n();const {c}=useV2Copy();return <><div className="page-head"><h1>{t('funnels')}</h1></div><section className="account-panel"><p>{c('comingSoon')}</p><Link href="/try/funnels" className="btn outline">{c('demoLink')}</Link></section></>}
