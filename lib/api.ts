'use client';
import { supabase } from './supabase';
export const API = (process.env.NEXT_PUBLIC_API_URL || 'https://datatalk-api-h4a1.onrender.com').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); this.name = 'ApiError'; }
}
type ApiOptions = RequestInit & { accessToken?: string; publicRequest?: boolean };
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!path.startsWith('/api/') || path.includes('://')) throw new ApiError(400, 'INVALID_API_PATH');
  const { accessToken, publicRequest = false, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!publicRequest) {
    const token = accessToken || (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!token) throw new ApiError(401, 'AUTH_REQUIRED');
    headers.set('Authorization', `Bearer ${token}`);
  }
  // Do not retry mutations: a timeout does not prove the server did not commit them.
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(cancel, 65000); // Free-instance cold starts may be slow.
  try {
    const response = await fetch(`${API}${path}`, { ...init, headers, credentials: 'omit', cache: 'no-store', signal: controller.signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, payload?.code || payload?.error || 'REQUEST_FAILED');
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError(408, 'REQUEST_TIMEOUT');
    throw new ApiError(0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout); init.signal?.removeEventListener('abort', cancel);
  }
}
