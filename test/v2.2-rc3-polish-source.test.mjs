import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('quick filter typography and today active state are implemented',()=>{
 const f=read('components/AnalyticsFilters.tsx'); const css=read('app/globals.css');
 assert.match(f,/Hôm nay/); assert.match(f,/aria-pressed/); assert.match(css,/\.analytics-filter-title,\.date-field>span/);
});
test('UX health uses real score and compact segmented gauge',()=>{
 const s=read('components/RealOverviewDashboard.tsx');
 assert.match(s,/healthScore=hasEvents/); assert.match(s,/UXHealthCard/); assert.match(s,/ux-arc-gauge/); assert.match(s,/Rage \/ dead clicks/);
});
test('analytics uses readable page identity and complete Vietnamese labels',()=>{
 const s=read('app/analytics/page.tsx');
 assert.match(s,/pageDisplayName/); assert.match(s,/Thời gian ở lại TB/); assert.match(s,/Đường dẫn/); assert.match(s,/Click không phản hồi/);
});
test('heatmap defaults to a usable page/device and exposes point inspection',()=>{
 const s=read('app/heatmaps/page.tsx');
 assert.match(s,/effectivePage=filter\.page/); assert.match(s,/fallbackDevice/); assert.match(s,/PointInspector/); assert.match(s,/deviceCounts/);
});
test('sessions prioritize time and readable page identity',()=>{
 const s=read('app/sessions/page.tsx');
 assert.match(s,/Chưa xác định thiết bị/); assert.match(s,/sessionTime/); assert.match(s,/pageDisplayName/); assert.match(s,/eventLabel/);
});
