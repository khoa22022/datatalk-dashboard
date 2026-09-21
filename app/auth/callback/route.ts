import { NextResponse } from 'next/server';
import { safeNext } from '@/lib/auth-utils.mjs';
export const dynamic = 'force-dynamic';
/** The browser holds the PKCE verifier. Pass only the auth code to our client callback page. */
export async function GET(request: Request) {
  const source = new URL(request.url);
  const target = new URL('/auth/complete', source.origin);
  const code = source.searchParams.get('code');
  if (code && code.length <= 4096 && !source.searchParams.has('error')) target.searchParams.set('code', code);
  else target.searchParams.set('error', 'callback_failed');
  target.searchParams.set('next', safeNext(source.searchParams.get('next')));
  const response = NextResponse.redirect(target);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
