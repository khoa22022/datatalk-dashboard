import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { createAuthService } from './v2/auth.js';
import { registerAccountRoutes } from './v2/routes.js';
import { ApiError } from './v2/access.js';
import { normalizeTrialEvent, aggregateTrialEvents, buildTrialScenario } from './trial.js';
import { isAllowedOrigin } from './cors-policy.js';
import { pageIdentity, uxHealth, pageAnalytics, elementAnalytics, buildSessionJourneys, taskAnalytics, funnelAnalytics } from './v2/analytics-v22.js';
import { buildSdk } from './v2/sdk-v22.js';
import { firstRow, requireFirstRow, TRIAL_TRACKING_KEY } from './trial-bootstrap.js';

dotenv.config();
export async function buildApp({ database, env = process.env, logger = true } = {}) {
  if (!database && (!env.SUPABASE_URL || !(env.SUPABASE_SERVICE_KEY || env.SUPABASE_SECRET_KEY))) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SECRET_KEY) on the server.');
  }
  const app = Fastify({ logger: logger ? { redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'] } : false, trustProxy: env.NODE_ENV === 'production' ? Number(env.TRUST_PROXY_HOPS || 1) : false, bodyLimit: 65536 });
  const supabase = database || createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  app.decorateRequest('user', null);
  app.decorateRequest('authUser', null);
  const auth = createAuthService(supabase);
  const { requireUser, projectForUser } = auth;
  const VERSION = '2.2.0-rc.2';
  const now = () => new Date().toISOString();
  const allowedOrigins = (env.CORS_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
const finiteNumber = (value, fallback = null) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const durationMs = (value) => Math.min(Math.max(finiteNumber(value, 0), 0), 300000);
const geoFromRequest = (request) => ({
  country: request.headers['x-vercel-ip-country'] || request.headers['cf-ipcountry'] || request.headers['cloudfront-viewer-country'] || null,
  city: request.headers['x-vercel-ip-city'] ? decodeURIComponent(String(request.headers['x-vercel-ip-city'])) : null,
  region: request.headers['x-vercel-ip-country-region'] || request.headers['cf-region'] || null,
  timezone: request.headers['x-vercel-ip-timezone'] || null
});
const ipHashFromRequest = (request) => {
  const ip = String(request.ip || '').trim();
  if (!ip) return null;
  const salt = env.IP_HASH_SALT || env.SUPABASE_URL || 'datatalk';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
};
const isoOrNull = (value) => { if (!value) return null; const d = new Date(String(value)); return Number.isNaN(d.getTime()) ? null : d.toISOString(); };
function analyticsRange(query = {}) {
  const to = isoOrNull(query.to) ? new Date(isoOrNull(query.to)) : new Date();
  const fromExplicit = isoOrNull(query.from);
  const days = Math.min(Math.max(Math.round(finiteNumber(query.days, 30)), 1), 366);
  const from = fromExplicit ? new Date(fromExplicit) : new Date(to.getTime() - (days - 1) * 86400000);
  from.setHours(0,0,0,0); to.setHours(23,59,59,999);
  const span = to.getTime() - from.getTime() + 1;
  const compare = String(query.compare || 'previous');
  let previousFrom = new Date(from.getTime() - span), previousTo = new Date(from.getTime() - 1);
  if (compare === 'yesterday') { previousTo = new Date(from); previousTo.setDate(previousTo.getDate() - 1); previousTo.setHours(23,59,59,999); previousFrom = new Date(previousTo); previousFrom.setHours(0,0,0,0); }
  return { from, to, previousFrom, previousTo, compare };
}

await app.register(cors, () => (request, cb) => {
  const path = request.url.split('?')[0];
  const collector = ['/api/track/event', '/api/track/feedback', '/api/track/verify', '/api/track/surveys', '/sdk/datatalk.js'].includes(path);
  cb(null, {
    origin: collector ? '*' : isAllowedOrigin(request.headers.origin, allowedOrigins),
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], maxAge: 600
  });
});
await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });
app.addHook('onRequest', async (request, reply) => {
  const path = request.url.split('?')[0];
  if (path.startsWith('/api/')) reply.header('Cache-Control', 'no-store');
  if (path.startsWith('/api/try/')) {
    if (env.ENABLE_TRIAL_SANDBOX !== 'true') throw new ApiError(404, 'TRIAL_DISABLED');
    await requireUser(request);
    await auth.requireSuperAdmin(request);
  }
});
registerAccountRoutes(app, supabase, auth);

async function projectForKey(key, origin) {
  if (!key) return null;
  const { data, error } = await supabase.from('projects')
    .select('id,name,tracking_key,platform,domain,workspace_id,business_goal')
    .eq('tracking_key', key).maybeSingle();
  if (error) throw error;
  if (!data || data.tracking_key === TRIAL_TRACKING_KEY || data.platform === 'Trial Sandbox') return null;
  if (origin && data.domain && ['Website', 'Web App', 'Figma Site'].includes(data.platform)) {
    try {
      const expected = new URL(data.domain.includes('://') ? data.domain : `https://${data.domain}`).origin;
      if (new URL(origin).origin !== expected) return null;
    } catch { return null; }
  }
  return data;
}

async function projectEvents(projectId, limit = 10000, { includeSetup = false } = {}) {
  const result = await supabase.from('events')
    .select('id,event,visitor_id,session_id,page,element,element_text,metadata,created_at')
    .eq('project_id', projectId).order('created_at', { ascending: false }).limit(Math.min(limit, 10000));
  if (result.error) throw result.error;
  const rows = result.data || [];
  return includeSetup ? rows : rows.filter((row) => !row.metadata?.funnel_recording_token);
}

async function projectEventsBetween(projectId, fromIso, toIso, limit = 5000, { includeSetup = false } = {}) {
  let query = supabase.from('events')
    .select('id,event,visitor_id,session_id,page,element,element_text,metadata,created_at')
    .eq('project_id', projectId)
    .gte('created_at', fromIso)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 5000));
  if (toIso) query = query.lt('created_at', toIso);
  const result = await query;
  if (result.error) throw result.error;
  const rows = result.data || [];
  return includeSetup ? rows : rows.filter((row) => !row.metadata?.funnel_recording_token);
}

