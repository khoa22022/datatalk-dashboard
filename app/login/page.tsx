'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Chrome, LockKeyhole, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Login(){
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
 async function login(){ setError(''); setLoading(true); if(!supabase){setError('Add Supabase URL and publishable key to .env.local first.');setLoading(false);return;} const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)setError(error.message); else window.location.href='/dashboard'; setLoading(false); }
 async function google(){ setError(''); if(!supabase){setError('Add Supabase URL and publishable key to .env.local first.');return;} await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/dashboard`}}); }
 return <main className="auth-page"><div className="auth-card"><div className="auth-brand"><div className="brand-mark"><Sparkles size={16}/></div><span>datatalk</span></div><div className="auth-copy"><span className="eyebrow">WELCOME BACK</span><h1>Understand your product.</h1><p>See what users do, why they struggle, and what to improve next.</p></div><button className="google-button" onClick={google}><Chrome size={17}/> Continue with Google</button><div className="or"><span>or continue with email</span></div><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>{error&&<div className="auth-error">{error}</div>}<button className="primary-button auth-submit" onClick={login} disabled={loading}><LockKeyhole size={16}/>{loading?'Signing in...':'Sign in'}<ArrowRight size={15}/></button><p className="auth-switch">New to Datatalk? <Link href="/register">Create an account</Link></p></div></main>
}
