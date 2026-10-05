const EVENT_MAX = 80;
const META_MAX_KEYS = 40;

export function normalizeTrialEvent(input = {}) {
  const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
  const bounded = Object.fromEntries(Object.entries(metadata).slice(0, META_MAX_KEYS));
  return {
    event: String(input.event || 'custom').slice(0, EVENT_MAX),
    page: input.page ? String(input.page).slice(0, 500) : '/',
    session_id: input.session_id ? String(input.session_id).slice(0, 120) : null,
    visitor_id: input.visitor_id ? String(input.visitor_id).slice(0, 120) : null,
    element: input.element ? String(input.element).slice(0, 200) : null,
    element_text: input.element_text ? String(input.element_text).slice(0, 300) : null,
    metadata: bounded
  };
}

function durationMs(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 300000) : 0;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function aggregateTrialEvents(events = []) {
  const overview = {
    visitors: new Set(events.map((x) => x.visitor_id).filter(Boolean)).size,
    sessions: new Set(events.map((x) => x.session_id).filter(Boolean)).size,
    pageViews: events.filter((x) => x.event === 'page_view').length,
    clicks: events.filter((x) => x.event === 'click').length,
    rageClicks: events.filter((x) => x.event === 'rage_click').length,
    deadClicks: events.filter((x) => x.event === 'dead_click').length,
    scrolls: events.filter((x) => x.event === 'scroll').length,
    activeTimeMs: events.filter((x) => x.event === 'page_heartbeat').reduce((sum, x) => sum + durationMs(x.metadata?.duration_ms), 0),
    sectionAttentionMs: events.filter((x) => ['section_exit', 'section_heartbeat'].includes(x.event)).reduce((sum, x) => sum + durationMs(x.metadata?.duration_ms), 0),
    taskStarts: events.filter((x) => x.event === 'task_start').length,
    taskCompletions: events.filter((x) => x.event === 'task_complete').length
  };
  overview.taskSuccessRate = overview.taskStarts ? Math.round((overview.taskCompletions / overview.taskStarts) * 1000) / 10 : null;

  const pages = new Map();
  const sections = new Map();
  const tasks = new Map();
  const taskStarts = new Map();
  const sessions = new Set();

  for (const event of events) {
    if (event.session_id) sessions.add(event.session_id);
    if (event.page) {
      const page = pages.get(event.page) || { page: event.page, views: 0, activeTimeMs: 0, dwellTimeMs: 0, clicks: 0, rageClicks: 0, deadClicks: 0, scrollMax: 0 };
      if (event.event === 'page_view') page.views += 1;
      if (event.event === 'page_heartbeat') page.activeTimeMs += durationMs(event.metadata?.duration_ms);
      if (['page_dwell', 'page_exit', 'page_hidden'].includes(event.event)) page.dwellTimeMs += durationMs(event.metadata?.duration_ms);
      if (event.event === 'click') page.clicks += 1;
      if (event.event === 'rage_click') page.rageClicks += 1;
      if (event.event === 'dead_click') page.deadClicks += 1;
      if (event.event === 'scroll') page.scrollMax = Math.max(page.scrollMax, Number(event.metadata?.depth) || 0);
      pages.set(event.page, page);
    }
    const section = event.metadata?.section;
    if (section) {
      const key = `${event.page || '/'}::${section}`;
      const row = sections.get(key) || { page: event.page || '/', section, views: 0, attentionMs: 0, clicks: 0, rageClicks: 0, deadClicks: 0 };
      if (event.event === 'section_view') row.views += 1;
      if (['section_exit', 'section_heartbeat'].includes(event.event)) row.attentionMs += durationMs(event.metadata?.duration_ms);
      if (event.event === 'click') row.clicks += 1;
      if (event.event === 'rage_click') row.rageClicks += 1;
      if (event.event === 'dead_click') row.deadClicks += 1;
      sections.set(key, row);
    }
    const task = event.metadata?.task;
    if (task) {
      const row = tasks.get(task) || { task, starts: 0, steps: 0, errors: 0, completes: 0, backtracks: 0, completionTimes: [] };
      const key = `${event.session_id || ''}:${task}`;
      if (event.event === 'task_start') { row.starts += 1; taskStarts.set(key, Date.parse(event.created_at || new Date().toISOString())); }
      if (event.event === 'task_step') row.steps += 1;
      if (event.event === 'task_error') row.errors += 1;
      if (event.event === 'task_backtrack') row.backtracks += 1;
      if (event.event === 'task_complete') {
        row.completes += 1;
        const start = taskStarts.get(key);
        if (start) row.completionTimes.push(Math.max(0, Date.parse(event.created_at || new Date().toISOString()) - start));
      }
      tasks.set(task, row);
    }
  }

  return {
    overview,
    sessions: sessions.size,
    pages: [...pages.values()].sort((a, b) => b.activeTimeMs - a.activeTimeMs),
    sections: [...sections.values()].sort((a, b) => b.attentionMs - a.attentionMs),
    tasks: [...tasks.values()].map((x) => ({
      task: x.task,
      starts: x.starts,
      steps: x.steps,
      errors: x.errors,
      completes: x.completes,
      backtracks: x.backtracks,
      successRate: x.starts ? Math.round((x.completes / x.starts) * 1000) / 10 : 0,
      medianCompletionTimeMs: median(x.completionTimes)
    }))
  };
}

