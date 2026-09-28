'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Chrome, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const params = useSearchParams();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [show,setShow]=useState(false);
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  useEffect(()=>{const e=params.get('error'); if(e) setError(e.replaceAll('_',' '));},[params]);
  async function login(e:FormEvent){e.preventDefault();setError('');if(!supabase){setError('Supabase is not configured.');return;}setBusy(true);const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});setBusy(false);if(error){setError(error.message);return;}window.location.href='/dashboard';}
  async function google(){setError('');if(!supabase){setError('Supabase is not configured.');return;}setBusy(true);const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/auth/callback`}});if(error){setBusy(false);setError(error.message);}}
  return <main className="auth-page"><div className="auth-card"><div className="auth-brand"><div className="brand-mark"><Sparkles size={16}/></div><span>datatalk</span></div><div className="auth-copy"><span className="eyebrow">WELCOME BACK</span><h1>Sign in to your workspace.</h1><p>Bring real user behavior into the product decisions your team makes.</p></div><button className="google-button" onClick={google} disabled={busy}><Chrome size={17}/> Continue with Google</button><div className="or"><span>or continue with email</span></div><form onSubmit={login}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required/></label><label>Password<div className="password-field"><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required/><button type="button" className="password-toggle" onClick={()=>setShow(v=>!v)} aria-label={show?'Hide password':'Show password'}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>{error&&<div className="auth-error">{error}</div>}<div className="auth-row"><Link href="/forgot-password">Forgot password?</Link></div><button className="primary-button auth-submit" disabled={busy}>{busy?'Signing in…':'Sign in'}<ArrowRight size={15}/></button></form><p className="auth-switch">New to DataTalk? <Link href="/register">Create account</Link></p><Link href="/try" className="auth-demo-link">Try the demo without an account</Link></div></main>
}
