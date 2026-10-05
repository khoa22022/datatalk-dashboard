const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const ms = (value) => Math.min(Math.max(n(value, 0), 0), 300000);
const eventTime = (row) => new Date(row.created_at).getTime();

export function pageIdentity(event) {
  const meta = event?.metadata || {};
  const path = String(meta.page_path || event?.page || '/').split('?')[0].split('#')[0] || '/';
  const clean = (value) => {
    const text = String(value || '').trim();
    if (!text || text === '/' || text === path || /^(untitled|page)$/i.test(text)) return null;
    return text.slice(0, 180);
  };
  return {
    page: path,
    pagePath: path,
    pageUrl: meta.page_url || null,
    pageTitle: clean(meta.page_title),
    pageName: clean(meta.page_name) || clean(meta.page_title),
    routeGroup: clean(meta.page_route_group) || path
  };
}

export function uniqueUxIssues(events) {
  const issues = new Map();
  for (const event of events) {
    if (!['rage_click', 'dead_click', 'task_error', 'task_fail', 'task_abandon'].includes(event.event)) continue;
    const page = pageIdentity(event).pagePath;
    const element = String(event.metadata?.element_key || event.element_text || event.element || 'page').slice(0, 180);
    const task = event.metadata?.task ? `:${event.metadata.task}` : '';
    const key = `${event.event}:${page}:${element}${task}`;
    const row = issues.get(key) || { key, type: event.event, page, element, task: event.metadata?.task || null, occurrences: 0, firstSeenAt: event.created_at, lastSeenAt: event.created_at };
    row.occurrences += 1;
    if (eventTime(event) < new Date(row.firstSeenAt).getTime()) row.firstSeenAt = event.created_at;
    if (eventTime(event) > new Date(row.lastSeenAt).getTime()) row.lastSeenAt = event.created_at;
    issues.set(key, row);
  }
  return [...issues.values()].sort((a, b) => b.occurrences - a.occurrences);
}

export function uxHealth(events) {
  if (!events.length) return { score: null, issueCount: 0, issues: [] };
  const issues = uniqueUxIssues(events);
  return { score: 100 - issues.length, issueCount: issues.length, issues };
}

export function pageAnalytics(events) {
  const map = new Map();
  for (const event of events) {
    const id = pageIdentity(event);
    const row = map.get(id.pagePath) || { ...id, views: 0, users: new Set(), sessions: new Set(), activeTimeMs: 0, dwellTimeMs: 0, clicks: 0, rageClicks: 0, deadClicks: 0, scrollMax: 0, firstSeenAt: event.created_at, lastSeenAt: event.created_at };
    if (event.visitor_id) row.users.add(event.visitor_id);
    if (event.session_id) row.sessions.add(event.session_id);
    if (event.event === 'page_view') row.views += 1;
    if (event.event === 'page_heartbeat') row.activeTimeMs += ms(event.metadata?.duration_ms);
    if (['page_dwell', 'page_exit', 'page_hidden'].includes(event.event)) row.dwellTimeMs += ms(event.metadata?.duration_ms);
    if (event.event === 'click') row.clicks += 1;
    if (event.event === 'rage_click') row.rageClicks += 1;
    if (event.event === 'dead_click') row.deadClicks += 1;
    if (event.event === 'scroll') row.scrollMax = Math.max(row.scrollMax, n(event.metadata?.depth, 0));
    if (eventTime(event) > new Date(row.lastSeenAt).getTime()) row.lastSeenAt = event.created_at;
    if (event.metadata?.page_title) row.pageTitle = event.metadata.page_title;
    if (event.metadata?.page_name) row.pageName = event.metadata.page_name;
    if (event.metadata?.page_url) row.pageUrl = event.metadata.page_url;
    map.set(id.pagePath, row);
  }
  return [...map.values()].map(row => ({ ...row, users: row.users.size, sessions: row.sessions.size, avgAttentionMs: row.sessions.size ? Math.round(row.activeTimeMs / row.sessions.size) : null, avgDwellMs: row.sessions.size ? Math.round(row.dwellTimeMs / row.sessions.size) : null, friction: row.rageClicks + row.deadClicks })).sort((a, b) => b.views - a.views || b.activeTimeMs - a.activeTimeMs);
}