function aggregateOverview(events) {
  const visitors = new Set(events.map((x) => x.visitor_id).filter(Boolean)).size;
  const sessions = new Set(events.map((x) => x.session_id).filter(Boolean)).size;
  const pageViews = events.filter((x) => x.event === 'page_view').length;
  const clicks = events.filter((x) => x.event === 'click').length;
  const rageClicks = events.filter((x) => x.event === 'rage_click').length;
  const deadClicks = events.filter((x) => x.event === 'dead_click').length;
  const scrolls = events.filter((x) => x.event === 'scroll').length;
  const activeTimeMs = events.filter((x) => x.event === 'page_heartbeat').reduce((sum, x) => sum + durationMs(x.metadata?.duration_ms), 0);
  const sectionAttentionMs = events.filter((x) => ['section_exit', 'section_heartbeat'].includes(x.event)).reduce((sum, x) => sum + durationMs(x.metadata?.duration_ms), 0);
  const taskStarts = events.filter((x) => x.event === 'task_start').length;
  const taskCompletions = events.filter((x) => x.event === 'task_complete').length;
  return {
    visitors, sessions, pageViews, clicks, rageClicks, deadClicks, scrolls,
    activeTimeMs, sectionAttentionMs, taskStarts, taskCompletions,
    taskSuccessRate: taskStarts ? Math.round((taskCompletions / taskStarts) * 1000) / 10 : null
  };
}

function groupPages(events) {
  return pageAnalytics(events).map((row) => ({
    page: row.pagePath,
    pagePath: row.pagePath,
    pageName: row.pageName,
    pageTitle: row.pageTitle,
    pageUrl: row.pageUrl,
    views: row.views,
    activeTimeMs: row.activeTimeMs,
    dwellTimeMs: row.dwellTimeMs,
    clicks: row.clicks,
    rageClicks: row.rageClicks,
    deadClicks: row.deadClicks,
    scrollMax: row.scrollMax
  }));
}

function groupSections(events) {
  const sections = new Map();
  for (const event of events) {
    const section = event.metadata?.section;
    if (!section) continue;
    const key = `${event.page || '/'}::${section}`;
    const row = sections.get(key) || { page: event.page || '/', section, views: 0, attentionMs: 0, clicks: 0, rageClicks: 0, deadClicks: 0 };
    if (event.event === 'section_view') row.views += 1;
    if (['section_exit', 'section_heartbeat'].includes(event.event)) row.attentionMs += durationMs(event.metadata?.duration_ms);
    if (event.event === 'click') row.clicks += 1;
    if (event.event === 'rage_click') row.rageClicks += 1;
    if (event.event === 'dead_click') row.deadClicks += 1;
    sections.set(key, row);
  }
  return [...sections.values()].sort((a, b) => b.attentionMs - a.attentionMs);
}

function groupTasks(events) {
  const tasks = new Map();
  const starts = new Map();
  const lastStep = new Map();
  for (const event of [...events].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))) {
    const name = event.metadata?.task;
    if (!name) continue;
    const row = tasks.get(name) || { task: name, starts: 0, steps: 0, errors: 0, completes: 0, backtracks: 0, completionTimeMs: [], stepTimeMs: 0 };
    if (event.event === 'task_start') { row.starts += 1; starts.set(`${event.session_id || ''}:${name}`, new Date(event.created_at).getTime()); }
    if (event.event === 'task_step') {
      row.steps += 1;
      row.stepTimeMs += durationMs(event.metadata?.duration_ms);
      lastStep.set(`${event.session_id || ''}:${name}`, new Date(event.created_at).getTime());
    }
    if (event.event === 'task_error') row.errors += 1;
    if (event.event === 'task_backtrack') row.backtracks += 1;
    if (event.event === 'task_complete') {
      row.completes += 1;
      const start = starts.get(`${event.session_id || ''}:${name}`);
      if (start) row.completionTimeMs.push(Math.max(0, new Date(event.created_at).getTime() - start));
    }
    tasks.set(name, row);
  }
  return [...tasks.values()].map((row) => ({
    ...row,
    completionRate: row.starts ? Math.round((row.completes / row.starts) * 1000) / 10 : 0,
    successRate: row.starts ? Math.round((row.completes / row.starts) * 1000) / 10 : 0,
    medianCompletionTimeMs: row.completionTimeMs.length ? median(row.completionTimeMs) : 0,
    completionTimeMs: undefined
  }));
}


function bucketTrend(events, days, periodEnd = new Date()) {
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);
  const buckets = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    buckets.push({ date: key, visitors: new Set(), sessions: new Set(), pageViews: 0, activeTimeMs: 0, clicks: 0, frictionEvents: 0 });
  }
  const byDate = new Map(buckets.map((row) => [row.date, row]));
  for (const event of events) {
    const key = String(event.created_at || '').slice(0, 10);
    const row = byDate.get(key);
    if (!row) continue;
    if (event.visitor_id) row.visitors.add(event.visitor_id);
    if (event.session_id) row.sessions.add(event.session_id);
    if (event.event === 'page_view') row.pageViews += 1;
    if (event.event === 'page_heartbeat') row.activeTimeMs += durationMs(event.metadata?.duration_ms);
    if (event.event === 'click') row.clicks += 1;
    if (['rage_click', 'dead_click'].includes(event.event)) row.frictionEvents += 1;
  }
  return buckets.map((row) => ({ ...row, visitors: row.visitors.size, sessions: row.sessions.size }));
}

function deviceMix(events) {
  const bySession = new Map();
  for (const event of [...events].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))) {
    if (!event.session_id || bySession.has(event.session_id)) continue;
    const raw = String(event.metadata?.device || '').toLowerCase();
    const device = ['mobile', 'tablet', 'desktop'].includes(raw) ? raw : 'unknown';
    bySession.set(event.session_id, device);
  }
  const counts = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
  for (const device of bySession.values()) counts[device] += 1;
  const total = bySession.size;
  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    percentage: total ? Math.round((count / total) * 1000) / 10 : null
  }));
}

function percentChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dashboardComparison(current, previous) {
  return {
    visitors: percentChange(current.visitors, previous.visitors),
    sessions: percentChange(current.sessions, previous.sessions),
    pageViews: percentChange(current.pageViews, previous.pageViews),
    activeTimeMs: percentChange(current.activeTimeMs, previous.activeTimeMs),
    taskSuccessRate: current.taskSuccessRate == null || previous.taskSuccessRate == null ? null : Math.round((current.taskSuccessRate - previous.taskSuccessRate) * 10) / 10
  };
}

function dashboardSignals(overview, pages, sections) {
  const signals = [];
  const frictionPage = pages.find((page) => page.rageClicks > 0 || page.deadClicks > 0);
  if (frictionPage) signals.push({
    type: 'friction',
    severity: frictionPage.rageClicks >= 3 ? 'HIGH' : 'MEDIUM',
    page: frictionPage.page,
    rageClicks: frictionPage.rageClicks,
    deadClicks: frictionPage.deadClicks,
    activeTimeMs: frictionPage.activeTimeMs
  });
  const attentionSection = sections.find((section) => section.attentionMs > 0);
  if (attentionSection) signals.push({
    type: 'attention',
    severity: 'MEDIUM',
    page: attentionSection.page,
    section: attentionSection.section,
    attentionMs: attentionSection.attentionMs,
    clicks: attentionSection.clicks
  });
  if (overview.taskSuccessRate !== null && overview.taskSuccessRate < 70) signals.push({
    type: 'task', severity: 'HIGH', taskSuccessRate: overview.taskSuccessRate
  });
  return signals.slice(0, 3);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

app.get('/', async () => ({ name: 'Datatalk API', version: VERSION, status: 'running', modules: ['auth', 'projects', 'tracking', 'analytics', 'attention', 'tasks', 'feedback', 'heatmaps'] }));
app.get('/health', async () => ({ ok: true, time: now(), version: VERSION }));
app.get('/health/ready', async (_request, reply) => {
  try {
    const result = await supabase.from('workspace_invitations').select('id').limit(1);
    if (result.error) throw result.error;
    return { ok: true, ready: true, version: VERSION };
  } catch {
    return reply.code(503).send({ ok: false, ready: false, error: 'DATABASE_OR_V2_SCHEMA_UNAVAILABLE' });
  }
});


let trialProjectCache = null;
let trialProjectPromise = null;
async function ensureTrialProject() {
  if (trialProjectCache) return trialProjectCache;
  if (trialProjectPromise) return trialProjectPromise;

  trialProjectPromise = (async () => {
    const ownerId = env.SUPER_ADMIN_USER_ID;
    if (!ownerId) throw new ApiError(503, 'TRIAL_OWNER_NOT_CONFIGURED');
    const userResult = await supabase.from('users').select('id,name,email')
      .eq('id', ownerId).eq('role', 'SUPER_ADMIN').eq('status', 'ACTIVE').limit(1);
    const user = firstRow(userResult);
    if (!user) {
      throw Object.assign(new Error('Trial sandbox requires the configured super admin user'), { statusCode: 503 });
    }

    const workspaceResult = await supabase.from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .eq('name', 'Datatalk Trial Workspace')
      .is('personal_owner_id', null)
      .order('created_at', { ascending: true })
      .limit(1);
    let workspace = firstRow(workspaceResult);

    if (!workspace) {
      const insertedWorkspace = await supabase.from('workspaces')
        .insert({ name: 'Datatalk Trial Workspace', owner_id: user.id })
        .select('*');
      workspace = requireFirstRow(insertedWorkspace, 'Trial workspace insert');
    }

    // Repair membership even when the workspace came from an older partial bootstrap.
    const membership = await supabase.from('workspace_members').upsert(
      { workspace_id: workspace.id, user_id: user.id, role: 'OWNER' },
      { onConflict: 'workspace_id,user_id' }
    );
    if (membership.error) throw membership.error;

    // Prefer the deterministic tracking key. This makes bootstrap idempotent even if
    // two server instances attempt to create the sandbox concurrently.
    let projectResult = await supabase.from('projects')
      .select('*')
      .eq('tracking_key', TRIAL_TRACKING_KEY)
      .order('created_at', { ascending: true })
      .limit(1);
    let project = firstRow(projectResult);

    // Adopt an older random-key trial project rather than creating another duplicate.
    if (!project) {
      projectResult = await supabase.from('projects')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('name', 'Datatalk Trial Sandbox')
        .order('created_at', { ascending: true })
        .limit(1);
      project = firstRow(projectResult);
    }

    if (!project) {
      const insertedProject = await supabase.from('projects').insert({
        workspace_id: workspace.id,
        name: 'Datatalk Trial Sandbox',
        domain: 'trial.local',
        platform: 'Trial Sandbox',
        business_goal: 'Internal UX tracking sandbox for Datatalk product review',
        tracking_key: TRIAL_TRACKING_KEY
      }).select('*');

      if (insertedProject.error?.code === '23505') {
        const concurrentProject = await supabase.from('projects')
          .select('*')
          .eq('tracking_key', TRIAL_TRACKING_KEY)
          .order('created_at', { ascending: true })
          .limit(1);
        project = requireFirstRow(concurrentProject, 'Concurrent trial project lookup');
      } else {
        project = requireFirstRow(insertedProject, 'Trial project insert');
      }
    }

    trialProjectCache = project;
    return project;
  })();

  try {
    return await trialProjectPromise;
  } finally {
    trialProjectPromise = null;
  }
}

async function trialEvents(limit = 5000) {
  const project = await ensureTrialProject();
  const result = await supabase.from('events').select('id,event,visitor_id,session_id,page,element,element_text,metadata,created_at').eq('project_id', project.id).order('created_at', { ascending: false }).limit(Math.min(limit, 1000));
  if (result.error) throw result.error;
  return { project, events: result.data || [] };
}

app.get('/api/try/bootstrap', async () => {
  const project = await ensureTrialProject();
  return { mode: 'trial', project_id: project.id, project_name: project.name, tracking_enabled: true };
});

app.post('/api/try/event', async (request, reply) => {
  const event = normalizeTrialEvent(request.body || {});
  if (!event.event) return reply.code(400).send({ error: 'event is required' });
  const project = await ensureTrialProject();
  const insertedResult = await supabase.from('events').insert({
    project_id: project.id,
    visitor_id: event.visitor_id || `trial_visitor_${crypto.randomUUID()}`,
    session_id: event.session_id || `trial_session_${crypto.randomUUID()}`,
    event: event.event,
    page: event.page,
    element: event.element,
    element_text: event.element_text,
    metadata: { ...event.metadata, trial: true }
  }).select('id,created_at');
  const inserted = requireFirstRow(insertedResult, 'Trial event insert');

  const sessionId = event.session_id;
  if (event.event === 'session_start' && sessionId) {
    const session = await supabase.from('sessions').upsert({ project_id: project.id, visitor_id: event.visitor_id, session_key: sessionId, device: event.metadata.device || null, browser: event.metadata.browser || null, country: event.metadata.country || null, city: event.metadata.city || null, last_seen_at: now() }, { onConflict: 'project_id,session_key' });
    if (session.error) throw session.error;
  } else if (sessionId) {
    const update = { last_seen_at: now() };
    if (event.event === 'session_end') update.ended_at = now();
    await supabase.from('sessions').update(update).eq('project_id', project.id).eq('session_key', sessionId);
  }

  if (['click', 'rage_click', 'dead_click'].includes(event.event)) {
    const heatmap = await supabase.from('heatmap_events').insert({
      project_id: project.id,
      session_id: sessionId,
      event_type: event.event,
      x: finiteNumber(event.metadata.x),
      y: finiteNumber(event.metadata.y),
      viewport_width: finiteNumber(event.metadata.viewport_width),
      viewport_height: finiteNumber(event.metadata.viewport_height),
      page: event.page,
      element: event.element
    });
    if (heatmap.error) throw heatmap.error;
  }
  return { success: true, event_id: inserted.id, created_at: inserted.created_at };
});

app.post('/api/try/feedback', async (request, reply) => {
  const body = request.body || {};
  const project = await ensureTrialProject();
  if (!body.feedback) return reply.code(400).send({ error: 'feedback is required' });
  const result = await supabase.from('feedback').insert({ project_id: project.id, session_id: body.session_id || null, page: body.page || null, survey_type: body.survey_type || 'custom', score: body.score ?? null, feedback: String(body.feedback).slice(0, 4000), metadata: { ...(body.metadata || {}), trial: true } }).select('*');
  return requireFirstRow(result, 'Trial feedback insert');
});

app.post('/api/try/seed', async () => {
  const project = await ensureTrialProject();
  const visitor = `trial_seed_visitor_${Date.now()}`;
  const session = `trial_seed_session_${Date.now()}`;
  const scenario = buildTrialScenario({ visitor, session });
  const events = scenario.events.map((x) => ({ ...x, project_id: project.id }));
  const inserted = await supabase.from('events').insert(events).select('id');
  if (inserted.error) throw inserted.error;

  const heatmap = scenario.heatmap.map((x) => ({ ...x, project_id: project.id }));
  if (heatmap.length) {
    const result = await supabase.from('heatmap_events').insert(heatmap);
    if (result.error) throw result.error;
  }

  const sessionResult = await supabase.from('sessions').upsert({ ...scenario.session, project_id: project.id }, { onConflict:'project_id,session_key' });
  if (sessionResult.error) throw sessionResult.error;

  return { success: true, seeded_events: events.length, heatmap_events: heatmap.length, project_id: project.id, session_id: session };
});

app.post('/api/try/reset', async () => {
  const project = await ensureTrialProject();
  const events = await supabase.from('events').delete().eq('project_id', project.id);
  if (events.error) throw events.error;
  const heatmaps = await supabase.from('heatmap_events').delete().eq('project_id', project.id);
  if (heatmaps.error) throw heatmaps.error;
  const feedback = await supabase.from('feedback').delete().eq('project_id', project.id);
  if (feedback.error) throw feedback.error;
  const sessions = await supabase.from('sessions').delete().eq('project_id', project.id);
  if (sessions.error) throw sessions.error;
  return { success:true, project_id:project.id };
});

app.get('/api/try/summary', async () => {
  const { project, events } = await trialEvents();
  return { project_id:project.id, ...aggregateTrialEvents(events), event_count:events.length };
});

app.get('/api/track/verify', async (request, reply) => {
  const project = await projectForKey(request.query?.tracking_key, request.headers.origin);
  if (!project) return reply.code(404).send({ connected: false, error: 'Tracking key not found' });
  return { valid: true }; // Key validity is not evidence of collected events.
});

app.get('/sdk/datatalk.js', async (request, reply) => {
  const apiBase = env.PUBLIC_API_URL || `https://${request.hostname}`;
  reply.type('application/javascript; charset=utf-8').header('Cache-Control', 'public, max-age=120');
  return buildSdk(apiBase);
});

app.post('/api/track/event', async (request, reply) => {
  const body = request.body || {};
  if (!body.tracking_key || !body.event) return reply.code(400).send({ error: 'tracking_key and event are required' });
  const project = await projectForKey(body.tracking_key, request.headers.origin);
  if (!project) return reply.code(404).send({ error: 'Invalid tracking key' });
  const metadata = { ...geoFromRequest(request), ...(body.metadata || {}) };
  const event = String(body.event).slice(0, 80);
  const row = {
    project_id: project.id,
    visitor_id: body.visitor_id || null,
    session_id: body.session_id || null,
    event,
    page: body.page || null,
    element: body.element || null,
    element_text: body.element_text || null,
    metadata
  };
  const inserted = await supabase.from('events').insert(row).select('id').single();
  if (inserted.error) throw inserted.error;

  if (event === 'session_start' && body.session_id) {
    const session = await supabase.from('sessions').upsert({
      project_id: project.id, visitor_id: body.visitor_id || null, session_key: body.session_id,
      device: metadata.device || null, browser: metadata.browser || null, os: metadata.os || null,
      country: metadata.country || null, city: metadata.city || null, region: metadata.region || null, timezone: metadata.timezone || null, ip_hash: ipHashFromRequest(request), last_seen_at: now()
    }, { onConflict: 'project_id,session_key' });
    if (session.error) throw session.error;
  } else if (body.session_id) {
    const update = { last_seen_at: now() };
    if (event === 'session_end') update.ended_at = now();
    await supabase.from('sessions').update(update).eq('project_id', project.id).eq('session_key', body.session_id);
  }

  if (['click', 'rage_click', 'dead_click'].includes(event)) {
    const heatmap = await supabase.from('heatmap_events').insert({
      project_id: project.id, session_id: body.session_id || null, event_type: event,
      x: finiteNumber(metadata.x), y: finiteNumber(metadata.y),
      viewport_width: finiteNumber(metadata.viewport_width), viewport_height: finiteNumber(metadata.viewport_height),
      page: body.page || null, element: body.element || null
    });
    if (heatmap.error) throw heatmap.error;
  }
  return { success: true, event_id: inserted.data.id };
});

app.post('/api/track/feedback', async (request, reply) => {
  const body = request.body || {};
  if (!body.tracking_key || !body.feedback) return reply.code(400).send({ error: 'tracking_key and feedback are required' });
  const project = await projectForKey(body.tracking_key, request.headers.origin);
  if (!project) return reply.code(404).send({ error: 'Invalid tracking key' });
  const result = await supabase.from('feedback').insert({
    project_id: project.id, session_id: body.session_id || null, page: body.page || null,
    survey_type: body.survey_type || 'custom', score: body.score ?? null,
    feedback: String(body.feedback).slice(0, 4000), metadata: body.metadata || {}
  }).select('*').single();
  if (result.error) throw result.error;
  return result.data;
});

async function authorizedProject(request, reply) {
  const project = await projectForUser(request, request.params.projectId);
  if (!project) { reply.code(404).send({ error: 'Project not found' }); return null; }
  return project;
}

app.get('/api/projects/:projectId/overview', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const events = await projectEvents(request.params.projectId);
  return { project_id: request.params.projectId, ...aggregateOverview(events) };
});

