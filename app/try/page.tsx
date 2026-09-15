
import {RevenueAttentionCard,UXHealthCard,TaskChartCard,DeviceChartCard,AttentionTable} from "@/components/DashboardCharts";
import Link from "next/link";
export default function Overview(){return <>
  <div className="page-head"><div><h1>Product experience overview</h1><p>Understand where users spend time, where they struggle, and what deserves UX attention first.</p></div><div className="toolbar"><select className="select"><option>Last 30 days</option><option>Last 7 days</option></select></div></div>
  <div className="grid grid4" style={{marginBottom:24}}>
    {[["UX Health","86 / 100","↑ 4.2%","up"],["Active users","12,482","↑ 18.4%","up"],["Active time","18h 42m","↑ 12.1%","up"],["Task success","72%","↓ 3.8%","down"]].map(x=><div className="card stat-card" key={x[0]}><div className="stat-label">{x[0]}</div><div className="stat-value">{x[1]}</div><div className={"stat-meta "+x[3]}>{x[2]} vs previous period</div></div>)}
  </div>
  <div className="grid grid-main" style={{marginBottom:24}}><RevenueAttentionCard/><UXHealthCard/></div>
  <div className="grid grid3" style={{marginBottom:24}}><TaskChartCard/><DeviceChartCard/><div className="card"><div className="card-header"><div><h2 className="card-title">UX priorities</h2><p className="card-subtitle">Impact × evidence × confidence.</p></div></div><div className="card-body"><div className="priority"><span className="pill high">HIGH</span><h3>Mobile checkout friction</h3><p>34% drop-off · 18% backtracking · 12% rage clicks.</p><Link href="/try/ai" className="btn outline">Investigate</Link></div><div className="priority medium" style={{marginTop:12}}><span className="pill medium">MEDIUM</span><h3>Pricing comparison hesitation</h3><p>72s attention on comparison section.</p><Link href="/try/heatmaps" className="btn outline">View heatmap</Link></div></div></div></div>
  <AttentionTable/>
</>}
