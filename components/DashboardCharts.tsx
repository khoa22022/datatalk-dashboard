
"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MoreVertical, Smartphone, Shirt, Home, CircleDot } from "lucide-react";

const revenueData = [
  {month:"Jan",current:14,previous:-6},{month:"Feb",current:4,previous:-12},
  {month:"Mar",current:11,previous:-8},{month:"Apr",current:26,previous:-14},
  {month:"May",current:15,previous:-4},{month:"Jun",current:9,previous:-11},
  {month:"Jul",current:6,previous:-9}
];

const attentionData = [
  {page:"Pricing",active:192,dwell:246,exit:41},
  {page:"Product detail",active:138,dwell:184,exit:12},
  {page:"Homepage",active:102,dwell:121,exit:28},
  {page:"Checkout",active:91,dwell:122,exit:32},
  {page:"Contact",active:54,dwell:68,exit:63}
];

const tasks = [
  {name:"Checkout",time:138,success:68},
  {name:"Signup",time:42,success:81},
  {name:"Contact",time:31,success:74},
  {name:"Search",time:18,success:92}
];

const COLORS = ["#696cff","#03c3ec","#71dd37","#8592a3"];

export function RevenueAttentionCard(){
  return <div className="card chart-card">
    <div className="card-header">
      <div>
        <h2 className="card-title">User attention</h2>
        <div className="legend" style={{marginTop:8}}>
          <span className="legend-item"><i className="legend-dot" style={{background:"#696cff"}}/>2026 active time</span>
          <span className="legend-item"><i className="legend-dot" style={{background:"#03c3ec"}}/>2025 baseline</span>
        </div>
      </div>
      <button className="icon-btn"><MoreVertical size={20}/></button>
    </div>
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={revenueData} barCategoryGap="34%">
          <CartesianGrid vertical={false} strokeDasharray="4 5" stroke="#dfe2e8"/>
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#8b939e"}}/>
          <YAxis tickLine={false} axisLine={false} tick={{fontSize:12,fill:"#8b939e"}} width={34}/>
          <Tooltip cursor={{fill:"rgba(105,108,255,.05)"}}/>
          <Bar dataKey="current" radius={[7,7,7,7]} fill="#696cff" name="2026"/>
          <Bar dataKey="previous" radius={[7,7,7,7]} fill="#03c3ec" name="2025"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="mini-stat-row">
      <div className="mini-stat"><div className="mini-icon primary"><span>◷</span></div><div><small>Active time</small><b>18h 42m</b></div></div>
      <div className="mini-stat"><div className="mini-icon info"><span>◉</span></div><div><small>Avg. attention</small><b>1m 48s</b></div></div>
    </div>
  </div>
}

export function UXHealthCard(){
  return <div className="card chart-card">
    <div className="card-header">
      <div><h2 className="card-title">UX health</h2><p className="card-subtitle">A composite view of task efficiency and friction.</p></div>
      <select className="select"><option>30 days</option><option>7 days</option></select>
    </div>
    <div className="donut-wrap">
      <ResponsiveContainer width="220" height="190">
        <PieChart>
          <Pie data={[{name:"Health",value:86},{name:"Gap",value:14}]} innerRadius={62} outerRadius={82} startAngle={90} endAngle={-270} dataKey="value" stroke="none" paddingAngle={3}>
            <Cell fill="#696cff"/><Cell fill="#eef0f5"/>
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center"><div className="donut-value">86</div><div className="donut-label">UX score</div></div>
    </div>
    <div style={{padding:"0 24px 18px"}}>
      <div className="stat-meta up">↑ 4.2% vs previous period</div>
    </div>
    <div className="mini-stat-row">
      <div className="mini-stat"><div className="mini-icon primary">✓</div><div><small>Task success</small><b>72%</b></div></div>
      <div className="mini-stat"><div className="mini-icon info">!</div><div><small>Friction events</small><b>1,284</b></div></div>
    </div>
  </div>
}

export function TaskChartCard(){
  return <div className="card">
    <div className="card-header">
      <div><h2 className="card-title">Task efficiency</h2><p className="card-subtitle">Median completion time vs success rate.</p></div>
      <button className="icon-btn"><MoreVertical size={20}/></button>
    </div>
    <div className="chart-wrap" style={{height:250}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={tasks} layout="vertical" margin={{left:20,right:20}}>
          <CartesianGrid horizontal={false} stroke="#eef0f4"/>
          <XAxis type="number" hide/>
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#596273"}} width={75}/>
          <Tooltip/>
          <Bar dataKey="time" fill="#696cff" radius={[0,6,6,0]} name="Median seconds"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
}

export function DeviceChartCard(){
  const data=[{name:"Mobile",value:62},{name:"Desktop",value:31},{name:"Tablet",value:7}];
  return <div className="card">
    <div className="card-header"><div><h2 className="card-title">Device mix</h2><p className="card-subtitle">Where UX friction is concentrated.</p></div></div>
    <div style={{height:190,position:"relative"}}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3} stroke="none">{data.map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}</Pie><Tooltip/></PieChart>
      </ResponsiveContainer>
      <div className="donut-center"><div className="donut-value">62%</div><div className="donut-label">Mobile</div></div>
    </div>
    <div className="list-card">
      {data.map((x,i)=><div className="list-row" key={x.name}><div className="list-copy"><b>{x.name}</b><span>{x.value}% of sessions</span></div><div className="list-value">{x.value}%</div></div>)}
    </div>
  </div>
}

export function AttentionTable(){
  return <div className="card">
    <div className="card-header"><div><h2 className="card-title">Page attention ranking</h2><p className="card-subtitle">Prioritize attention with exit and friction context.</p></div><select className="select"><option>Active time</option><option>Dwell time</option><option>Exit rate</option></select></div>
    <div className="card-body">
      <table className="attention-table"><thead><tr><th>Page</th><th>Views</th><th style={{width:"34%"}}>Active time</th><th>Dwell</th><th>Exit</th></tr></thead><tbody>
        {attentionData.map((x)=><tr key={x.page}><td><b>{x.page}</b></td><td>{x.page==="Homepage"?"14,820":x.page==="Product detail"?"8,421":x.page==="Pricing"?"4,218":x.page==="Checkout"?"2,916":"2,104"}</td><td><div style={{display:"flex",alignItems:"center",gap:10}}><div className="attention-bar" style={{flex:1}}><i style={{width:`${Math.min(100,x.active/2)}%`}}/></div><span>{Math.floor(x.active/60)}m {String(x.active%60).padStart(2,"0")}s</span></div></td><td>{Math.floor(x.dwell/60)}m {String(x.dwell%60).padStart(2,"0")}s</td><td><span className={"pill "+(x.exit>40?"high":"good")}>{x.exit}%</span></td></tr>)}
      </tbody></table>
    </div>
  </div>
}
