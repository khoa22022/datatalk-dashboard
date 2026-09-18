import { buildTrialHeaders, requestWithRetry } from './trial-transport.mjs';

export const TRIAL_API = (process.env.NEXT_PUBLIC_API_URL || 'https://datatalk-api-h4a1.onrender.com').replace(/\/$/, '');

export type TrialEvent = {
  event: string;
  page?: string;
  session_id?: string;
  visitor_id?: string;
  element?: string;
  element_text?: string;
  metadata?: Record<string, unknown>;
};

let warmPromise: Promise<void> | null = null;

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!response.ok) throw new Error(body || `Request failed: ${response.status}`);
  try { return JSON.parse(body) as T; }
  catch { throw new Error('Backend returned an invalid JSON response'); }
}

export async function warmTrialBackend(onStatus?: (message: string) => void) {
  if (warmPromise) return warmPromise;
  warmPromise = (async () => {
    onStatus?.('Connecting to Datatalk backend…');
    const response = await requestWithRetry(`${TRIAL_API}/health/ready`, {
      attempts: 5,
      delayMs: 1200,
      timeoutMs: 15000,
    });
    if (!response.ok) throw new Error(`Backend health check failed: ${response.status}`);
    onStatus?.('Backend ready');
  })().catch((error) => {
    warmPromise = null;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Backend is still waking up. Please try again in a few seconds.');
    }
    throw error;
  });
  return warmPromise;
}

export async function trialRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${TRIAL_API}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(url, {
      ...options,
      headers: buildTrialHeaders(options),
      cache: 'no-store',
      signal: controller.signal,
    });
    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Backend request timed out after 45 seconds. The service may still be waking up.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendTrialEvent(event: TrialEvent) {
  return trialRequest<{ success: boolean; event_id: string }>('/api/try/event', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}