app.get('/api/projects/:projectId/dashboard', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const range = analyticsRange(request.query);
  const days = Math.min(90, Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000) + 1));
  const [currentEventsRaw, previousEventsRaw] = await Promise.all([
    projectEventsBetween(request.params.projectId, range.from.toISOString(), range.to.toISOString()),
    projectEventsBetween(request.params.projectId, range.previousFrom.toISOString(), range.previousTo.toISOString())
  ]);
  const pageFilter = String(request.query?.page || '').trim();
  const deviceFilter = String(request.query?.device || '').trim().toLowerCase();
  const filterEvents = (rows) => rows.filter(e => (!pageFilter || pageIdentity(e).pagePath === pageFilter) && (!deviceFilter || String(e.metadata?.device || '').toLowerCase() === deviceFilter));
  const currentEvents = filterEvents(currentEventsRaw);
  const previousEvents = filterEvents(previousEventsRaw);
  const end = range.to;
  const currentStart = range.from;

  const current = aggregateOverview(currentEvents);
  const previous = aggregateOverview(previousEvents);
  const health = uxHealth(currentEvents);
  const previousHealth = uxHealth(previousEvents);
  const pages = groupPages(currentEvents);
  const pageCatalog = pageAnalytics(currentEventsRaw);
  const sections = groupSections(currentEvents);
  const tasks = groupTasks(currentEvents);
  const frictionEvents = current.rageClicks + current.deadClicks;
  const avgAttentionMs = current.sessions ? Math.round(current.activeTimeMs / current.sessions) : null;
  return {
    project_id: request.params.projectId,
    period: { days, from: currentStart.toISOString(), to: end.toISOString(), compare: range.compare, page: pageFilter || null, device: deviceFilter || null },
    coverage: { currentEvents: currentEvents.length, previousEvents: previousEvents.length },
    overview: { ...current, frictionEvents, avgAttentionMs, uxHealthScore: health.score, uxIssueCount: health.issueCount },
    comparison: { ...dashboardComparison(current, previous), uxHealthScore: previousEvents.length && health.score != null && previousHealth.score != null ? health.score - previousHealth.score : null },
    previousAvailable: previousEvents.length > 0,
    trend: bucketTrend(currentEvents, days, end),
    pages: pages.slice(0, 12),
    pageCatalog: pageCatalog.slice(0, 200),
    sections: sections.slice(0, 12),
    devices: deviceMix(currentEvents),
    tasks: tasks.slice(0, 8),
    signals: dashboardSignals(current, pages, sections)
  };
});

