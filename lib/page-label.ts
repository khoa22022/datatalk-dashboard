export type PageIdentityLike = {
  page?: string | null;
  pagePath?: string | null;
  pageName?: string | null;
  pageTitle?: string | null;
  pageUrl?: string | null;
};

export function pagePathOf(page: PageIdentityLike | string | null | undefined) {
  if (typeof page === 'string') return cleanPath(page);
  return cleanPath(page?.pagePath || page?.page || '/');
}

function cleanPath(value: string) {
  const raw = String(value || '/').split('?')[0].split('#')[0] || '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function meaningful(value: string | null | undefined, path: string) {
  const text = String(value || '').trim();
  if (!text || text === '/' || text === path) return '';
  if (/^(untitled|home page|page)$/i.test(text)) return '';
  return text;
}

function prettifySegment(segment: string) {
  let value = segment;
  try { value = decodeURIComponent(segment); } catch {}
  if (/^[0-9a-f]{8,}$/i.test(value) || /^\d+$/.test(value)) return value;
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function pageDisplayName(page: PageIdentityLike | string | null | undefined, lang: 'en' | 'vi' = 'en') {
  const path = pagePathOf(page);
  if (typeof page !== 'string' && page) {
    const direct = meaningful(page.pageName, path) || meaningful(page.pageTitle, path);
    if (direct) return direct;
  }
  if (path === '/') return lang === 'vi' ? 'Trang chủ' : 'Home';
  const segments = path.split('/').filter(Boolean);
  if (!segments.length) return lang === 'vi' ? 'Trang chủ' : 'Home';
  const readable = segments.slice(-2).map(prettifySegment).join(' / ');
  return readable || path;
}

export function pageSecondaryText(page: PageIdentityLike | string | null | undefined) {
  return pagePathOf(page);
}
