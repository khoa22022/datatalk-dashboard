'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { ProjectCard } from '../../components/ProjectCard';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
const API=process.env.NEXT_PUBLIC_API_URL || 'https://datatalk-api-h4a1.onrender.com';
type Project={id:string;name:string;domain?:string;tracking_key?:string;platform?:string};
export default function ProjectsPage(){
 const [projects,setProjects]=useState<Project[]>([]);
 useEffect(()=>{(async()=>{const {data}=await supabase?.auth.getSession() || {data:{session:null}};const token=data.session?.access_token;if(!token){window.location.href='/login';return;}const r=await fetch(`${API}/api/projects`,{headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(Array.isArray(d))setProjects(d);})().catch(()=>{});},[]);
 return <AppShell title="Projects"><div className="page-intro"><div><span className="eyebrow">PROJECTS</span><h1>Your products</h1><p>Connect websites and apps once. Datatalk handles the data layer behind the scenes.</p></div><Link className="primary-button" href="/projects/new"><Plus size={17}/> Add project</Link></div><div className="project-grid">{projects.map(p=><ProjectCard key={p.id} id={p.id} name={p.name} domain={p.domain||'No domain yet'} platform={p.platform||'Website'} users="—" score={0}/>)}{!projects.length&&<div className="empty-project card"><div className="empty-icon"><Plus size={22}/></div><h3>Start with your first product</h3><p>Connect a website or mobile app and Datatalk will guide you through installation and verification.</p><Link className="primary-button" href="/projects/new"><Plus size={16}/> Add your first project</Link></div>}</div></AppShell>
}
