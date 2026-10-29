import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('UX health gauge is compact and task completion is surfaced in Task Efficiency',()=>{
 const s=read('components/RealOverviewDashboard.tsx'); const css=read('app/globals.css'); const tasks=read('app/tasks/page.tsx');
 assert.match(s,/Array\.from\(\{length:25\}/); assert.match(s,/Tỷ lệ hoàn thành/); assert.match(css,/\.ux-arc-gauge/); assert.match(tasks,/Chưa có task tracking/);
});

test('heatmap uses a single top-level device filter and defaults to desktop when available',()=>{
 const s=read('app/heatmaps/page.tsx');
 assert.match(s,/fallbackDevice=availableDevices\.find\(d=>d\.name==='desktop'\)/); assert.doesNotMatch(s,/Chọn giao diện thiết bị/); assert.match(s,/PointInspector/); assert.match(s,/ArrowUpDown/);
});

test('session cards show session time instead of browser and os',()=>{
 const s=read('app/sessions/page.tsx');
 assert.match(s,/sessionTime/); assert.doesNotMatch(s,/current\.browser/); assert.doesNotMatch(s,/current\.os/); assert.match(s,/pageDisplayName/);
});

test('analytics KPI cards expose previous-period comparison copy',()=>{
 const s=read('app/analytics/page.tsx');
 assert.match(s,/so với kỳ trước/); assert.match(s,/avgAttentionMs/); assert.match(s,/bounceRate/); assert.match(s,/analytics-kpi-delta/);
});

test('feedback surveys can be edited toggled and deleted with confirmation',()=>{
 const s=read('app/feedback/page.tsx');
 assert.match(s,/survey-toggle/); assert.match(s,/Chỉnh sửa khảo sát/); assert.match(s,/deleteConfirmed/); assert.match(s,/Xóa khảo sát và dữ liệu/);
});
