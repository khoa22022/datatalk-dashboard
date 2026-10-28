export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function parseApiTimestamp(value?: string | null): Date | null {
  if (!value) return null;
  let text = String(value).trim();
  // Older API/Supabase rows may arrive as ISO-like timestamps without Z/offset.
  // Database timestamps are UTC; never let the browser reinterpret them as local time.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)) text += 'Z';
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatVietnamDateTime(value?: string | null, locale: 'vi-VN' | 'en-US' = 'vi-VN') {
  const date = parseApiTimestamp(value);
  if (!date) return null;
  return date.toLocaleString(locale, {
    timeZone: VIETNAM_TIME_ZONE,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}
