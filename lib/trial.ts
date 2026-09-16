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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      cache: "no-store",
      signal: controller.signal,
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(body || `Request failed: ${response.status}`);
    }

    try { return JSON.parse(body) as T; }
    catch { throw new Error("Backend returned an invalid JSON response"); }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Backend request timed out after 20 seconds. The Render free instance may be waking up.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendTrialEvent(event: TrialEvent) {
  return trialRequest<{ success: boolean; event_id: string }>("/api/try/event", {
    method: "POST",
    body: JSON.stringify(event),
  });
}