app.get('/api/projects/:projectId/analytics', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const events = await projectEvents(request.params.projectId);
  return { project_id: request.params.projectId, overview: aggregateOverview(events), pages: groupPages(events) };
});

app.get('/api/projects/:projectId/pages', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  return groupPages(await projectEvents(request.params.projectId));
});

app.get('/api/projects/:projectId/sections', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  return groupSections(await projectEvents(request.params.projectId));
});

app.get('/api/projects/:projectId/sessions', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const sessions = await supabase.from('sessions').select('*').eq('project_id', request.params.projectId).order('last_seen_at', { ascending: false }).limit(200);
  if (sessions.error) throw sessions.error;
  const events = await projectEvents(request.params.projectId, 20000);
  return (sessions.data || []).map((session) => {
    const rows = events.filter((event) => event.session_id === session.session_key);
    const start = rows.filter((x) => x.event === 'session_start').at(-1)?.created_at;
    const end = rows.find((x) => x.event === 'session_end')?.created_at;
    const duration = start ? Math.max(0, new Date(end || session.last_seen_at).getTime() - new Date(start).getTime()) : 0;
    return { ...session, durationMs: duration, eventCount: rows.length, pages: [...new Set(rows.map((x) => x.page).filter(Boolean))] };
  });
});

app.get('/api/projects/:projectId/tasks', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  return groupTasks(await projectEvents(request.params.projectId));
});

