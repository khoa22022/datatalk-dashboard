"use client";
import Link from "next/link";
import {Activity,Users,Clock3,CheckCircle2,ArrowUpRight} from "lucide-react";
import {RevenueAttentionCard,UXHealthCard,TaskChartCard,DeviceChartCard,AttentionTable} from "@/components/DashboardCharts";
import {useI18n} from "@/components/i18n";

const metricIcons=[Activity,Users,Clock3,CheckCircle2];
export default function Overview(){const {t}=useI18n();const metrics=[["uxHealth","86 / 100","↑ 4.2%"],["activeUsers","12,482","↑ 18.4%"],["activeTime","18h 42m","↑ 12.1%"],["taskSuccess","72%","↓ 3.8%"]] as const;return <>
  <div className="page-head page-head-v2"><div><div className="eyebrow">UX INTELLIGENCE</div><h1>{t('overviewTitle')}</h1><p>{t('overviewSubtitle')}</p></div><div className="toolbar"><Link href="/try/sandbox" className="btn outline">{t("openSandbox")}</Link><select className="select"><option>{t('last30')}</option><option>{t('last7')}</option></select></div></div>
  <div className="grid grid4 metric-grid-v2" style={{marginBottom:24}}>{metrics.map((x,i)=>{const Icon=metricIcons[i];return <div className="card stat-card stat-card-v2" key={x[0]}><div className="stat-card-top"><div className="metric-icon-v2"><Icon size={18}/></div><ArrowUpRight size={16} className="metric-arrow"/></div><div className="stat-label">{t(x[0])}</div><div className="stat-value">{x[1]}</div><div className={"stat-meta "+(x[2].includes("↓")?"down":"up")}>{x[2]} <span>{t('previousPeriod')}</span></div></div>})}</div>
  <div className="grid grid-main" style={{marginBottom:24}}><RevenueAttentionCard/><UXHealthCard/></div>
  <div className="grid grid3" style={{marginBottom:24}}><TaskChartCard/><DeviceChartCard/><div className="card opportunity-card"><div className="card-header"><div><h2 className="card-title">{t('uxPriorities')}</h2><p className="card-subtitle">{t('uxPrioritySubtitle')}</p></div></div><div className="card-body"><div className="priority"><span className="pill high">{t('high')}</span><h3>{t('mobileCheckout')}</h3><p>34% drop-off · 18% backtracking · 12% rage clicks.</p><Link href="/try/ai" className="btn outline">{t('investigate')}</Link></div><div className="priority medium" style={{marginTop:12}}><span className="pill medium">{t('medium')}</span><h3>{t('pricingHesitation')}</h3><p>72s attention on comparison section.</p><Link href="/try/heatmaps" className="btn outline">{t('viewHeatmap')}</Link></div></div></div></div>
  <AttentionTable/>
</>}