export function buildTrialScenario({ visitor, session, nowMs = Date.now() }) {
  const at = (ms) => new Date(nowMs - ms).toISOString();
  const rows = [
    ['session_start','/pricing',{device:'mobile',browser:'Chrome',country:'Vietnam'},900000],
    ['page_view','/pricing',{},890000],
    ['section_view','/pricing',{section:'pricing-comparison',visibility_ratio:0.8},870000],
    ['section_heartbeat','/pricing',{section:'pricing-comparison',duration_ms:30000},840000],
    ['scroll','/pricing',{depth:72,scroll_y:610},830000],
    ['click','/pricing',{section:'pricing-comparison',x:520,y:360,viewport_width:390,viewport_height:844},810000],
    ['rage_click','/pricing',{section:'pricing-comparison',x:526,y:372,viewport_width:390,viewport_height:844,clicks:4},800000],
    ['dead_click','/pricing',{section:'pricing-comparison',x:530,y:380,viewport_width:390,viewport_height:844},790000],
    ['page_heartbeat','/pricing',{duration_ms:45000},770000],
    ['task_start','/checkout',{task:'checkout'},700000],
    ['task_step','/checkout',{task:'checkout',step:'shipping',duration_ms:42000},650000],
    ['task_error','/checkout',{task:'checkout',step:'payment',code:'invalid_card'},600000],
    ['task_backtrack','/checkout',{task:'checkout',from:'payment',to:'shipping'},590000],
    ['task_step','/checkout',{task:'checkout',step:'payment',duration_ms:88000},560000],
    ['task_complete','/checkout',{task:'checkout',duration_ms:138000},420000],
    ['session_end','/checkout',{duration_ms:260000},360000]
  ];
  const events = rows.map(([event,page,metadata,offset]) => ({
    visitor_id: visitor,
    session_id: session,
    event,
    page,
    element: ['click','rage_click','dead_click'].includes(event) ? 'BUTTON' : null,
    metadata: { ...metadata, trial: true },
    created_at: at(offset)
  }));
  const heatmap = events.filter((x) => ['click','rage_click','dead_click'].includes(x.event)).map((x) => ({
    session_id: session,
    event_type: x.event,
    x: x.metadata.x,
    y: x.metadata.y,
    viewport_width: x.metadata.viewport_width,
    viewport_height: x.metadata.viewport_height,
    page: x.page,
    element: x.element,
    created_at: x.created_at
  }));
  const sessionRow = {
    visitor_id: visitor,
    session_key: session,
    device: 'mobile',
    browser: 'Chrome',
    country: 'Vietnam',
    started_at: at(900000),
    last_seen_at: at(360000),
    ended_at: at(360000)
  };
  return { events, heatmap, session: sessionRow };
}