export function elementAnalytics(events) {
  const map = new Map();
  for (const event of events) {
    if (!['click', 'rage_click', 'dead_click'].includes(event.event)) continue;
    const page = pageIdentity(event).pagePath;
    const meta = event.metadata || {};
    const keyPart = String(meta.element_key || meta.element_id || meta.element_testid || event.element_text || event.element || 'unknown').slice(0, 180);
    const key = `${page}::${keyPart}`;
    const row = map.get(key) || { key, page, element: event.element || null, label: event.element_text || meta.element_label || keyPart, selectorHint: meta.element_key || null, clicks: 0, rageClicks: 0, deadClicks: 0, x: n(meta.x, null), y: n(meta.y, null) };
    if (event.event === 'click') row.clicks += 1;
    if (event.event === 'rage_click') row.rageClicks += 1;
    if (event.event === 'dead_click') row.deadClicks += 1;
    map.set(key, row);
  }
  return [...map.values()].map(row => ({ ...row, confusionScore: row.deadClicks * 2 + row.rageClicks * 3, signal: row.rageClicks > 0 ? 'rage' : row.deadClicks > 0 ? 'dead' : row.clicks > 0 ? 'engaged' : 'low' })).sort((a, b) => (b.clicks + b.confusionScore) - (a.clicks + a.confusionScore));
}