app.get('/api/projects/:projectId/heatmaps', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const result = await supabase.from('heatmap_events').select('*').eq('project_id', request.params.projectId).order('created_at', { ascending: false }).limit(5000);
  if (result.error) throw result.error;
  const summary = (result.data || []).reduce((acc, event) => { acc[event.event_type] = (acc[event.event_type] || 0) + 1; return acc; }, {});
  return { project_id: request.params.projectId, summary, points: result.data || [] };
});

app.get('/api/projects/:projectId/feedback', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const result = await supabase.from('feedback').select('*').eq('project_id', request.params.projectId).order('created_at', { ascending: false }).limit(500);
  if (result.error) throw result.error;
  const rows = result.data || [];
  const scores = rows.map((x) => finiteNumber(x.score)).filter((x) => x !== null);
  return { responses: rows.length, averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null, feedback: rows };
});


app.get('/api/workspaces/:workspaceId/project-summaries', { preHandler: requireUser }, async (request, reply) => {
  const workspaceId = request.params.workspaceId;
  await auth.membership(request.user.id, workspaceId);
  const projectsResult = await supabase.from('projects').select('*').eq('workspace_id', workspaceId)
    .neq('tracking_key', 'dt_trial_internal_sandbox').neq('platform', 'Trial Sandbox').order('created_at', { ascending: false });
  if (projectsResult.error) throw projectsResult.error;
  const summaries = [];
  for (const project of projectsResult.data || []) {
    const events = await projectEvents(project.id, 1000);
    const overview = aggregateOverview(events);
    const health = uxHealth(events);
    const latest = [...events].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0] || null;
    const setup = await supabase.from('project_setup_status').select('*').eq('project_id', project.id).maybeSingle();
    const step = setup.data?.setup_step || (events.length ? 'active' : 'created');
    const progressMap = { created: 20, configured: 40, installed: 70, verified: 90, active: 100 };
    summaries.push({ ...project, metrics: { users: overview.visitors || 0, sessions: overview.sessions || 0, uxHealthScore: health.score, issueCount: health.issueCount, lastEventAt: latest?.created_at || null, connected: events.length > 0, setupProgress: progressMap[step] || 20 } });
  }
  return summaries;
});

app.get('/api/projects/:projectId/analytics-v2', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const range = analyticsRange(request.query);
  const [events, previous] = await Promise.all([
    projectEventsBetween(request.params.projectId, range.from.toISOString(), range.to.toISOString()),
    projectEventsBetween(request.params.projectId, range.previousFrom.toISOString(), range.previousTo.toISOString())
  ]);
  const requestedPage = String(request.query?.page || '').trim();
  const requestedDevice = String(request.query?.device || '').trim().toLowerCase();
  const applyFilters = (rows) => rows.filter((e) => (!requestedPage || pageIdentity(e).pagePath === requestedPage) && (!requestedDevice || String(e.metadata?.device || '').toLowerCase() === requestedDevice));
  const filtered = applyFilters(events);
  const previousFiltered = applyFilters(previous);
  const overview = aggregateOverview(filtered), previousOverview = aggregateOverview(previousFiltered);
  const pageCatalog = pageAnalytics(events);
  const pages = pageAnalytics(filtered);
  const pageViews = overview.pageViews;
  const bounceSessions = new Map();
  for (const event of filtered.filter(e => e.session_id)) {
    const row = bounceSessions.get(event.session_id) || { pages: new Set(), meaningful: false };
    if (event.event === 'page_view') row.pages.add(pageIdentity(event).pagePath);
    if (['click','task_start','task_complete','feedback_submit'].includes(event.event)) row.meaningful = true;
    bounceSessions.set(event.session_id, row);
  }
  const bounced = [...bounceSessions.values()].filter(x => x.pages.size <= 1 && !x.meaningful).length;
  return {
    project_id: request.params.projectId,
    period: { from: range.from.toISOString(), to: range.to.toISOString(), compare: range.compare },
    page: requestedPage || null,
    device: requestedDevice || null,
    overview: { ...overview, avgAttentionMs: overview.sessions ? Math.round(overview.activeTimeMs / overview.sessions) : null, avgDwellMs: filtered.length ? Math.round(filtered.filter(e=>['page_dwell','page_exit','page_hidden'].includes(e.event)).reduce((a,e)=>a+durationMs(e.metadata?.duration_ms),0) / Math.max(1, overview.sessions)) : null, bounceRate: bounceSessions.size ? Math.round(bounced / bounceSessions.size * 1000) / 10 : null },
    comparison: dashboardComparison(overview, previousOverview),
    pages,
    pageCatalog,
    trend: bucketTrend(filtered, Math.min(90, Math.max(1, Math.ceil((range.to-range.from)/86400000)+1)), range.to)
  };
});

