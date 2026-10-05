export function isAllowedOrigin(origin, configuredOrigins = []) {
  if (!origin) return true;
  const origins = configuredOrigins.map((x) => String(x).trim()).filter(Boolean);
  if (origins.includes(origin)) return true;
  if (origin === 'https://datatalk-dashboard-qli5.vercel.app') return true;
  if (origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000') return true;
  return false;
}
