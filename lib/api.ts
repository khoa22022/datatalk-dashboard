import { supabase } from "./supabase";

const API = process.env.NEXT_PUBLIC_API_URL || "https://datatalk-api-h4a1.onrender.com";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  const response = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try { const body = await response.json(); message = body?.error || body?.message || message; } catch {}
    throw new Error(message);
  }
  return response.json();
}

export { API };