app.get('/api/projects/:projectId/heatmaps-v2', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const range = analyticsRange(request.query);
  const allEvents = await projectEventsBetween(request.params.projectId, range.from.toISOString(), range.to.toISOString());
  const page = String(request.query?.page || '').trim();
  const device = String(request.query?.device || '').trim().toLowerCase();
  const pageCatalog = pageAnalytics(allEvents);
  const deviceCounts = ['desktop','mobile','tablet'].map(name => ({
    name,
    count: new Set(allEvents.filter(e => String(e.metadata?.device || '').toLowerCase() === name).map(e => e.session_id).filter(Boolean)).size,
    points: allEvents.filter(e => String(e.metadata?.device || '').toLowerCase() === name && ['click','rage_click','dead_click'].includes(e.event)).length
  }));
  const events = allEvents.filter(e => (!page || pageIdentity(e).pagePath === page) && (!device || String(e.metadata?.device || '').toLowerCase() === device));
  const points = events.filter(e => ['click','rage_click','dead_click'].includes(e.event)).map(e => {
    const identity = pageIdentity(e); const meta = e.metadata || {};
    return { id:e.id, page:identity.pagePath, pageName:identity.pageName, pageTitle:identity.pageTitle, event_type:e.event, device:String(meta.device||'').toLowerCase()||null,
      x:finiteNumber(meta.x), y:finiteNumber(meta.y), document_x:finiteNumber(meta.document_x), document_y:finiteNumber(meta.document_y), document_width:finiteNumber(meta.document_width), document_height:finiteNumber(meta.document_height),
      viewport_width:finiteNumber(meta.viewport_width), viewport_height:finiteNumber(meta.viewport_height), element:e.element, element_text:e.element_text, element_key:meta.element_key || null, section:meta.section || null, created_at:e.created_at };
  });
  const scrollByPage = pageAnalytics(events).map(p => ({ page:p.pagePath, pageName:p.pageName, pageTitle:p.pageTitle, scrollMax:p.scrollMax }));
  return { project_id:request.params.projectId, page:page||null, device:device||null, pages:pageCatalog, devices:deviceCounts, points, elements:elementAnalytics(events), scroll:scrollByPage, sections:groupSections(events), issues:uniqueUxIssuesCompat(events) };
});

app.get('/api/projects/:projectId/sessions-v2', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const range = analyticsRange(request.query);
  const [sessionsResult, events] = await Promise.all([
    supabase.from('sessions').select('*').eq('project_id', request.params.projectId).gte('last_seen_at', range.from.toISOString()).lte('last_seen_at', range.to.toISOString()).order('last_seen_at',{ascending:false}).limit(300),
    projectEventsBetween(request.params.projectId, range.from.toISOString(), range.to.toISOString())
  ]);
  if (sessionsResult.error) throw sessionsResult.error;
  const page = String(request.query?.page || '').trim();
  const device = String(request.query?.device || '').trim().toLowerCase();
  const journeys = buildSessionJourneys(events, sessionsResult.data || []).filter((row) => (!page || row.pages.includes(page)) && (!device || String(row.device || '').toLowerCase() === device));
  return { sessions: journeys, pages: pageAnalytics(events), devices: deviceMix(events) };
});

app.get('/api/projects/:projectId/tasks-v2', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const range = analyticsRange(request.query);
  let events = await projectEventsBetween(request.params.projectId, range.from.toISOString(), range.to.toISOString());
  const page = String(request.query?.page || '').trim();
  const device = String(request.query?.device || '').trim().toLowerCase();
  events = events.filter((e) => (!page || pageIdentity(e).pagePath === page) && (!device || String(e.metadata?.device || '').toLowerCase() === device));
  return taskAnalytics(events);
});

app.get('/api/projects/:projectId/surveys', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const result = await supabase.from('surveys').select('*').eq('project_id', request.params.projectId).order('created_at',{ascending:false});
  if (result.error) throw result.error;
  return result.data || [];
});

app.post('/api/projects/:projectId/surveys', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const b=request.body||{};
  const result=await supabase.from('surveys').insert({ project_id:request.params.projectId,name:String(b.name||'Survey').slice(0,120),survey_type:b.survey_type||'csat',question:String(b.question||'How was your experience?').slice(0,500),page_path:b.page_path||null,trigger_type:b.trigger_type||'page',delay_ms:Math.max(0,Math.min(Number(b.delay_ms||0),3600000)),scale_min:b.scale_min??1,scale_max:b.scale_max??5,options:Array.isArray(b.options)?b.options:[],placeholder:b.placeholder||null,status:b.status||'DRAFT',metadata:b.metadata||{} }).select('*').single();
  if(result.error) throw result.error; reply.code(201); return result.data;
});

app.patch('/api/projects/:projectId/surveys/:surveyId', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const allowed=['name','survey_type','question','page_path','trigger_type','delay_ms','scale_min','scale_max','options','placeholder','status','metadata']; const update={updated_at:now()};
  for(const key of allowed) if(Object.prototype.hasOwnProperty.call(request.body||{},key)) update[key]=request.body[key];
  const result=await supabase.from('surveys').update(update).eq('id',request.params.surveyId).eq('project_id',request.params.projectId).select('*').single();
  if(result.error) throw result.error; return result.data;
});

app.get('/api/track/surveys', async (request, reply) => {
  const project=await projectForKey(request.query?.tracking_key, request.headers.origin); if(!project) return reply.code(404).send({surveys:[]});
  const page=String(request.query?.page||'/'); const result=await supabase.from('surveys').select('id,name,survey_type,question,page_path,trigger_type,delay_ms,scale_min,scale_max,options,placeholder').eq('project_id',project.id).eq('status','ACTIVE').order('created_at',{ascending:false}).limit(10);
  if(result.error) throw result.error; return {surveys:(result.data||[]).filter(s=>!s.page_path||s.page_path===page)};
});

app.get('/api/projects/:projectId/feedback-v2', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const range=analyticsRange(request.query); let query=supabase.from('feedback').select('*').eq('project_id',request.params.projectId).gte('created_at',range.from.toISOString()).lte('created_at',range.to.toISOString()).order('created_at',{ascending:false}).limit(1000); const result=await query; if(result.error) throw result.error;
  const pageFilter=String(request.query?.page||'').trim(); const deviceFilter=String(request.query?.device||'').trim().toLowerCase();
  const rows=(result.data||[]).filter((row)=>(!pageFilter||row.page===pageFilter)&&(!deviceFilter||String(row.metadata?.device||'').toLowerCase()===deviceFilter)); const byType={}; for(const row of rows){const type=row.survey_type||'custom';const b=byType[type]||{type,responses:0,scores:[],pages:{}};b.responses+=1;if(Number.isFinite(Number(row.score)))b.scores.push(Number(row.score));const page=row.page||'/';b.pages[page]=(b.pages[page]||0)+1;byType[type]=b;}
  return {responses:rows.length,summary:Object.values(byType).map(b=>({type:b.type,responses:b.responses,averageScore:b.scores.length?Math.round(b.scores.reduce((a,c)=>a+c,0)/b.scores.length*100)/100:null,pages:b.pages})),feedback:rows};
});

