'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { ProjectCard } from '../../components/ProjectCard';
import { Plus, Copy, Check, X } from 'lucide-react';

const API=process.env.NEXT_PUBLIC_API_URL || 'https://datatalk-api-h4a1.onrender.com';

type Project={id:string;name:string;domain?:string;tracking_key?:string};

export default function ProjectsPage(){
 const [projects,setProjects]=useState<Project[]>([]); const [open,setOpen]=useState(false); const [name,setName]=useState(''); const [domain,setDomain]=useState(''); const [created,setCreated]=useState<Project|null>(null); const [copied,setCopied]=useState(false);
 useEffect(()=>{fetch(`${API}/api/projects`).then(r=>r.json()).then(d=>Array.isArray(d)&&setProjects(d)).catch(()=>{});},[]);
 async function create(){ if(!name) return; const r=await fetch(`${API}/api/projects`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,domain})}); const p=await r.json(); if(p?.id){setProjects(v=>[p,...v]);setCreated(p);setName('');setDomain('');} }
 const code=created?`<script src="https://cdn.datatalk.io/sdk.js" data-project="${created.tracking_key}"></script>`:'';
 return <AppShell title="Projects"><div className="page-intro"><div><span className="eyebrow">PROJECTS</span><h1>Your products</h1><p>Connect websites and apps once. Datatalk handles the data layer behind the scenes.</p></div><button className="primary-button" onClick={()=>setOpen(true)}><Plus size={17}/> Add project</button></div><div className="project-grid">{projects.length?projects.map(p=><ProjectCard key={p.id} name={p.name} domain={p.domain||'No domain yet'} platform="Website" users="—" score={0}/>):<><ProjectCard name="Sweet Pea Website" domain="sweetpea.com" platform="Next.js" users="12.4K" score={86}/><ProjectCard name="Tan Khoa Portfolio" domain="tk-portfolio.figma.site" platform="Figma Site" users="3.8K" score={91}/></>}</div>{open&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span className="eyebrow">NEW PROJECT</span><h2>Connect a product</h2><p>Start with the basics. You can configure tracking later.</p></div><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div><label>Project name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sweet Pea Website"/></label><label>Website URL<input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="https://example.com"/></label><div className="modal-actions"><button className="secondary-button" onClick={()=>setOpen(false)}>Cancel</button><button className="primary-button" onClick={create}>Create project</button></div>{created&&<div className="success-box"><div><Check size={17}/><div><strong>Project created</strong><span>Copy the tracker when you're ready to connect it.</span></div></div><button className="copy-button" onClick={()=>{navigator.clipboard?.writeText(code);setCopied(true)}}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Copied':'Copy tracker'}</button><code>{code}</code></div>}</div></div>}</AppShell>
}
