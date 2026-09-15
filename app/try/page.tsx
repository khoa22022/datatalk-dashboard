'use client';

import Link from 'next/link';

const projects = [
  {name:'Sweet Pea Website', type:'Website · Next.js', visitors:'12.4K', score:86},
  {name:'Tan Khoa Portfolio', type:'Figma Site', visitors:'3.8K', score:91},
];

export default function TrialPage() {
  return (
    <main style={{minHeight:'100vh',background:'#f7f7fb',color:'#182230'}}>
      <aside style={{position:'fixed',inset:'0 auto 0 0',width:248,background:'#17191f',color:'#fff',padding:24}}>
        <div style={{fontSize:22,fontWeight:800,marginBottom:30}}>✦ datatalk</div>
        <div style={{fontSize:12,color:'#aeb4c0',marginBottom:18}}>TRIAL MODE · DEMO DATA</div>
        {['Overview','Projects','Analytics','Heatmaps','Sessions','Funnels','AI Analyst'].map((x,i)=>(
          <div key={x} style={{padding:'10px 12px',borderRadius:9,background:i===1?'#696cff':'transparent',color:i===1?'#fff':'#b9bec8',marginBottom:4}}>
            {x}
          </div>
        ))}
      </aside>

      <section style={{marginLeft:248,padding:'34px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div>
            <div style={{fontSize:13,color:'#696cff',fontWeight:800,marginBottom:5}}>TRIAL EXPERIENCE</div>
            <h1 style={{fontSize:30,margin:0}}>Good afternoon, Tan Khoa</h1>
            <p style={{color:'#737b89'}}>Explore how Datatalk turns behavior data into UX decisions.</p>
          </div>
          <Link href="/projects/new" style={{padding:'11px 16px',borderRadius:10,background:'#696cff',color:'#fff',fontWeight:800}}>+ Add Project</Link>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:16,marginBottom:20}}>
          {[
            ['Visitors','16.2K','+18.4%'],['Sessions','21.8K','+12.8%'],
            ['Avg. session','2m 14s','+8.2%'],['UX Score','86 / 100','Healthy']
          ].map(([a,b,c])=>(
            <div key={a} style={{background:'#fff',border:'1px solid #e7e8ed',borderRadius:16,padding:20}}>
              <div style={{color:'#737b89',fontSize:13}}>{a}</div>
              <div style={{fontSize:26,fontWeight:800,margin:'8px 0'}}>{b}</div>
              <div style={{fontSize:12,color:'#258a52'}}>{c}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1.35fr 1fr',gap:18}}>
          <div style={{background:'#fff',border:'1px solid #e7e8ed',borderRadius:16,padding:22}}>
            <h2 style={{marginTop:0}}>Projects</h2>
            {projects.map(p=>(
              <div key={p.name} style={{border:'1px solid #eceef2',borderRadius:12,padding:16,marginTop:12}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <div><b>{p.name}</b><div style={{fontSize:13,color:'#737b89',marginTop:4}}>{p.type}</div></div>
                  <span style={{fontSize:12,color:'#258a52'}}>Tracking Active</span>
                </div>
                <div style={{display:'flex',gap:36,marginTop:16}}>
                  <div><small style={{color:'#737b89'}}>Visitors</small><div><b>{p.visitors}</b></div></div>
                  <div><small style={{color:'#737b89'}}>UX Score</small><div><b>{p.score}</b></div></div>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:'#fff',border:'1px solid #e7e8ed',borderRadius:16,padding:22}}>
            <h2 style={{marginTop:0}}>✦ AI UX Analyst</h2>
            <p style={{color:'#737b89'}}>Demo insight based on sample behavior data.</p>
            <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:12,padding:16}}>
              <b>Mobile CTA friction detected</b>
              <p style={{fontSize:14,color:'#6b7280'}}>Users repeatedly interact around the primary CTA but conversion remains low.</p>
              <strong>Recommendation</strong>
              <p style={{fontSize:14,color:'#6b7280'}}>Move the primary CTA closer to the user's visual focus.</p>
            </div>
          </div>
        </div>

        <div style={{marginTop:20,padding:14,borderRadius:12,background:'#eef0ff',color:'#4b4fbf',fontSize:13}}>
          Trial mode only. This demo does not create real users or bypass production authentication.
        </div>
      </section>
    </main>
  );
}
