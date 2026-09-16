export const TRIAL_API = process.env.NEXT_PUBLIC_API_URL || "https://datatalk-api-h4a1.onrender.com";

export type TrialEvent = {
  event: string;
  page?: string;
  session_id?: string;
  visitor_id?: string;
  element?: string;
  element_text?: string;
  metadata?: Record<string, unknown>;
};

const TRIAL_ACTIONS = new Set(["bootstrap", "summary", "event", "seed", "reset", "feedback"]);

export async function trialRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isTrial = path.startsWith("/api/try/");
  const action = path.slice("/api/try/".length).split("?")[0];
  const url = isTrial && TRIAL_ACTIONS.has(action) ? path : `${TRIAL_API}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function sendTrialEvent(event: TrialEvent) {
  return trialRequest<{ success: boolean; event_id: string }>("/api/try/event", {
    method: "POST",
    body: JSON.stringify(event),
  });
}
