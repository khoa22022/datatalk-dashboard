'use client';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, authConfigured } from '@/lib/supabase';
import { safeNext } from '@/lib/auth-utils.mjs';
import { useAuth } from '@/components/AuthProvider';
import { AuthFrame } from './AuthFrame';
import { useV2Copy } from './copy';

type Mode = 'login' | 'register' | 'forgot' | 'reset';
export function AuthForm({ mode }: { mode: Mode }) {
  const { c, errorText } = useV2Copy(); const router = useRouter(); const auth = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  const [next, setNext] = useState('/dashboard');
  useEffect(() => { const params = new URLSearchParams(window.location.search); setNext(safeNext(params.get('next'))); if (params.has('error')) setError('CALLBACK_FAILED'); }, []);
  useEffect(() => { if ((mode === 'login' || mode === 'register') && auth.account && !busy && !done) router.replace(next); }, [auth.account, mode, next, router, busy, done]);
  async function google() {
    if (busy || !supabase) return;
    setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: 'select_account' } } });
      if (error) throw error;
    } catch (e) { setError(errorText(e)); setBusy(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy || !supabase) return;
    setError('');
    if ((mode === 'register' || mode === 'reset') && password !== confirm) { setError(c('mismatch')); return; }
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace(next);
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
        if (error) throw error;
        if (data.session) router.replace(next); else { setDone(true); setPassword(''); setConfirm(''); }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error && error.code !== 'user_not_found') throw error;
        setDone(true);
      } else {
        const session = await supabase.auth.getSession();
        if (!session.data.session) { setError(errorText('SESSION_INVALID')); return; }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword(''); setConfirm(''); setDone(true);
      }
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  const title = c(mode === 'login' ? 'login' : mode === 'register' ? 'signup' : 'reset');
  const subtitle = mode === 'login' ? c('loginSub') : mode === 'register' ? c('signupSub') : undefined;
  const disabled = busy || !authConfigured;
  return <AuthFrame title={title} subtitle={subtitle}>
    {!authConfigured && <div className="account-alert error" role="alert">{errorText('AUTH_NOT_CONFIGURED')}</div>}
    {error && <div className="account-alert error" role="alert">{error === 'CALLBACK_FAILED' ? errorText(error) : error}</div>}
    {done ? <div className="account-confirmation" role="status"><h2>{c(mode === 'reset' ? 'saved' : 'checkEmail')}</h2><p>{c(mode === 'register' ? 'confirmEmail' : mode === 'forgot' ? 'resetSent' : 'passwordChanged')}</p><Link className="btn primary" href={mode === 'reset' ? '/dashboard' : '/login'}>{c(mode === 'reset' ? 'continue' : 'backLogin')}</Link></div> : <>
      {(mode === 'login' || mode === 'register') && <><button type="button" className="account-google" disabled={disabled} onClick={google}>{c('google')}</button><div className="account-divider">{c('or')}</div></>}
      <form onSubmit={submit} className="account-form">
        {mode === 'register' && <label>{c('name')}<input autoComplete="name" maxLength={100} required value={name} onChange={e => setName(e.target.value)}/></label>}
        {mode !== 'reset' && <label>{c('email')}<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)}/></label>}
        {mode !== 'forgot' && <label>{c('password')}<div className="password-field"><input type={showPassword?'text':'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 12} maxLength={256} value={password} onChange={e => setPassword(e.target.value)}/><button type="button" className="password-toggle" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>{mode !== 'login' && <small>{c('passwordHint')}</small>}</label>}
        {(mode === 'register' || mode === 'reset') && <label>{c('confirmPassword')}<div className="password-field"><input type={showConfirm?'text':'password'} autoComplete="new-password" required minLength={12} maxLength={256} value={confirm} onChange={e => setConfirm(e.target.value)}/><button type="button" className="password-toggle" aria-label={showConfirm?'Hide password':'Show password'} onClick={()=>setShowConfirm(v=>!v)}>{showConfirm?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>}
        {mode === 'login' && <Link className="account-inline-link" href="/forgot-password">{c('forgot')}</Link>}
        <button className="btn primary account-submit" disabled={disabled} aria-busy={busy}>{busy ? c('working') : c(mode === 'login' ? 'signIn' : mode === 'register' ? 'create' : mode === 'forgot' ? 'sendReset' : 'savePassword')}</button>
      </form>
    </>}
    {mode === 'login' && <><p className="account-switch">{c('noAccount')} <Link href="/register">{c('create')}</Link></p><Link className="account-demo-link" href="/try">{c('trial')}</Link></>}
    {mode === 'register' && <p className="account-switch">{c('haveAccount')} <Link href="/login">{c('signIn')}</Link></p>}
    {(mode === 'forgot' || mode === 'reset') && <Link className="account-demo-link" href="/login">{c('backLogin')}</Link>}
  </AuthFrame>;
}
