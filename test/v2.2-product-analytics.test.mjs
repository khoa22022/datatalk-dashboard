import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { uxHealth, pageAnalytics, taskAnalytics } from '../src/v2/analytics-v22.js';

test('UX health starts at 100 after tracking and subtracts unique issues only', () => {
  const base={created_at:'2026-10-05T00:00:00Z',page:'/pricing',session_id:'s1',visitor_id:'u1',metadata:{element_key:'id:buy'}};
  assert.equal(uxHealth([]).score,null);
  assert.equal(uxHealth([{...base,event:'page_view'}]).score,100);
  assert.equal(uxHealth([{...base,event:'page_view'},{...base,event:'dead_click'},{...base,event:'dead_click'}]).score,99);
});

test('page analytics separates routes and task analytics returns real completion rates', () => {
  const events=[
    {event:'page_view',page:'/',created_at:'2026-10-05T00:00:00Z',session_id:'s1',visitor_id:'u1',metadata:{page_path:'/',page_title:'Home'}},
    {event:'page_view',page:'/pricing',created_at:'2026-10-05T00:00:01Z',session_id:'s1',visitor_id:'u1',metadata:{page_path:'/pricing',page_title:'Pricing'}},
    {event:'task_start',page:'/pricing',created_at:'2026-10-05T00:00:02Z',session_id:'s1',visitor_id:'u1',metadata:{task:'checkout'}},
    {event:'task_complete',page:'/success',created_at:'2026-10-05T00:00:07Z',session_id:'s1',visitor_id:'u1',metadata:{task:'checkout'}}
  ];
  assert.equal(pageAnalytics(events).length,3);
  assert.equal(taskAnalytics(events)[0].successRate,100);
});

test('V2.2 migration upgrades existing funnels table instead of assuming a new database', () => {
  const sql=fs.readFileSync(new URL('../../database/database/v2.2_product_analytics.sql',import.meta.url),'utf8');
  assert.match(sql,/alter table if exists public\.funnels add column if not exists status/);
  assert.match(sql,/create table if not exists public\.funnel_steps/);
  assert.match(sql,/revoke all on table public\.surveys from anon, authenticated/);
});
