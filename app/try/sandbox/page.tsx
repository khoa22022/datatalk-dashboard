"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Database, Play, RotateCcw, Send, Trash2, Zap } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { sendTrialEvent, trialRequest } from "@/lib/trial";

type Summary = {
  event_count: number;
  overview: { sessions:number; activeTimeMs:number; sectionAttentionMs:number; taskSuccessRate:number|null; pageViews:number; clicks:number; rageClicks:number; deadClicks:number };
  pages: Array<{page:string;views:number;activeTimeMs:number}>;
  sections: Array<{page:string;section:string;attentionMs:number}>;
  tasks: Array<{task:string;starts:number;completes:number;successRate:number;medianCompletionTimeMs:number}>;
};

const initialSummary: Summary = {event_count:0, overview:{sessions:0,activeTimeMs:0,sectionAttentionMs:0,taskSuccessRate:null,pageViews:0,clicks:0,rageClicks:0,deadClicks:0},pages:[],sections:[],tasks:[]};

export default function TrackingSandbox(){
  const {t}=useI18n();
  const [summary,setSummary]=useState<Summary>(initialSummary);
  const [log,setLog]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);
  const [sessionId,setSessionId]=useState(() => `trial_session_${Math.random().toString(36).slice(2,10)}`);
  const [visitorId]=useState(() => `trial_visitor_${Math.random().toString(36).slice(2,10)}`);

  const refresh=useCallback(async()=>{
    try{ const data=await trialRequest<Summary>("/api/try/summary"); setSummary(data); }catch(e){ setLog(x=>[`Summary error: ${e instanceof Error?e.message:"unknown"}`,...x].slice(0,20)); }
  },[]);
  useEffect(()=>{refresh()},[refresh]);

  const emit=async(event:string, page="/pricing", metadata:Record<string,unknown>={}, element?:string)=>{
    setBusy(true);
    try{
      await sendTrialEvent({event,page,session_id:sessionId,visitor_id:visitorId,element,metadata});
      setLog(x=>[`${new Date().toLocaleTimeString()} · ${event}`,...x].slice(0,20));
      await refresh();
    }catch(e){setLog(x=>[`Error · ${e instanceof Error?e.message:"unknown"}`,...x].slice(0,20))}
    finally{setBusy(false)}
  };

  const seed=async()=>{
    setBusy(true);
    setLog(x=>["Creating realistic scenario…",...x].slice(0,20));
    const scenario=[
      ["session_start","/pricing",{device:"mobile",browser:"Chrome",country:"Vietnam"}],
      ["page_view","/pricing",{}],
      ["section_view","/pricing",{section:"pricing-comparison",visibility_ratio:0.8}],
      ["section_heartbeat","/pricing",{section:"pricing-comparison",duration_ms:30000}],
      ["scroll","/pricing",{depth:72,scroll_y:610}],
      ["click","/pricing",{section:"pricing-comparison",x:520,y:360,viewport_width:390,viewport_height:844}],
      ["rage_click","/pricing",{section:"pricing-comparison",x:526,y:372,viewport_width:390,viewport_height:844,clicks:4}],
      ["dead_click","/pricing",{section:"pricing-comparison",x:530,y:380,viewport_width:390,viewport_height:844}],
      ["page_heartbeat","/pricing",{duration_ms:45000}],
      ["task_start","/checkout",{task:"checkout"}],
      ["task_step","/checkout",{task:"checkout",step:"shipping",duration_ms:42000}],
      ["task_error","/checkout",{task:"checkout",step:"payment",code:"invalid_card"}],
      ["task_backtrack","/checkout",{task:"checkout",from:"payment",to:"shipping"}],
      ["task_step","/checkout",{task:"checkout",step:"payment",duration_ms:88000}],
      ["task_complete","/checkout",{task:"checkout",duration_ms:138000}],
      ["session_end","/checkout",{duration_ms:260000}]
    ] as const;
    try{
      for(const [event,page,metadata] of scenario){
        await sendTrialEvent({event,page,session_id:sessionId,visitor_id:visitorId,metadata,element:event.includes("click")?"BUTTON":undefined});
        setLog(x=>[`✓ ${event}`,...x].slice(0,20));
      }
      await trialRequest("/api/try/feedback",{method:"POST",body:JSON.stringify({session_id:sessionId,page:"/pricing",survey_type:"CSAT",score:2,feedback:"I could not tell which plan was right for me."})});
      setLog(x=>["✓ feedback · CSAT 2/5","✓ Scenario completed — 16 events + feedback",...x].slice(0,20));
      await refresh();
    }catch(e){
      const message=e instanceof Error?e.message:"unknown";
      setLog(x=>[`✕ Scenario stopped: ${message}`,...x].slice(0,20));
    }finally{setBusy(false)}
  };
  const reset=async()=>{setBusy(true);try{await trialRequest("/api/try/reset",{method:"POST"});setSummary(initialSummary);setLog(["Sandbox reset"])}catch(e){setLog(x=>[`Reset error · ${e instanceof Error?e.message:"unknown"}`,...x].slice(0,20))}finally{setBusy(false)}};

  const active=useMemo(()=>Math.round(summary.overview.activeTimeMs/1000),[summary]);
  const attention=useMemo(()=>Math.round(summary.overview.sectionAttentionMs/1000),[summary]);
  const topPage=summary.pages[0]?.page || "—";
  const topSection=summary.sections[0]?.section || "—";

  return <>
    {log[0]?.startsWith("✕") ? <div className="priority" style={{marginBottom:16}}><span className="pill high">SANDBOX ERROR</span><p style={{marginTop:8}}>{log[0]}</p></div> : log[0]?.startsWith("✓ Scenario") ? <div className="callout" style={{marginBottom:16,padding:14,background:"#edfae7",borderRadius:6}}><b>Scenario completed</b><p className="card-subtitle" style={{marginTop:4}}>Events were accepted by the live backend. The counters below were refreshed from Supabase.</p></div> : null}
    <div className="page-head"><div><h1>{t("sandboxTitle")}</h1><p>{t("sandboxSubtitle")}</p></div><div className="toolbar"><span className="pill good"><CheckCircle2 size={13}/> {t("backendLive")}</span><button className="btn primary" onClick={seed} disabled={busy}><Zap size={15}/>{busy ? "Đang tạo scenario…" : t("seedScenario")}</button><button className="btn outline" onClick={reset} disabled={busy}><RotateCcw size={15}/>{t("resetSandbox")}</button></div></div>

    <div className="card" style={{marginBottom:24}}><div className="card-header"><div><h2 className="card-title">{t("liveData")}</h2><p className="card-subtitle">{t("trialProject")} · {summary.event_count} events stored in the real backend.</p></div><Database size={20} color="#696cff"/></div><div className="grid grid4" style={{padding:"0 24px 24px"}}>{[[t("eventCount"),summary.event_count],[t("sessionCount"),summary.overview.sessions],[t("activeTimeSandbox"),`${active}s`],[t("sectionAttentionSandbox"),`${attention}s`]].map(x=><div className="card stat-card" style={{boxShadow:"none",border:"1px solid #eef0f4"}} key={x[0]}><div className="stat-label">{x[0]}</div><div className="stat-value">{x[1]}</div></div>)}</div></div>

    <div className="grid grid-main" style={{marginBottom:24}}>
      <div className="card"><div className="card-header"><div><h2 className="card-title">{t("sessionControls")}</h2><p className="card-subtitle">Session: {sessionId}</p></div><Play size={18} color="#696cff"/></div><div className="card-body"><div className="toolbar"><button className="btn primary" disabled={busy} onClick={()=>emit("session_start","/pricing",{device:"mobile",browser:"Chrome",country:"Vietnam"})}>{t("startSession")}</button><button className="btn secondary" disabled={busy} onClick={()=>emit("page_view","/pricing",{})}>{t("pageView")}</button><button className="btn outline" disabled={busy} onClick={()=>emit("session_end","/checkout",{duration_ms:260000})}>{t("endSession")}</button></div></div></div>
      <div className="card"><div className="card-header"><div><h2 className="card-title">{t("attentionControls")}</h2><p className="card-subtitle">/pricing · pricing-comparison</p></div></div><div className="card-body"><div className="toolbar" style={{flexWrap:"wrap"}}><button className="btn outline" disabled={busy} onClick={()=>emit("section_view","/pricing",{section:"pricing-comparison",visibility_ratio:.8})}>{t("sectionView")}</button><button className="btn outline" disabled={busy} onClick={()=>emit("section_heartbeat","/pricing",{section:"pricing-comparison",duration_ms:30000})}>{t("heartbeat30")}</button><button className="btn outline" disabled={busy} onClick={()=>emit("scroll","/pricing",{depth:72,scroll_y:610})}>{t("scroll72")}</button></div></div></div>
    </div>

    <div className="grid grid3" style={{marginBottom:24}}>
      <div className="card"><div className="card-header"><div><h2 className="card-title">{t("interactionControls")}</h2><p className="card-subtitle">Heatmap-ready events.</p></div></div><div className="card-body"><div className="toolbar" style={{flexWrap:"wrap"}}><button className="btn outline" disabled={busy} onClick={()=>emit("click","/pricing",{section:"pricing-comparison",x:520,y:360,viewport_width:390,viewport_height:844},"BUTTON")}>{t("clickEvent")}</button><button className="btn outline" disabled={busy} onClick={()=>emit("rage_click","/pricing",{section:"pricing-comparison",x:526,y:372,viewport_width:390,viewport_height:844,clicks:4},"BUTTON")}>{t("rageClickEvent")}</button><button className="btn outline" disabled={busy} onClick={()=>emit("dead_click","/pricing",{section:"pricing-comparison",x:530,y:380,viewport_width:390,viewport_height:844},"DIV")}>{t("deadClickEvent")}</button></div></div></div>
      <div className="card"><div className="card-header"><div><h2 className="card-title">{t("taskControls")}</h2><p className="card-subtitle">checkout</p></div></div><div className="card-body"><div className="toolbar" style={{flexWrap:"wrap"}}><button className="btn outline" disabled={busy} onClick={()=>emit("task_start","/checkout",{task:"checkout"})}>{t("taskStart")}</button><button className="btn outline" disabled={busy} onClick={()=>emit("task_step","/checkout",{task:"checkout",step:"payment",duration_ms:88000})}>{t("taskStep")}</button><button className="btn outline" disabled={busy} onClick={()=>emit("task_error","/checkout",{task:"checkout",step:"payment",code:"invalid_card"})}>{t("taskError")}</button><button className="btn outline" disabled={busy} onClick={()=>emit("task_backtrack","/checkout",{task:"checkout",from:"payment",to:"shipping"})}>{t("taskBacktrack")}</button><button className="btn primary" disabled={busy} onClick={()=>emit("task_complete","/checkout",{task:"checkout",duration_ms:138000})}>{t("taskComplete")}</button></div></div></div>
      <div className="card"><div className="card-header"><div><h2 className="card-title">{t("feedbackControls")}</h2><p className="card-subtitle">Survey signal → feedback table.</p></div></div><div className="card-body"><button className="btn primary" disabled={busy} onClick={async()=>{setBusy(true);try{await trialRequest("/api/try/feedback",{method:"POST",body:JSON.stringify({session_id:sessionId,page:"/pricing",survey_type:"CSAT",score:2,feedback:"I could not tell which plan was right for me."})});setLog(x=>["Feedback submitted · CSAT 2/5",...x].slice(0,20));await refresh()}finally{setBusy(false)}}}><Send size={15}/>{t("sendFeedback")}</button></div></div>
    </div>

    <div className="grid grid-main">
      <div className="card"><div className="card-header"><div><h2 className="card-title">{t("eventLog")}</h2><p className="card-subtitle">Every click here goes through Render → Supabase.</p></div><button className="icon-btn" onClick={()=>setLog([])} title={t("clearLog")}><Trash2 size={17}/></button></div><div className="list-card">{log.length?log.map((x,i)=><div className="list-row" key={`${x}-${i}`}><div className="list-icon primary"><Zap size={17}/></div><div className="list-copy"><b>{x.split(" · ").pop()}</b><span>{x}</span></div></div>):<div style={{padding:24}} className="card-subtitle">{t("noEvents")}</div>}</div></div>
      <div className="card"><div className="card-header"><div><h2 className="card-title">{t("liveData")}</h2><p className="card-subtitle">Aggregated from Supabase.</p></div></div><div className="card-body"><div className="section-bars"><div className="section-row"><strong>{t("taskSuccess")}</strong><div className="attention-bar"><i style={{width:`${summary.overview.taskSuccessRate ?? 0}%`}}/></div><div className="value">{summary.overview.taskSuccessRate ?? 0}%</div></div><div className="section-row"><strong>{t("topPage")}</strong><div></div><div className="value">{topPage}</div></div><div className="section-row"><strong>{t("topSection")}</strong><div></div><div className="value">{topSection}</div></div><div className="section-row"><strong>{t("rageClickLabel")}</strong><div></div><div className="value">{summary.overview.rageClicks}</div></div><div className="section-row"><strong>{t("deadClickLabel")}</strong><div></div><div className="value">{summary.overview.deadClicks}</div></div></div></div></div>
    </div>
  </>;
}
