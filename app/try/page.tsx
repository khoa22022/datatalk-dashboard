import Link from "next/link";
export default function Overview(){return <><div className="row"><div><h1 className="title">Product experience overview</h1><p className="subtitle">Understand where users spend time, where they struggle, and what deserves UX attention first.</p></div><select className="select"><option>Last 30 days</option><option>Last 7 days</option></select></div>
<div style={{height:20}}/>
<div className="grid4">
{[["UX Health","86 / 100","↑ 4.2%","up"],["Active users","12,482","↑ 18.4%","up"],["Active time","18h 42m","↑ 12.1%","up"],["Task success","72%","↓ 3.8%","down"]].map(x=><div className="card" key={x[0]}><div className="label">{x[0]}</div><div className="metric">{x[1]}</div><div className={"trend "+x[3]}>{x[2]}</div></div>)}</div>
<div style={{height:16}}/>
<div className="grid2">
<div className="card"><h2>Where users spend their attention</h2><p className="muted">Active time by page. Longer time is not automatically good — compare with exits and task success.</p>
<div style={{marginTop:18}} className="section-list">{[["Pricing","3m 12s",88],["Product detail","2m 18s",67],["Homepage","1m 42s",51],["Checkout","1m 31s",43],["Contact","54s",25]].map(x=><div className="section-item" key={x[0]}><b>{x[0]}</b><div className="bar"><i style={{width:x[2]+"%"}}/></div><b>{x[1]}</b></div>)}</div></div>
<div className="card"><h2>UX priorities</h2><p className="muted">Issues ranked by impact × evidence × confidence.</p>
<div className="priority" style={{marginTop:14}}><span className="badge high">HIGH</span><h3>Mobile checkout friction</h3><p className="muted mini">34% drop-off · 18% backtracking · 12% rage clicks</p><Link href="/try/ai" className="btn outline">Investigate</Link></div>
<div className="priority medium" style={{marginTop:10}}><span className="badge medium">MEDIUM</span><h3>Pricing comparison hesitation</h3><p className="muted mini">1m 12s attention on comparison section.</p><Link href="/try/heatmaps" className="btn outline">View heatmap</Link></div></div>
</div>
<div style={{height:16}}/>
<div className="grid3">
<div className="card"><h2>Longest attention</h2><div className="metric">Pricing</div><div className="muted">3m 12s active · 41% exit</div></div>
<div className="card"><h2>Most friction</h2><div className="metric">Payment</div><div className="muted">2.8× slower than median</div></div>
<div className="card"><h2>Most engaged section</h2><div className="metric">Feature compare</div><div className="muted">72s active attention</div></div>
</div>
</>}