app.get('/api/projects/:projectId/funnels', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const funnels=await supabase.from('funnels').select('*').eq('project_id',request.params.projectId).order('created_at',{ascending:false}); if(funnels.error) throw funnels.error;
  const out=[]; for(const funnel of funnels.data||[]){const steps=await supabase.from('funnel_steps').select('*').eq('funnel_id',funnel.id).order('position');if(steps.error) throw steps.error;out.push({...funnel,steps:steps.data||[]})} return out;
});

app.post('/api/projects/:projectId/funnels', { preHandler: requireUser }, async (request, reply) => {
  const project=await authorizedProject(request, reply); if(!project)return; const token=crypto.randomUUID();
  const result=await supabase.from('funnels').insert({project_id:project.id,name:String(request.body?.name||'New funnel').slice(0,120),status:'DRAFT',recording_token:token,metadata:{mode:request.body?.mode||'record'}}).select('*').single(); if(result.error)throw result.error;
  const base=project.domain?(project.domain.includes('://')?project.domain:`https://${project.domain}`):null; const launch_url=base?`${base}${base.includes('?')?'&':'?'}datatalk_record_funnel=${encodeURIComponent(token)}`:null; reply.code(201); return {...result.data,launch_url};
});

app.post('/api/projects/:projectId/funnels/:funnelId/finalize-recording', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const f=await supabase.from('funnels').select('*').eq('id',request.params.funnelId).eq('project_id',request.params.projectId).maybeSingle();if(f.error)throw f.error;if(!f.data)throw new ApiError(404,'FUNNEL_NOT_FOUND');
  const events=await projectEvents(request.params.projectId,1000,{includeSetup:true}); const recorded=events.filter(e=>e.metadata?.funnel_recording_token===f.data.recording_token).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  const candidates=[]; const seen=new Set();
  for(const e of recorded){let step=null;if(e.event==='page_view')step={name:e.metadata?.page_title||pageIdentity(e).pagePath,step_type:'page',condition:{path:pageIdentity(e).pagePath}};else if(e.event==='click'&&(e.metadata?.element_key||e.element_text))step={name:e.element_text||e.metadata?.element_key,step_type:'element',condition:{element_key:e.metadata?.element_key||null,label:e.element_text||null}};if(!step)continue;const key=JSON.stringify(step.condition);if(seen.has(key))continue;seen.add(key);candidates.push(step)}
  await supabase.from('funnel_steps').delete().eq('funnel_id',f.data.id); if(candidates.length){const rows=candidates.slice(0,12).map((x,i)=>({funnel_id:f.data.id,position:i+1,...x}));const ins=await supabase.from('funnel_steps').insert(rows);if(ins.error)throw ins.error;}
  const upd=await supabase.from('funnels').update({status:'ACTIVE',updated_at:now()}).eq('id',f.data.id).select('*').single();if(upd.error)throw upd.error;return {...upd.data,steps:candidates.slice(0,12)};
});

app.get('/api/projects/:projectId/funnels/:funnelId/analytics', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const f=await supabase.from('funnels').select('*').eq('id',request.params.funnelId).eq('project_id',request.params.projectId).maybeSingle();if(f.error)throw f.error;if(!f.data)throw new ApiError(404,'FUNNEL_NOT_FOUND');
  const steps=await supabase.from('funnel_steps').select('*').eq('funnel_id',f.data.id).order('position');if(steps.error)throw steps.error;const range=analyticsRange(request.query);const events=await projectEventsBetween(request.params.projectId,range.from.toISOString(),range.to.toISOString());return funnelAnalytics(events,f.data,steps.data||[]);
});

function uniqueUxIssuesCompat(events){ return uxHealth(events).issues; }

app.get('/api/projects/:projectId/ai-insights', { preHandler: requireUser }, async (request, reply) => {
  if (!(await authorizedProject(request, reply))) return;
  const events = await projectEvents(request.params.projectId);
  const overview = aggregateOverview(events);
  const pages = groupPages(events);
  const sections = groupSections(events);
  const insights = [];
  const frictionPage = pages.find((page) => page.rageClicks > 0 || page.deadClicks > 0);
  if (frictionPage) insights.push({ severity: frictionPage.rageClicks >= 10 ? 'HIGH' : 'MEDIUM', title: `Interaction friction on ${frictionPage.page}`, evidence: { views: frictionPage.views, activeTimeMs: frictionPage.activeTimeMs, rageClicks: frictionPage.rageClicks, deadClicks: frictionPage.deadClicks }, recommendation: 'Inspect the page heatmap and affected sessions before changing the UI.' });
  const attentionSection = sections[0];
  if (attentionSection) insights.push({ severity: 'MEDIUM', title: `High attention on ${attentionSection.section}`, evidence: { page: attentionSection.page, attentionMs: attentionSection.attentionMs, clicks: attentionSection.clicks }, recommendation: 'Review whether the section is helping users decide or causing hesitation.' });
  if (overview.taskSuccessRate !== null && overview.taskSuccessRate < 70) insights.push({ severity: 'HIGH', title: 'Critical task completion is below target', evidence: { taskSuccessRate: overview.taskSuccessRate }, recommendation: 'Review task step timing, errors and backtracking before redesign.' });
  return { project_id: request.params.projectId, generated_at: now(), insights };
});

app.setErrorHandler((error, request, reply) => {
  const status = error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
  request.log.error({ code: error.code, status, requestId: request.id }, 'Request failed');
  const code = error instanceof ApiError ? error.code : status === 429 ? 'RATE_LIMITED' : status < 500 ? 'INVALID_REQUEST' : 'INTERNAL_ERROR';
  reply.code(status).send({ error: code, code, request_id: request.id });
});
return app;
}