export function buildSessionJourneys(events, sessions = []) {
  const bySession = new Map();
  for (const event of [...events].sort((a, b) => eventTime(a) - eventTime(b))) {
    if (!event.session_id) continue;
    const list = bySession.get(event.session_id) || [];
    list.push(event);
    bySession.set(event.session_id, list);
  }
  const sessionMap = new Map(sessions.map(s => [s.session_key, s]));
  return [...bySession.entries()].map(([sessionKey, rows]) => {
    const session = sessionMap.get(sessionKey) || {};
    const first = rows[0]; const last = rows[rows.length - 1];
    const important = rows.filter(e => ['page_view','click','rage_click','dead_click','task_start','task_step','task_complete','task_error','task_fail','task_abandon','feedback_submit'].includes(e.event));
    const timeline = important.map((event, i) => ({
      id: event.id, event: event.event, at: event.created_at, elapsedMs: Math.max(0, eventTime(event) - eventTime(first)), page: pageIdentity(event).pagePath,
      pageTitle: pageIdentity(event).pageTitle, pageName: pageIdentity(event).pageName, element: event.element_text || event.element || null, task: event.metadata?.task || null, step: event.metadata?.step || null,
      durationMs: ms(event.metadata?.duration_ms)
    }));
    return {
      session_key: sessionKey, visitor_id: session.visitor_id || first.visitor_id || null, device: session.device || first.metadata?.device || null,
      browser: session.browser || first.metadata?.browser || null, os: session.os || first.metadata?.os || null, country: session.country || first.metadata?.country || null,
      city: session.city || first.metadata?.city || null, region: session.region || first.metadata?.region || null, timezone: session.timezone || first.metadata?.timezone || null,
      startedAt: first.created_at, endedAt: last.created_at, durationMs: Math.max(0, eventTime(last) - eventTime(first)), eventCount: rows.length,
      firstPage: pageIdentity(first).pagePath, firstPageName: pageIdentity(first).pageName, lastPage: pageIdentity(last).pagePath, lastPageName: pageIdentity(last).pageName,
      firstAction: timeline.find(x => x.event !== 'page_view') || timeline[0] || null, lastAction: [...timeline].reverse().find(x => x.event !== 'page_view') || timeline[timeline.length - 1] || null,
      pages: [...new Set(rows.map(e => pageIdentity(e).pagePath))], pageCount: new Set(rows.map(e => pageIdentity(e).pagePath)).size, timeline
    };
  }).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

export function taskAnalytics(events) {
  const tasks = new Map();
  const state = new Map();
  const ordered = [...events].sort((a, b) => eventTime(a) - eventTime(b));
  for (const event of ordered) {
    const task = event.metadata?.task;
    if (!task) continue;
    const row = tasks.get(task) || { task, starts: 0, completes: 0, fails: 0, abandons: 0, errors: 0, backtracks: 0, retries: 0, durations: [], steps: new Map(), participants: new Set(), sessions: new Set() };
    if (event.visitor_id) row.participants.add(event.visitor_id); if (event.session_id) row.sessions.add(event.session_id);
    const stateKey = `${event.session_id || ''}:${task}`;
    if (event.event === 'task_start') { row.starts += 1; if (state.has(stateKey)) row.retries += 1; state.set(stateKey, eventTime(event)); }
    if (event.event === 'task_step') { const step = String(event.metadata?.step || 'step'); const s = row.steps.get(step) || { step, count: 0, durationMs: 0, errors: 0, dropoffs: 0 }; s.count += 1; s.durationMs += ms(event.metadata?.duration_ms); row.steps.set(step, s); }
    if (event.event === 'task_error') { row.errors += 1; const step = String(event.metadata?.step || 'step'); const s = row.steps.get(step) || { step, count: 0, durationMs: 0, errors: 0, dropoffs: 0 }; s.errors += 1; row.steps.set(step, s); }
    if (event.event === 'task_backtrack') row.backtracks += 1;
    if (event.event === 'task_complete') { row.completes += 1; const start = state.get(stateKey); if (start) row.durations.push(Math.max(0, eventTime(event) - start)); state.delete(stateKey); }
    if (event.event === 'task_fail') { row.fails += 1; state.delete(stateKey); }
    if (event.event === 'task_abandon') { row.abandons += 1; const step = String(event.metadata?.step || 'unknown'); const s = row.steps.get(step) || { step, count: 0, durationMs: 0, errors: 0, dropoffs: 0 }; s.dropoffs += 1; row.steps.set(step, s); state.delete(stateKey); }
    tasks.set(task, row);
  }
  return [...tasks.values()].map(row => ({ task: row.task, starts: row.starts, completes: row.completes, fails: row.fails, abandons: row.abandons, errors: row.errors, backtracks: row.backtracks, retries: row.retries, users: row.participants.size, sessions: row.sessions.size, successRate: row.starts ? Math.round(row.completes / row.starts * 1000) / 10 : null, dropoffRate: row.starts ? Math.round((row.fails + row.abandons) / row.starts * 1000) / 10 : null, medianCompletionTimeMs: row.durations.length ? median(row.durations) : null, steps: [...row.steps.values()].sort((a,b)=>b.count-a.count) })).sort((a,b)=>b.starts-a.starts);
}

function median(values) { const sorted=[...values].sort((a,b)=>a-b); const mid=Math.floor(sorted.length/2); return sorted.length%2?sorted[mid]:Math.round((sorted[mid-1]+sorted[mid])/2); }

export function funnelAnalytics(events, funnel, steps) {
  const orderedSteps = [...steps].sort((a,b)=>a.position-b.position);
  const bySession = new Map();
  for (const event of [...events].sort((a,b)=>eventTime(a)-eventTime(b))) { if (!event.session_id) continue; const list=bySession.get(event.session_id)||[]; list.push(event); bySession.set(event.session_id,list); }
  const counts = orderedSteps.map(()=>new Set()); const durations = orderedSteps.map(()=>[]);
  for (const [sessionId, rows] of bySession) {
    let cursor=0; let previousAt=null;
    for (const event of rows) {
      if (cursor>=orderedSteps.length) break;
      const step=orderedSteps[cursor]; if (!matchesStep(event, step)) continue;
      counts[cursor].add(sessionId); if (previousAt!=null) durations[cursor].push(eventTime(event)-previousAt); previousAt=eventTime(event); cursor += 1;
    }
  }
  return { id:funnel.id, name:funnel.name, status:funnel.status, steps: orderedSteps.map((step,index)=>{ const users=counts[index].size; const prev=index?counts[index-1].size:users; return { ...step, users, conversionRate:index===0?(users?100:null):(prev?Math.round(users/prev*1000)/10:null), dropoffRate:index===0?0:(prev?Math.round((prev-users)/prev*1000)/10:null), avgTimeFromPreviousMs:durations[index].length?Math.round(durations[index].reduce((a,b)=>a+b,0)/durations[index].length):null }; }) };
}

function matchesStep(event, step) {
  const condition=step.condition||{};
  if (step.step_type==='page') return pageIdentity(event).pagePath===condition.path && event.event==='page_view';
  if (step.step_type==='event') return event.event===condition.event;
  if (step.step_type==='element') return event.event==='click' && (event.metadata?.element_key===condition.element_key || event.element_text===condition.label);
  if (step.step_type==='task') return event.event===condition.event && event.metadata?.task===condition.task;
  return false;
}
