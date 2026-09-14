'use client';
import { Bell, CalendarDays, ChevronDown, HelpCircle, Search, UserCircle } from 'lucide-react';

export function Topbar({title='Overview'}:{title?:string}){
 return <header className="topbar"><div className="topbar-title"><span className="crumb">Datatalk</span><ChevronDown size={14}/><strong>{title}</strong></div><div className="topbar-actions"><button className="icon-button"><Search size={18}/></button><button className="icon-button"><HelpCircle size={18}/></button><button className="icon-button"><Bell size={18}/><span className="dot"></span></button><div className="date-control"><CalendarDays size={16}/><span>Last 30 days</span><ChevronDown size={14}/></div><div className="avatar">TK</div></div></header>
}
