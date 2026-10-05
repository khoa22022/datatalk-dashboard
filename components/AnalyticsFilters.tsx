'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from './i18n';

export type AnalyticsFilterValue = { from: string; to: string; compare: 'previous'|'yesterday'; page: string; device: string };
const digits=(v:string)=>v.replace(/\D/g,'').slice(0,8);
export function formatDateInput(value:string){const d=digits(value);if(d.length<=2)return d;if(d.length<=4)return `${d.slice(0,2)}/${d.slice(2)}`;return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`}
export function toIsoDate(value:string){const m=value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return'';const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]);const dt=new Date(year,month-1,day);if(dt.getFullYear()!==year||dt.getMonth()!==month-1||dt.getDate()!==day)return'';return `${m[3]}-${m[2]}-${m[1]}`}
export function todayText(offset=0){const d=new Date();d.setDate(d.getDate()+offset);return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`}

type PageOption={pagePath:string;pageName?:string;pageTitle?:string};
export default function AnalyticsFilters({value,onChange,pages=[]}:{value:AnalyticsFilterValue;onChange:(v:AnalyticsFilterValue)=>void;pages?:PageOption[]}){
  const {lang}=useI18n();const vi=lang==='vi';const set=(patch:Partial<AnalyticsFilterValue>)=>onChange({...value,...patch});
  const invalid=useMemo(()=>({from:!!value.from&&!toIsoDate(value.from),to:!!value.to&&!toIsoDate(value.to)}),[value.from,value.to]);
  const selected=pages.find(p=>p.pagePath===value.page);const [pageQuery,setPageQuery]=useState(selected?(selected.pageName||selected.pageTitle||selected.pagePath):'');const [pageOpen,setPageOpen]=useState(false);
  useEffect(()=>{const row=pages.find(p=>p.pagePath===value.page);setPageQuery(value.page?(row?.pageName||row?.pageTitle||value.page):'')},[value.page,pages]);
  const matches=useMemo(()=>{const q=pageQuery.trim().toLowerCase();if(!q)return pages.slice(0,12);return pages.filter(p=>`${p.pageName||''} ${p.pageTitle||''} ${p.pagePath}`.toLowerCase().includes(q)).slice(0,12)},[pageQuery,pages]);
  const preset=(days:number)=>{const to=todayText(0);const d=new Date();d.setDate(d.getDate()-days+1);const from=`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;set({from,to})};
  return <div className="analytics-filterbar">
    <div className="analytics-filter-presets"><button className="btn outline" onClick={()=>set({from:todayText(-1),to:todayText(-1),compare:'previous'})}>{vi?'Hôm qua':'Yesterday'}</button><button className="btn outline" onClick={()=>preset(7)}>{vi?'7 ngày':'7 days'}</button><button className="btn outline" onClick={()=>preset(30)}>{vi?'30 ngày':'30 days'}</button></div>
    <label className="date-field"><span>{vi?'Từ ngày':'From'}</span><input aria-invalid={invalid.from} placeholder="dd/mm/yyyy" inputMode="numeric" value={value.from} onChange={e=>set({from:formatDateInput(e.target.value)})}/></label>
    <label className="date-field"><span>{vi?'Đến ngày':'To'}</span><input aria-invalid={invalid.to} placeholder="dd/mm/yyyy" inputMode="numeric" value={value.to} onChange={e=>set({to:formatDateInput(e.target.value)})}/></label>
    <label className="date-field"><span>{vi?'So sánh':'Compare'}</span><select value={value.compare} onChange={e=>set({compare:e.target.value as AnalyticsFilterValue['compare']})}><option value="previous">{vi?'Kỳ trước cùng độ dài':'Previous period'}</option><option value="yesterday">{vi?'So với hôm qua':'Yesterday'}</option></select></label>
    <div className="date-field page-filter"><span>{vi?'Tìm trang':'Find page'}</span><div className="page-search-combo"><div className="search-select"><Search size={14}/><input value={pageQuery} placeholder={vi?'Tên trang, path hoặc URL':'Page name, path or URL'} onFocus={()=>setPageOpen(true)} onChange={e=>{setPageQuery(e.target.value);setPageOpen(true);if(!e.target.value)set({page:''})}}/></div>{pageOpen&&<div className="page-search-menu"><button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>{set({page:''});setPageQuery('');setPageOpen(false)}}>{vi?'Tất cả trang':'All pages'}</button>{matches.map(p=><button type="button" key={p.pagePath} onMouseDown={e=>e.preventDefault()} onClick={()=>{set({page:p.pagePath});setPageQuery(p.pageName||p.pageTitle||p.pagePath);setPageOpen(false)}}><b>{p.pageName||p.pageTitle||p.pagePath}</b><small>{p.pagePath}</small></button>)}</div>}</div></div>
    <label className="date-field"><span>{vi?'Thiết bị':'Device'}</span><select value={value.device} onChange={e=>set({device:e.target.value})}><option value="">{vi?'Tất cả thiết bị':'All devices'}</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option></select></label>
    {(invalid.from||invalid.to)&&<small className="date-error">{vi?'Nhập ngày theo định dạng dd/mm/yyyy.':'Use dd/mm/yyyy.'}</small>}
  </div>
}
