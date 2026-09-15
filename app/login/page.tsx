'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f7f7fb',padding:24}}>
      <section style={{width:'100%',maxWidth:420,background:'#fff',border:'1px solid #e7e8ed',borderRadius:18,padding:32,boxShadow:'0 18px 50px rgba(20,25,40,.08)'}}>
        <div style={{fontSize:24,fontWeight:800,marginBottom:8}}>✦ datatalk</div>
        <h1 style={{fontSize:28,margin:'0 0 8px'}}>Welcome back</h1>
        <p style={{color:'#737b89',marginBottom:24}}>Sign in to analyze your products and user behavior.</p>

        <button style={{width:'100%',padding:'12px 16px',borderRadius:10,border:'1px solid #dfe2e8',background:'#fff',fontWeight:700,cursor:'pointer'}}>
          Continue with Google
        </button>

        <div style={{display:'flex',alignItems:'center',gap:12,margin:'22px 0',color:'#9aa1ad',fontSize:13}}>
          <span style={{height:1,background:'#e7e8ed',flex:1}} />or<span style={{height:1,background:'#e7e8ed',flex:1}} />
        </div>

        <label style={{display:'grid',gap:7,marginBottom:14}}>
          <span>Email</span>
          <input placeholder="you@example.com" style={{padding:12,border:'1px solid #dfe2e8',borderRadius:10}} />
        </label>
        <label style={{display:'grid',gap:7,marginBottom:16}}>
          <span>Password</span>
          <input type="password" placeholder="••••••••" style={{padding:12,border:'1px solid #dfe2e8',borderRadius:10}} />
        </label>

        <button style={{width:'100%',padding:'12px 16px',border:0,borderRadius:10,background:'#696cff',color:'#fff',fontWeight:800,cursor:'pointer'}}>
          Sign in
        </button>

        <Link href="/try" style={{display:'block',textAlign:'center',marginTop:16,padding:'12px 16px',borderRadius:10,background:'#eef0ff',color:'#5055d9',fontWeight:800}}>
          ▶ Dùng thử trải nghiệm
        </Link>
        <p style={{textAlign:'center',fontSize:12,color:'#8a919e',marginTop:10}}>
          Không cần đăng nhập · Demo workspace để review UX
        </p>
      </section>
    </main>
  );
}
